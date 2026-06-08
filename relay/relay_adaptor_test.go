package relay

import (
	"strconv"
	"testing"

	"github.com/QuantumNous/new-api/constant"
)

func TestGetTaskAdaptor_Xai(t *testing.T) {
	adaptor := GetTaskAdaptor(constant.TaskPlatform(strconv.Itoa(constant.ChannelTypeXai)))
	if adaptor == nil {
		t.Fatal("xAI task adaptor is nil")
	}
	if adaptor.GetChannelName() != "xai" {
		t.Fatalf("channel name = %q, want xai", adaptor.GetChannelName())
	}
}
