package common

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
)

func TestGetEndpointTypesByChannelType_XaiVideo(t *testing.T) {
	endpoints := GetEndpointTypesByChannelType(constant.ChannelTypeXai, "grok-imagine-video")
	if len(endpoints) == 0 || endpoints[0] != constant.EndpointTypeOpenAIVideo {
		t.Fatalf("endpoints = %v, want openai-video first", endpoints)
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
	if len(endpoints) == 0 || endpoints[0] != constant.EndpointTypeImageGeneration {
		t.Fatalf("endpoints = %v, want image-generation first", endpoints)
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
