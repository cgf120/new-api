package service

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
)

func ConvertImageResponseBodyURLsToBase64(responseBody []byte, proxyURL string) ([]byte, error) {
	var imageResponse dto.ImageResponse
	if err := common.Unmarshal(responseBody, &imageResponse); err != nil {
		return nil, err
	}
	if err := NormalizeImageResponseToBase64(&imageResponse, proxyURL); err != nil {
		return nil, err
	}
	return common.Marshal(imageResponse)
}

func NormalizeImageResponseToBase64(imageResponse *dto.ImageResponse, proxyURL string) error {
	if imageResponse == nil {
		return fmt.Errorf("image response is nil")
	}
	for i := range imageResponse.Data {
		data := &imageResponse.Data[i]
		if strings.TrimSpace(data.B64Json) != "" {
			data.Url = ""
			continue
		}
		imageURL := strings.TrimSpace(data.Url)
		if imageURL == "" {
			continue
		}
		b64, err := imageURLToBase64(imageURL, proxyURL)
		if err != nil {
			return fmt.Errorf("convert image url at index %d to base64 failed: %w", i, err)
		}
		data.B64Json = b64
		data.Url = ""
	}
	return nil
}

func ChannelProxyFromRelayInfo(info *relaycommon.RelayInfo) string {
	if info == nil || info.ChannelMeta == nil {
		return ""
	}
	return info.ChannelSetting.Proxy
}

func imageURLToBase64(imageURL string, proxyURL string) (string, error) {
	if strings.HasPrefix(imageURL, "data:") {
		_, b64, err := DecodeBase64FileData(imageURL)
		if err != nil {
			return "", err
		}
		return b64, nil
	}
	_, b64, err := GetImageFromUrlWithProxy(imageURL, proxyURL)
	return b64, err
}
