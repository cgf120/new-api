package xai

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/gin-gonic/gin"
)

func TestParseTaskInfoCompletedVideo(t *testing.T) {
	body := []byte(`{
		"id":"video-1",
		"status":"succeeded",
		"public_url":"https://imagine-public.x.ai/imagine-public/share-videos/video-1.mp4?dl=0"
	}`)

	info, err := parseTaskInfo(body)
	if err != nil {
		t.Fatalf("parseTaskInfo() error = %v", err)
	}
	if info.Status != string(model.TaskStatusSuccess) {
		t.Fatalf("status = %q, want %q", info.Status, model.TaskStatusSuccess)
	}
	if info.Progress != "100%" {
		t.Fatalf("progress = %q, want 100%%", info.Progress)
	}
	if info.Url != "https://imagine-public.x.ai/imagine-public/share-videos/video-1.mp4?dl=0" {
		t.Fatalf("url = %q", info.Url)
	}
}

func TestConvertToOpenAIVideoUsesStoredResultURL(t *testing.T) {
	task := &model.Task{
		TaskID:     "task_public",
		Status:     model.TaskStatusSuccess,
		Progress:   "100%",
		FinishTime: 12345,
		Properties: model.Properties{
			OriginModelName: ModelVideo,
		},
		PrivateData: model.TaskPrivateData{
			ResultURL: "https://example.com/stored.mp4",
		},
		Data: []byte(`{
			"id":"upstream",
			"model":"grok-imagine-video",
			"status":"succeeded",
			"public_url":"https://example.com/public.mp4",
			"download_url":"https://example.com/download.mp4"
		}`),
	}

	data, err := (&TaskAdaptor{}).ConvertToOpenAIVideo(task)
	if err != nil {
		t.Fatalf("ConvertToOpenAIVideo() error = %v", err)
	}

	var video dto.OpenAIVideo
	if err := json.Unmarshal(data, &video); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if video.ID != "task_public" {
		t.Fatalf("id = %q, want task_public", video.ID)
	}
	if video.Status != dto.VideoStatusCompleted {
		t.Fatalf("status = %q, want %q", video.Status, dto.VideoStatusCompleted)
	}
	if video.Metadata["url"] != "https://example.com/public.mp4" {
		t.Fatalf("metadata url = %v", video.Metadata["url"])
	}
	if video.Metadata["download_url"] != "https://example.com/download.mp4" {
		t.Fatalf("download url = %v", video.Metadata["download_url"])
	}
}

func TestResolveSeconds(t *testing.T) {
	if got := resolveSeconds(relayTaskReq("12", 0, nil)); got != 12 {
		t.Fatalf("seconds string = %d, want 12", got)
	}
	if got := resolveSeconds(relayTaskReq("", 8, nil)); got != 8 {
		t.Fatalf("duration = %d, want 8", got)
	}
	if got := resolveSeconds(relayTaskReq("", 0, map[string]any{"videoLength": "5"})); got != 5 {
		t.Fatalf("metadata videoLength = %d, want 5", got)
	}
}

func TestBuildRequestBodyPassesVideoReferenceFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Prompt:      "scene with @图1",
		Model:       ModelVideo,
		Duration:    8,
		ImageURLs:   []string{"https://example.com/one.png"},
		AspectRatio: "16:9",
		Resolution:  "720p",
		Preset:      "custom",
		ImageReferences: []any{
			map[string]any{"url": "/api/canvas/assets/one/content"},
		},
	})

	reader, err := (&TaskAdaptor{}).BuildRequestBody(c, &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: ModelVideo},
	})
	if err != nil {
		t.Fatalf("BuildRequestBody() error = %v", err)
	}
	data, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("ReadAll() error = %v", err)
	}
	var body map[string]any
	if err := json.Unmarshal(data, &body); err != nil {
		t.Fatalf("unmarshal body: %v", err)
	}
	if got := body["aspect_ratio"]; got != "16:9" {
		t.Fatalf("aspect_ratio = %#v", got)
	}
	if got := body["resolution"]; got != "720p" {
		t.Fatalf("resolution = %#v", got)
	}
	if got := body["preset"]; got != "custom" {
		t.Fatalf("preset = %#v", got)
	}
	if got := body["seconds"]; got != float64(8) {
		t.Fatalf("seconds = %#v", got)
	}
	urls, ok := body["image_urls"].([]any)
	if !ok || len(urls) != 1 || urls[0] != "https://example.com/one.png" {
		t.Fatalf("image_urls = %#v", body["image_urls"])
	}
	refs, ok := body["imageReferences"].([]any)
	if !ok || len(refs) != 1 {
		t.Fatalf("imageReferences = %#v", body["imageReferences"])
	}
}

func TestTaskSubmitReqUnmarshalVideoFields(t *testing.T) {
	var req relaycommon.TaskSubmitReq
	if err := json.Unmarshal([]byte(`{
		"model":"grok-imagine-video",
		"prompt":"scene",
		"duration":"8",
		"seconds":6,
		"image_urls":["https://example.com/one.png"],
		"aspect_ratio":"16:9",
		"resolution":"720p",
		"preset":"custom"
	}`), &req); err != nil {
		t.Fatalf("unmarshal TaskSubmitReq: %v", err)
	}
	if req.Duration != 8 {
		t.Fatalf("Duration = %d, want 8", req.Duration)
	}
	if req.Seconds != "6" {
		t.Fatalf("Seconds = %q, want 6", req.Seconds)
	}
	if len(req.ImageURLs) != 1 || req.ImageURLs[0] != "https://example.com/one.png" {
		t.Fatalf("ImageURLs = %#v", req.ImageURLs)
	}
	if req.AspectRatio != "16:9" || req.Resolution != "720p" || req.Preset != "custom" {
		t.Fatalf("video fields = aspect_ratio:%q resolution:%q preset:%q", req.AspectRatio, req.Resolution, req.Preset)
	}
}

func relayTaskReq(seconds string, duration int, metadata map[string]any) relaycommon.TaskSubmitReq {
	return relaycommon.TaskSubmitReq{
		Seconds:  seconds,
		Duration: duration,
		Metadata: metadata,
	}
}
