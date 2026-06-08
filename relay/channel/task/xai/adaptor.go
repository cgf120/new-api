package xai

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	taskcommon "github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

const (
	ChannelName = "xai"
	ModelVideo  = "grok-imagine-video"
)

var ModelList = []string{ModelVideo}

type TaskAdaptor struct {
	taskcommon.BaseBilling
	channelType int
	apiKey      string
	baseURL     string
}

type videoResponse struct {
	ID           string `json:"id"`
	TaskID       string `json:"task_id,omitempty"`
	Object       string `json:"object"`
	Model        string `json:"model"`
	Status       string `json:"status"`
	Created      int64  `json:"created"`
	CreatedAt    int64  `json:"created_at"`
	CompletedAt  int64  `json:"completed_at,omitempty"`
	Seconds      any    `json:"seconds,omitempty"`
	Duration     any    `json:"duration,omitempty"`
	URL          string `json:"url,omitempty"`
	PublicURL    string `json:"public_url,omitempty"`
	DownloadURL  string `json:"download_url,omitempty"`
	PrivateURL   string `json:"private_url,omitempty"`
	ShareURL     string `json:"share_url,omitempty"`
	ThumbnailURL string `json:"thumbnail_url,omitempty"`
	Error        *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

func (a *TaskAdaptor) Init(info *relaycommon.RelayInfo) {
	a.channelType = info.ChannelType
	a.apiKey = info.ApiKey
	a.baseURL = info.ChannelBaseUrl
}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) *dto.TaskError {
	return relaycommon.ValidateBasicTaskRequest(c, info, constant.TaskActionTextGenerate)
}

func (a *TaskAdaptor) EstimateBilling(c *gin.Context, _ *relaycommon.RelayInfo) map[string]float64 {
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil
	}
	seconds := resolveSeconds(req)
	if seconds <= 0 {
		return nil
	}
	return map[string]float64{"seconds": float64(seconds)}
}

func (a *TaskAdaptor) BuildRequestURL(_ *relaycommon.RelayInfo) (string, error) {
	return strings.TrimRight(a.baseURL, "/") + "/v1/videos", nil
}

func (a *TaskAdaptor) BuildRequestHeader(_ *gin.Context, req *http.Request, _ *relaycommon.RelayInfo) error {
	req.Header.Set("Authorization", "Bearer "+a.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil, err
	}

	modelName := info.UpstreamModelName
	if modelName == "" {
		modelName = req.Model
	}
	body := map[string]any{
		"model":  modelName,
		"prompt": req.Prompt,
	}
	if seconds := resolveSeconds(req); seconds > 0 {
		body["seconds"] = seconds
	}
	if req.Size != "" {
		body["size"] = req.Size
	}
	if req.Image != "" {
		body["image"] = req.Image
	}
	if req.InputReference != "" {
		body["input_reference"] = req.InputReference
	}
	if len(req.Images) > 0 {
		body["images"] = req.Images
	}
	copyMetadata(body, req.Metadata)

	data, err := common.Marshal(body)
	if err != nil {
		return nil, err
	}
	return bytes.NewReader(data), nil
}

func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error) {
	return channel.DoTaskApiRequest(a, c, info, requestBody)
}

func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (taskID string, taskData []byte, taskErr *dto.TaskError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
	}
	_ = resp.Body.Close()

	var upstream videoResponse
	if err := common.Unmarshal(responseBody, &upstream); err != nil {
		return "", nil, service.TaskErrorWrapper(errors.Wrapf(err, "body: %s", responseBody), "unmarshal_response_body_failed", http.StatusInternalServerError)
	}
	if upstream.Error != nil && isFailureStatus(upstream.Status) {
		return "", nil, service.TaskErrorWrapperLocal(fmt.Errorf("%s", upstream.Error.Message), "upstream_task_failed", http.StatusBadGateway)
	}

	upstreamID := firstNonEmpty(upstream.ID, upstream.TaskID, upstream.URL, upstream.PublicURL)
	if upstreamID == "" {
		return "", nil, service.TaskErrorWrapperLocal(fmt.Errorf("task_id is empty"), "invalid_response", http.StatusInternalServerError)
	}

	openAIVideo := openAIVideoFromResponse(info.PublicTaskID, info.OriginModelName, upstream, nil)
	c.JSON(http.StatusOK, openAIVideo)
	return upstreamID, responseBody, nil
}

