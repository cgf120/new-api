package gemini

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

func oaiImage2GeminiGenerateContentImageRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (*dto.GeminiChatRequest, error) {
	prompt := strings.TrimSpace(request.Prompt)
	if prompt == "" {
		return nil, errors.New("prompt is required")
	}

	parts := []dto.GeminiPart{{Text: prompt}}
	if info != nil && info.RelayMode == relayconstant.RelayModeImagesEdits {
		imageParts, err := collectGeminiImageEditParts(c, request)
		if err != nil {
			return nil, err
		}
		if len(imageParts) == 0 {
			return nil, errors.New("image is required")
		}
		parts = append(parts, imageParts...)
	}

	geminiRequest := &dto.GeminiChatRequest{
		Contents: []dto.GeminiChatContent{
			{
				Role:  "user",
				Parts: parts,
			},
		},
		GenerationConfig: dto.GeminiChatGenerationConfig{
			CandidateCount:     lo.ToPtr(int(lo.FromPtrOr(request.N, uint(1)))),
			ResponseModalities: geminiImageResponseModalities(request),
		},
	}

	if imageConfig := geminiImageConfigFromRequest(request); len(imageConfig) > 0 {
		imageConfigBytes, err := common.Marshal(imageConfig)
		if err != nil {
			return nil, err
		}
		geminiRequest.GenerationConfig.ImageConfig = imageConfigBytes
	}

	return geminiRequest, nil
}

func geminiImageResponseModalities(request dto.ImageRequest) []string {
	if raw, ok := imageRequestExtraRaw(request, "response_modalities", "responseModalities"); ok {
		var modalities []string
		if err := common.Unmarshal(raw, &modalities); err == nil && len(modalities) > 0 {
			return normalizeGeminiModalities(modalities)
		}
		var modality string
		if err := common.Unmarshal(raw, &modality); err == nil && strings.TrimSpace(modality) != "" {
			return normalizeGeminiModalities([]string{modality})
		}
	}
	return []string{"IMAGE"}
}

func normalizeGeminiModalities(modalities []string) []string {
	normalized := make([]string, 0, len(modalities))
	seen := map[string]bool{}
	for _, modality := range modalities {
		value := strings.ToUpper(strings.TrimSpace(modality))
		if value == "" || seen[value] {
			continue
		}
		seen[value] = true
		normalized = append(normalized, value)
	}
	if len(normalized) == 0 {
		return []string{"IMAGE"}
	}
	return normalized
}

func geminiImageConfigFromRequest(request dto.ImageRequest) map[string]string {
	config := map[string]string{}

	if aspectRatio := geminiAspectRatioFromRequest(request); aspectRatio != "" {
		config["aspectRatio"] = aspectRatio
	}
	if imageSize := geminiImageSizeFromRequest(request); imageSize != "" {
		config["imageSize"] = imageSize
	}

	return config
}

func geminiAspectRatioFromRequest(request dto.ImageRequest) string {
	if value := imageRequestExtraString(request, "aspect_ratio", "aspectRatio"); value != "" {
		return value
	}
	size := strings.TrimSpace(request.Size)
	if size == "" {
		return ""
	}
	if strings.Contains(size, ":") {
		return size
	}
	switch strings.ToLower(size) {
	case "1024x1024", "2048x2048", "4096x4096":
		return "1:1"
	case "1536x1024", "3072x2048":
		return "3:2"
	case "1024x1536", "2048x3072":
		return "2:3"
	case "1024x1792", "1152x2048":
		return "9:16"
	case "1792x1024", "2048x1152":
		return "16:9"
	}
	return ""
}

func geminiImageSizeFromRequest(request dto.ImageRequest) string {
	if value := imageRequestExtraString(request, "image_size", "imageSize"); value != "" {
		return strings.ToUpper(value)
	}
	for _, value := range []string{request.Quality, request.Size} {
		switch strings.ToUpper(strings.TrimSpace(value)) {
		case "1K", "2K", "4K":
			return strings.ToUpper(strings.TrimSpace(value))
		}
	}
	switch strings.ToLower(strings.TrimSpace(request.Quality)) {
	case "hd", "high":
		return "2K"
	case "standard", "medium", "low", "auto":
		return "1K"
	}
	switch strings.ToLower(strings.TrimSpace(request.Size)) {
	case "1024x1024", "1024x1792", "1792x1024", "1536x1024", "1024x1536":
		return "1K"
	case "2048x2048", "2048x1152", "1152x2048", "3072x2048", "2048x3072":
		return "2K"
	case "4096x4096":
		return "4K"
	}
	return ""
}

