package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
)

func TestParseUserModelEndpointFilterChat(t *testing.T) {
	endpointTypes, ok := parseUserModelEndpointFilter("chat")
	if !ok {
		t.Fatal("expected chat endpoint filter to be enabled")
	}

	want := []constant.EndpointType{
		constant.EndpointTypeOpenAI,
	}
	if len(endpointTypes) != len(want) {
		t.Fatalf("endpointTypes = %v, want %v", endpointTypes, want)
	}
	for i := range want {
		if endpointTypes[i] != want[i] {
			t.Fatalf("endpointTypes = %v, want %v", endpointTypes, want)
		}
	}
}

func TestParseUserModelEndpointFilterCommaSeparated(t *testing.T) {
	endpointTypes, ok := parseUserModelEndpointFilter("image-generation, image-edit")
	if !ok {
		t.Fatal("expected explicit endpoint filter to be enabled")
	}

	want := []constant.EndpointType{
		constant.EndpointTypeImageGeneration,
		constant.EndpointTypeImageEdit,
	}
	if len(endpointTypes) != len(want) {
		t.Fatalf("endpointTypes = %v, want %v", endpointTypes, want)
	}
	for i := range want {
		if endpointTypes[i] != want[i] {
			t.Fatalf("endpointTypes = %v, want %v", endpointTypes, want)
		}
	}
}

func TestParseUserModelEndpointFilterAll(t *testing.T) {
	endpointTypes, ok := parseUserModelEndpointFilter("all")
	if ok {
		t.Fatalf("expected all endpoint filter to be disabled, got %v", endpointTypes)
	}
}
