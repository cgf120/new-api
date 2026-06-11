package service

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

func TestNormalizeImageResponseToBase64DownloadsURL(t *testing.T) {
	InitHttpClient()
	fetchSetting := system_setting.GetFetchSetting()
	originalFetchSetting := *fetchSetting
	fetchSetting.EnableSSRFProtection = false
	defer func() {
		*fetchSetting = originalFetchSetting
	}()

	imageBytes := []byte("fake-png")
	originalMaxFileDownloadMB := constant.MaxFileDownloadMB
	constant.MaxFileDownloadMB = 1
	defer func() {
		constant.MaxFileDownloadMB = originalMaxFileDownloadMB
	}()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(imageBytes)
	}))
	defer server.Close()

	imageResponse := &dto.ImageResponse{
		Data: []dto.ImageData{
			{Url: server.URL + "/image.png"},
		},
	}

	if err := NormalizeImageResponseToBase64(imageResponse, ""); err != nil {
		t.Fatalf("NormalizeImageResponseToBase64 returned error: %v", err)
	}

	if imageResponse.Data[0].Url != "" {
		t.Fatalf("url = %q, want empty", imageResponse.Data[0].Url)
	}
	want := base64.StdEncoding.EncodeToString(imageBytes)
	if imageResponse.Data[0].B64Json != want {
		t.Fatalf("b64_json = %q, want %q", imageResponse.Data[0].B64Json, want)
	}
}

func TestNormalizeImageResponseToBase64KeepsExistingBase64AndClearsURL(t *testing.T) {
	imageResponse := &dto.ImageResponse{
		Data: []dto.ImageData{
			{Url: "https://example.com/image.png", B64Json: "already-base64"},
		},
	}

	if err := NormalizeImageResponseToBase64(imageResponse, ""); err != nil {
		t.Fatalf("NormalizeImageResponseToBase64 returned error: %v", err)
	}

	if imageResponse.Data[0].Url != "" {
		t.Fatalf("url = %q, want empty", imageResponse.Data[0].Url)
	}
	if imageResponse.Data[0].B64Json != "already-base64" {
		t.Fatalf("b64_json = %q, want existing value", imageResponse.Data[0].B64Json)
	}
}

func TestConvertImageResponseBodyURLsToBase64HandlesDataURI(t *testing.T) {
	body := []byte(`{"created":123,"data":[{"url":"data:image/png;base64,aGVsbG8="}]}`)

	convertedBody, err := ConvertImageResponseBodyURLsToBase64(body, "")
	if err != nil {
		t.Fatalf("ConvertImageResponseBodyURLsToBase64 returned error: %v", err)
	}

	var imageResponse dto.ImageResponse
	if err := json.Unmarshal(convertedBody, &imageResponse); err != nil {
		t.Fatalf("unmarshal converted body: %v", err)
	}
	if imageResponse.Data[0].Url != "" {
		t.Fatalf("url = %q, want empty", imageResponse.Data[0].Url)
	}
	if imageResponse.Data[0].B64Json != "aGVsbG8=" {
		t.Fatalf("b64_json = %q, want data URI payload", imageResponse.Data[0].B64Json)
	}
}