func (a *TaskAdaptor) SubmittedTaskInfo(_ *relaycommon.RelayInfo, _ string, taskData []byte) *relaycommon.TaskInfo {
	taskInfo, err := parseTaskInfo(taskData)
	if err != nil {
		return nil
	}
	if taskInfo.Status == model.TaskStatusSuccess && taskInfo.Progress == "" {
		taskInfo.Progress = taskcommon.ProgressComplete
	}
	return taskInfo
}

func (a *TaskAdaptor) FetchTask(baseURL, key string, body map[string]any, proxy string) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok || strings.TrimSpace(taskID) == "" {
		return nil, fmt.Errorf("invalid task_id")
	}

	uri := fmt.Sprintf("%s/v1/videos/%s", strings.TrimRight(baseURL, "/"), taskID)
	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Accept", "application/json")

	client, err := service.GetHttpClientWithProxy(proxy)
	if err != nil {
		return nil, fmt.Errorf("new proxy http client failed: %w", err)
	}
	return client.Do(req)
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	return parseTaskInfo(respBody)
}

func (a *TaskAdaptor) GetModelList() []string {
	return ModelList
}

func (a *TaskAdaptor) GetChannelName() string {
	return ChannelName
}

func (a *TaskAdaptor) ConvertToOpenAIVideo(originTask *model.Task) ([]byte, error) {
	var upstream videoResponse
	if err := common.Unmarshal(originTask.Data, &upstream); err != nil {
		return nil, errors.Wrap(err, "unmarshal xai video task data failed")
	}
	video := openAIVideoFromResponse(originTask.TaskID, originTask.Properties.OriginModelName, upstream, originTask)
	return common.Marshal(video)
}

func parseTaskInfo(respBody []byte) (*relaycommon.TaskInfo, error) {
	var upstream videoResponse
	if err := common.Unmarshal(respBody, &upstream); err != nil {
		return nil, errors.Wrap(err, "unmarshal xai video task result failed")
	}

	status := toTaskStatus(upstream.Status, primaryVideoURL(upstream) != "")
	info := &relaycommon.TaskInfo{
		TaskID:   firstNonEmpty(upstream.ID, upstream.TaskID),
		Status:   string(status),
		Url:      primaryVideoURL(upstream),
		Progress: progressForTaskStatus(status),
	}
	if upstream.Error != nil {
		info.Reason = upstream.Error.Message
	}
	return info, nil
}

func openAIVideoFromResponse(publicID, modelName string, upstream videoResponse, task *model.Task) *dto.OpenAIVideo {
	video := dto.NewOpenAIVideo()
	video.ID = publicID
	video.TaskID = publicID
	video.Model = firstNonEmpty(modelName, upstream.Model)
	video.CreatedAt = upstreamCreatedAt(upstream)
	video.CompletedAt = upstream.CompletedAt
	video.Seconds = stringFromAny(firstNonNil(upstream.Seconds, upstream.Duration))

	status := toVideoStatus(upstream.Status, primaryVideoURL(upstream) != "")
	if task != nil {
		taskStatus := task.Status.ToVideoStatus()
		if taskStatus != dto.VideoStatusUnknown {
			status = taskStatus
		}
		if task.Progress != "" {
			video.SetProgressStr(task.Progress)
		}
		if task.FinishTime > 0 {
			video.CompletedAt = task.FinishTime
		}
		if taskURL := task.GetResultURL(); taskURL != "" {
			video.SetMetadata("url", taskURL)
		}
	}
	video.Status = status
	if video.Progress == 0 && status == dto.VideoStatusCompleted {
		video.Progress = 100
	}
	if video.CompletedAt == 0 && status == dto.VideoStatusCompleted {
		video.CompletedAt = time.Now().Unix()
	}

	setVideoMetadata(video, upstream)
	if upstream.Error != nil {
		video.Error = &dto.OpenAIVideoError{
			Message: upstream.Error.Message,
			Code:    upstream.Error.Code,
		}
	}
	return video
}

