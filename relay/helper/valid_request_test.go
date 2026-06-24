package helper

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestGetAndValidOpenAIImageEditRequestReusesMultipartBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	require.NoError(t, writer.WriteField("model", "gemini-2.5-flash-image"))
	require.NoError(t, writer.WriteField("prompt", "turn it blue"))
	require.NoError(t, writer.WriteField("n", "1"))
	require.NoError(t, writer.WriteField("size", "1024x1024"))
	require.NoError(t, writer.WriteField("image_size", "4K"))
	require.NoError(t, writer.WriteField("aspect_ratio", "9:16"))
	require.NoError(t, writer.WriteField("response_format", "b64_json"))
	require.NoError(t, writer.WriteField("response_modalities", `["IMAGE"]`))
	require.NoError(t, writer.WriteField("output_format", "jpeg"))
	require.NoError(t, writer.WriteField("background", "auto"))
	fileWriter, err := writer.CreateFormFile("image", "input.png")
	require.NoError(t, err)
	_, err = fileWriter.Write([]byte("fake-image"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", bytes.NewReader(body.Bytes()))
	ctx.Request.Header.Set("Content-Type", writer.FormDataContentType())

	var modelRequest struct {
		Model string `json:"model"`
	}
	require.NoError(t, common.UnmarshalBodyReusable(ctx, &modelRequest))
	require.Equal(t, "gemini-2.5-flash-image", modelRequest.Model)

	imageRequest, err := GetAndValidOpenAIImageRequest(ctx, relayconstant.RelayModeImagesEdits)
	require.NoError(t, err)
	require.Equal(t, "gemini-2.5-flash-image", imageRequest.Model)
	require.Equal(t, "turn it blue", imageRequest.Prompt)
	require.Equal(t, "1024x1024", imageRequest.Size)
	require.Equal(t, "b64_json", imageRequest.ResponseFormat)
	require.JSONEq(t, `"4K"`, string(imageRequest.Extra["image_size"]))
	require.JSONEq(t, `"9:16"`, string(imageRequest.Extra["aspect_ratio"]))
	require.JSONEq(t, `["IMAGE"]`, string(imageRequest.Extra["response_modalities"]))
	require.JSONEq(t, `"jpeg"`, string(imageRequest.OutputFormat))
	require.JSONEq(t, `"auto"`, string(imageRequest.Background))
	require.NotNil(t, ctx.Request.MultipartForm)
	require.Len(t, ctx.Request.MultipartForm.File["image"], 1)
}
