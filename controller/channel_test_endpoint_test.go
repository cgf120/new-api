package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
)

func TestNormalizeChannelTestEndpointDetectsGrokImage(t *testing.T) {
	endpoint := normalizeChannelTestEndpoint(
		&model.Channel{Type: constant.ChannelTypeXai},
		"grok-imagine-image-lite",
		"",
	)
	if endpoint != string(constant.EndpointTypeImageGeneration) {
		t.Fatalf("endpoint = %q, want %q", endpoint, constant.EndpointTypeImageGeneration)
	}
}

func TestNormalizeChannelTestEndpointDetectsGrokVideo(t *testing.T) {
	endpoint := normalizeChannelTestEndpoint(
		&model.Channel{Type: constant.ChannelTypeXai},
		"grok-imagine-video",
		"",
	)
	if endpoint != string(constant.EndpointTypeOpenAIVideo) {
		t.Fatalf("endpoint = %q, want %q", endpoint, constant.EndpointTypeOpenAIVideo)
	}
}

func TestNormalizeChannelTestEndpointKeepsExplicitImageEdit(t *testing.T) {
	endpoint := normalizeChannelTestEndpoint(
		&model.Channel{Type: constant.ChannelTypeGemini},
		"gemini-3.1-flash-image",
		string(constant.EndpointTypeImageEdit),
	)
	if endpoint != string(constant.EndpointTypeImageEdit) {
		t.Fatalf("endpoint = %q, want %q", endpoint, constant.EndpointTypeImageEdit)
	}
}
