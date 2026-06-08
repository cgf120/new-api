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