func collectGeminiImageEditParts(c *gin.Context, request dto.ImageRequest) ([]dto.GeminiPart, error) {
	if c != nil && strings.HasPrefix(c.Request.Header.Get("Content-Type"), "multipart/form-data") {
		return collectGeminiMultipartImageParts(c)
	}

	var parts []dto.GeminiPart
	rawValues := []json.RawMessage{request.Image, request.Images}
	if request.Extra != nil {
		for _, key := range []string{"image_urls", "imageUrls", "images", "image"} {
			if raw, ok := request.Extra[key]; ok {
				rawValues = append(rawValues, raw)
			}
		}
	}

	for _, raw := range rawValues {
		if len(raw) == 0 || string(raw) == "null" {
			continue
		}
		collected, err := geminiImagePartsFromRaw(c, raw)
		if err != nil {
			return nil, err
		}
		parts = append(parts, collected...)
	}
	return parts, nil
}

func collectGeminiMultipartImageParts(c *gin.Context) ([]dto.GeminiPart, error) {
	if c.Request.MultipartForm == nil {
		form, err := common.ParseMultipartFormReusable(c)
		if err != nil {
			return nil, fmt.Errorf("failed to parse multipart form: %w", err)
		}
		c.Request.MultipartForm = form
	}
	if c.Request.MultipartForm == nil || c.Request.MultipartForm.File == nil {
		return nil, nil
	}

	var imageFiles []*multipart.FileHeader
	for fieldName, files := range c.Request.MultipartForm.File {
		if fieldName == "image" || fieldName == "image[]" || strings.HasPrefix(fieldName, "image[") {
			imageFiles = append(imageFiles, files...)
		}
	}

	parts := make([]dto.GeminiPart, 0, len(imageFiles))
	for _, fileHeader := range imageFiles {
		part, err := geminiPartFromMultipartFile(fileHeader)
		if err != nil {
			return nil, err
		}
		parts = append(parts, part)
	}
	return parts, nil
}

func geminiImagePartsFromRaw(c *gin.Context, raw json.RawMessage) ([]dto.GeminiPart, error) {
	var value string
	if err := common.Unmarshal(raw, &value); err == nil {
		part, err := geminiPartFromImageString(c, value, "")
		if err != nil {
			return nil, err
		}
		return []dto.GeminiPart{part}, nil
	}

	var values []json.RawMessage
	if err := common.Unmarshal(raw, &values); err == nil {
		var parts []dto.GeminiPart
		for _, item := range values {
			collected, err := geminiImagePartsFromRaw(c, item)
			if err != nil {
				return nil, err
			}
			parts = append(parts, collected...)
		}
		return parts, nil
	}

	var object map[string]json.RawMessage
	if err := common.Unmarshal(raw, &object); err == nil {
		if nested, ok := object["image_url"]; ok {
			collected, err := geminiImagePartsFromRaw(c, nested)
			if err == nil && len(collected) > 0 {
				return collected, nil
			}
		}

		mimeType := rawObjectString(object, "mime_type", "mimeType")
		for _, key := range []string{"url", "b64_json", "base64", "data"} {
			if rawValue, ok := object[key]; ok {
				var source string
				if err := common.Unmarshal(rawValue, &source); err == nil && strings.TrimSpace(source) != "" {
					part, err := geminiPartFromImageString(c, source, mimeType)
					if err != nil {
						return nil, err
					}
					return []dto.GeminiPart{part}, nil
				}
			}
		}
	}

	return nil, errors.New("unsupported image input format")
}

func geminiPartFromMultipartFile(fileHeader *multipart.FileHeader) (dto.GeminiPart, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return dto.GeminiPart{}, fmt.Errorf("failed to open image file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return dto.GeminiPart{}, fmt.Errorf("failed to read image file %s: %w", fileHeader.Filename, err)
	}

	mimeType := strings.TrimSpace(fileHeader.Header.Get("Content-Type"))
	if semi := strings.Index(mimeType, ";"); semi >= 0 {
		mimeType = strings.TrimSpace(mimeType[:semi])
	}
	if mimeType == "" || mimeType == "application/octet-stream" {
		mimeType = detectGeminiImageMimeType(fileHeader.Filename, data)
	}

	return dto.GeminiPart{
		InlineData: &dto.GeminiInlineData{
			MimeType: mimeType,
			Data:     base64.StdEncoding.EncodeToString(data),
		},
	}, nil
}