func setVideoMetadata(video *dto.OpenAIVideo, upstream videoResponse) {
	if url := primaryVideoURL(upstream); url != "" {
		video.SetMetadata("url", url)
	}
	if upstream.PublicURL != "" {
		video.SetMetadata("public_url", upstream.PublicURL)
	}
	if upstream.DownloadURL != "" {
		video.SetMetadata("download_url", upstream.DownloadURL)
	}
	if upstream.PrivateURL != "" {
		video.SetMetadata("private_url", upstream.PrivateURL)
	}
	if upstream.ShareURL != "" {
		video.SetMetadata("share_url", upstream.ShareURL)
	}
	if upstream.ThumbnailURL != "" {
		video.SetMetadata("thumbnail_url", upstream.ThumbnailURL)
	}
}

func resolveSeconds(req relaycommon.TaskSubmitReq) int {
	if seconds, err := strconv.Atoi(req.Seconds); err == nil && seconds > 0 {
		return seconds
	}
	if req.Duration > 0 {
		return req.Duration
	}
	for _, key := range []string{"seconds", "duration", "video_length", "videoLength"} {
		if seconds := intFromAny(req.Metadata[key]); seconds > 0 {
			return seconds
		}
	}
	return 6
}

func copyMetadata(body map[string]any, metadata map[string]any) {
	for key, value := range metadata {
		switch strings.ToLower(key) {
		case "model", "prompt", "seconds", "duration", "video_length", "videolength":
			continue
		default:
			body[key] = value
		}
	}
}

func intFromAny(value any) int {
	switch v := value.(type) {
	case int:
		return v
	case int64:
		return int(v)
	case float64:
		return int(v)
	case string:
		i, _ := strconv.Atoi(v)
		return i
	default:
		return 0
	}
}

func stringFromAny(value any) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return v
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	default:
		return fmt.Sprint(v)
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func firstNonNil(values ...any) any {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}

func primaryVideoURL(upstream videoResponse) string {
	return firstNonEmpty(upstream.PublicURL, upstream.URL, upstream.DownloadURL, upstream.PrivateURL)
}

func upstreamCreatedAt(upstream videoResponse) int64 {
	if upstream.CreatedAt > 0 {
		return upstream.CreatedAt
	}
	if upstream.Created > 0 {
		return upstream.Created
	}
	return time.Now().Unix()
}

func isFailureStatus(status string) bool {
	status = strings.ToLower(strings.TrimSpace(status))
	return status == "failed" || status == "failure" || status == "cancelled" || status == "canceled"
}

func toTaskStatus(status string, hasURL bool) model.TaskStatus {
	status = strings.ToLower(strings.TrimSpace(status))
	switch status {
	case "succeeded", "success", "completed", "complete":
		return model.TaskStatusSuccess
	case "failed", "failure", "cancelled", "canceled":
		return model.TaskStatusFailure
	case "queued", "pending", "submitted":
		return model.TaskStatusQueued
	case "processing", "running", "in_progress":
		return model.TaskStatusInProgress
	default:
		if hasURL {
			return model.TaskStatusSuccess
		}
		return model.TaskStatusSubmitted
	}
}

func toVideoStatus(status string, hasURL bool) string {
	return toTaskStatus(status, hasURL).ToVideoStatus()
}

func progressForTaskStatus(status model.TaskStatus) string {
	switch status {
	case model.TaskStatusSuccess, model.TaskStatusFailure:
		return taskcommon.ProgressComplete
	case model.TaskStatusQueued, model.TaskStatusSubmitted:
		return taskcommon.ProgressQueued
	case model.TaskStatusInProgress:
		return taskcommon.ProgressInProgress
	default:
		return ""
	}
}
