package common

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
)

func TestGetEndpointTypesByChannelType_XaiVideo(t *testing.T) {
	endpoints := GetEndpointTypesByChannelType(constant.ChannelTypeXai, "grok-imagine-video")
	want := []constant.EndpointType{constant.EndpointTypeOpenAIVideo}
	if !equalEndpointTypes(endpoints, want) {
		t.Fatalf("endpoints = %v, want %v", endpoints, want)
	}
}

func TestGetEndpointTypesByChannelType_XaiTextDoesNotAdvertiseVideo(t *testing.T) {
	endpoints := GetEndpointTypesByChannelType(constant.ChannelTypeXai, "grok-4")
	for _, endpoint := range endpoints {
		if endpoint == constant.EndpointTypeOpenAIVideo {
			t.Fatalf("endpoints = %v, did not want openai-video", endpoints)
		}
	}
}

func TestGetEndpointTypesByChannelType_XaiImage(t *testing.T) {
	endpoints := GetEndpointTypesByChannelType(constant.ChannelTypeXai, "grok-imagine-image-lite")
	want := []constant.EndpointType{constant.EndpointTypeImageGeneration}
	if !equalEndpointTypes(endpoints, want) {
		t.Fatalf("endpoints = %v, want %v", endpoints, want)
	}
}

func TestGetEndpointTypesByChannelType_ImageEdit(t *testing.T) {
	endpoints := GetEndpointTypesByChannelType(constant.ChannelTypeGemini, "gemini-3.1-flash-image")
	want := []constant.EndpointType{
		constant.EndpointTypeImageGeneration,
		constant.EndpointTypeImageEdit,
	}
	if !equalEndpointTypes(endpoints, want) {
		t.Fatalf("endpoints = %v, want %v", endpoints, want)
	}
}

func TestGetDefaultEndpointInfoOpenAIVideo(t *testing.T) {
	info, ok := GetDefaultEndpointInfo(constant.EndpointTypeOpenAIVideo)
	if !ok {
		t.Fatal("openai-video endpoint info missing")
	}
	if info.Path != "/v1/videos" {
		t.Fatalf("path = %q, want /v1/videos", info.Path)
	}
}

func equalEndpointTypes(a, b []constant.EndpointType) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
