package xai

import (
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
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

func relayTaskReq(seconds string, duration int, metadata map[string]any) relaycommon.TaskSubmitReq {
	return relaycommon.TaskSubmitReq{
		Seconds:  seconds,
		Duration: duration,
		Metadata: metadata,
	}
}
