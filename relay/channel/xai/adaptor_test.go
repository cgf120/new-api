package xai

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"

	"github.com/gin-gonic/gin"
)

func TestImageEditRequestUsesMultipartForwarding(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var incomingBody bytes.Buffer
	writer := multipart.NewWriter(&incomingBody)
	if err := writer.WriteField("model", "grok-imagine-image"); err != nil {
		t.Fatalf("WriteField(model) error: %v", err)
	}
	if err := writer.WriteField("prompt", "make it blue"); err != nil {
		t.Fatalf("WriteField(prompt) error: %v", err)
	}
	part, err := writer.CreateFormFile("image", "source.png")
	if err != nil {
		t.Fatalf("CreateFormFile error: %v", err)
	}
	if _, err := part.Write([]byte("image-bytes")); err != nil {
		t.Fatalf("write image part error: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close error: %v", err)
	}

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", &incomingBody)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	info := &relaycommon.RelayInfo{
		RelayMode:      relayconstant.RelayModeImagesEdits,
		RequestURLPath: "/v1/images/edits",
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelType: constant.ChannelTypeXai,
			ApiKey:      "test-key",
		},
	}
	request := dto.ImageRequest{
		Model:  "grok-imagine-image",
		Prompt: "make it blue",
	}

	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(c, info, request)
	if err != nil {
		t.Fatalf("ConvertImageRequest error: %v", err)
	}
	body, ok := converted.(*bytes.Buffer)
	if !ok {
		t.Fatalf("ConvertImageRequest returned %T, want *bytes.Buffer", converted)
	}

	forwarded := httptest.NewRequest(http.MethodPost, "/v1/images/edits", bytes.NewReader(body.Bytes()))
	forwarded.Header.Set("Content-Type", c.Request.Header.Get("Content-Type"))
	if err := forwarded.ParseMultipartForm(1 << 20); err != nil {
		t.Fatalf("forwarded multipart parse error: %v", err)
	}
	if got := forwarded.FormValue("model"); got != "grok-imagine-image" {
		t.Fatalf("model = %q, want %q", got, "grok-imagine-image")
	}
	if got := forwarded.FormValue("prompt"); got != "make it blue" {
		t.Fatalf("prompt = %q, want %q", got, "make it blue")
	}
	file, _, err := forwarded.FormFile("image")
	if err != nil {
		t.Fatalf("image missing: %v", err)
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		t.Fatalf("read image error: %v", err)
	}
	if string(data) != "image-bytes" {
		t.Fatalf("image body = %q, want %q", string(data), "image-bytes")
	}
}
