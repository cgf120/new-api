package gemini

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestOpenAIImageGenerationToGeminiGenerateContent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesGenerations,
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "gemini-3.1-flash-image",
		},
	}
	req := dto.ImageRequest{
		Model:   "gemini-3.1-flash-image",
		Prompt:  "a clean product photo",
		Size:    "16:9",
		Quality: "4K",
	}

	converted, err := oaiImage2GeminiGenerateContentImageRequest(c, info, req)
	require.NoError(t, err)
	require.Len(t, converted.Contents, 1)
	require.Equal(t, "a clean product photo", converted.Contents[0].Parts[0].Text)
	require.Equal(t, []string{"IMAGE"}, converted.GenerationConfig.ResponseModalities)

	var imageConfig map[string]string
	require.NoError(t, json.Unmarshal(converted.GenerationConfig.ImageConfig, &imageConfig))
	require.Equal(t, "16:9", imageConfig["aspectRatio"])
	require.Equal(t, "4K", imageConfig["imageSize"])
}

func TestOpenAIImageEditToGeminiGenerateContent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", nil)

	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesEdits,
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "gemini-2.5-flash-image",
		},
	}
	req := dto.ImageRequest{
		Model:  "gemini-2.5-flash-image",
		Prompt: "make the background white",
		Image:  json.RawMessage(`"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="`),
	}

	converted, err := oaiImage2GeminiGenerateContentImageRequest(c, info, req)
	require.NoError(t, err)
	require.Len(t, converted.Contents, 1)
	require.Len(t, converted.Contents[0].Parts, 2)
	require.Equal(t, "make the background white", converted.Contents[0].Parts[0].Text)
	require.NotNil(t, converted.Contents[0].Parts[1].InlineData)
	require.Equal(t, "image/png", converted.Contents[0].Parts[1].InlineData.MimeType)
	require.NotEmpty(t, converted.Contents[0].Parts[1].InlineData.Data)
}

func TestGeminiImageEditHeaderUsesJSONContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", nil)
	c.Request.Header.Set("Content-Type", "multipart/form-data; boundary=test-boundary")

	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesEdits,
		ChannelMeta: &relaycommon.ChannelMeta{
			ApiKey: "test-key",
		},
	}
	headers := http.Header{}

	err := (&Adaptor{}).SetupRequestHeader(c, &headers, info)
	require.NoError(t, err)
	require.Equal(t, "application/json", headers.Get("Content-Type"))
	require.Equal(t, "test-key", headers.Get("x-goog-api-key"))
}
