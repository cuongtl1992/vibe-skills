package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"

	"github.com/cuongtl/vibe-skills/internal/version"
)

const (
	repoOwner = "cuongtl"
	repoName  = "vibe-skills"
)

type Release struct {
	TagName string  `json:"tag_name"`
	Assets  []Asset `json:"assets"`
}

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

func CheckForUpdate() (string, bool, error) {
	release, err := getLatestRelease()
	if err != nil {
		return "", false, err
	}

	currentVersion := version.GetVersion()
	latestVersion := strings.TrimPrefix(release.TagName, "v")

	if currentVersion == "dev" {
		return latestVersion, true, nil
	}

	if latestVersion != currentVersion {
		return latestVersion, true, nil
	}

	return currentVersion, false, nil
}

func SelfUpdate() error {
	release, err := getLatestRelease()
	if err != nil {
		return fmt.Errorf("failed to get latest release: %w", err)
	}

	assetName := getAssetName()
	var downloadURL string

	for _, asset := range release.Assets {
		if asset.Name == assetName {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	if downloadURL == "" {
		return fmt.Errorf("no suitable binary found for %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	// Download the new binary
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download update: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download update: HTTP %d", resp.StatusCode)
	}

	// Get current executable path
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	// Create temp file
	tmpFile, err := os.CreateTemp("", "vibe-skills-update-*")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	defer func() { _ = os.Remove(tmpFile.Name()) }()

	// Write downloaded content
	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		return fmt.Errorf("failed to write update: %w", err)
	}
	_ = tmpFile.Close()

	// Make executable
	if err := os.Chmod(tmpFile.Name(), 0755); err != nil {
		return fmt.Errorf("failed to chmod: %w", err)
	}

	// Replace current executable
	if err := os.Rename(tmpFile.Name(), execPath); err != nil {
		return fmt.Errorf("failed to replace executable: %w", err)
	}

	return nil
}

func getLatestRelease() (*Release, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", repoOwner, repoName)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get release info: HTTP %d", resp.StatusCode)
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return &release, nil
}

func getAssetName() string {
	os := runtime.GOOS
	arch := runtime.GOARCH

	if arch == "amd64" {
		arch = "x86_64"
	}

	ext := "tar.gz"
	if os == "windows" {
		ext = "zip"
	}

	return fmt.Sprintf("vibe-skills_%s_%s.%s", os, arch, ext)
}