func geminiPartFromImageString(c *gin.Context, source string, mimeType string) (dto.GeminiPart, error) {
	source = strings.TrimSpace(source)
	if source == "" {
		return dto.GeminiPart{}, errors.New("image input is empty")
	}

	var base64Data string
	var err error
	if strings.HasPrefix(source, "http://") || strings.HasPrefix(source, "https://") {
		base64Data, mimeType, err = service.GetBase64Data(c, types.NewURLFileSource(source), "formatting image for Gemini image edit")
	} else {
		detectedMime, data, decodeErr := service.DecodeBase64FileData(source)
		base64Data = data
		err = decodeErr
		if strings.TrimSpace(mimeType) == "" {
			mimeType = detectedMime
		}
	}
	if err != nil {
		return dto.GeminiPart{}, err
	}
	if strings.TrimSpace(mimeType) == "" {
		mimeType = "image/png"
	}

	return dto.GeminiPart{
		InlineData: &dto.GeminiInlineData{
			MimeType: mimeType,
			Data:     base64Data,
		},
	}, nil
}

func detectGeminiImageMimeType(filename string, data []byte) string {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".jpg", ".jpeg", ".jfif":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	}
	if len(data) > 0 {
		mimeType := http.DetectContentType(data)
		if strings.HasPrefix(mimeType, "image/") {
			return mimeType
		}
	}
	return "image/png"
}

func imageRequestExtraRaw(request dto.ImageRequest, keys ...string) (json.RawMessage, bool) {
	if request.Extra == nil {
		return nil, false
	}
	for _, key := range keys {
		if raw, ok := request.Extra[key]; ok && len(raw) > 0 {
			return raw, true
		}
	}
	return nil, false
}

func imageRequestExtraString(request dto.ImageRequest, keys ...string) string {
	raw, ok := imageRequestExtraRaw(request, keys...)
	if !ok {
		return ""
	}
	var value string
	if err := common.Unmarshal(raw, &value); err == nil {
		return strings.TrimSpace(value)
	}
	return ""
}

func rawObjectString(object map[string]json.RawMessage, keys ...string) string {
	for _, key := range keys {
		if raw, ok := object[key]; ok {
			var value string
			if err := common.Unmarshal(raw, &value); err == nil {
				return strings.TrimSpace(value)
			}
		}
	}
	return ""
}

func GeminiGenerateContentImageHandler(c *gin.Context, info *relaycommon.RelayInfo, resp *http.Response) (*dto.Usage, *types.NewAPIError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeBadResponseBody, http.StatusInternalServerError)
	}
	service.CloseResponseBodyGracefully(resp)

	var geminiResponse dto.GeminiChatResponse
	if err := common.Unmarshal(responseBody, &geminiResponse); err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeBadResponseBody, http.StatusInternalServerError)
	}

	usage := buildUsageFromGeminiMetadata(geminiResponse.UsageMetadata, info.GetEstimatePromptTokens())
	if len(geminiResponse.Candidates) == 0 {
		return nil, types.NewOpenAIError(errors.New("empty response from Gemini API"), types.ErrorCodeEmptyResponse, http.StatusInternalServerError)
	}

	openAIResponse := dto.ImageResponse{
		Created: common.GetTimestamp(),
		Data:    make([]dto.ImageData, 0),
	}
	for _, candidate := range geminiResponse.Candidates {
		for _, part := range candidate.Content.Parts {
			if part.InlineData == nil || !strings.HasPrefix(strings.ToLower(part.InlineData.MimeType), "image/") {
				continue
			}
			openAIResponse.Data = append(openAIResponse.Data, dto.ImageData{
				B64Json: part.InlineData.Data,
			})
		}
	}
	if len(openAIResponse.Data) == 0 {
		return nil, types.NewOpenAIError(errors.New("no images generated"), types.ErrorCodeBadResponseBody, http.StatusInternalServerError)
	}

	if usage.TotalTokens == 0 {
		const imageTokens = 258
		generatedImages := len(openAIResponse.Data)
		usage.CompletionTokens = imageTokens * generatedImages
		usage.CompletionTokenDetails.ImageTokens = imageTokens * generatedImages
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}

	jsonResponse, err := common.Marshal(openAIResponse)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}

	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.WriteHeader(resp.StatusCode)
	_, _ = c.Writer.Write(jsonResponse)

	return &usage, nil
}
