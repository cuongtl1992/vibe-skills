package updater

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/cuongtl1992/vibe-skills/internal/version"
)

const (
	repoOwner = "cuongtl1992"
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

	// Download the archive
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

	// Create temp file in the same directory as executable to avoid cross-device link error
	execDir := filepath.Dir(execPath)
	tmpFile, err := os.CreateTemp(execDir, "vibe-skills-update-*")
	if err != nil {
		// Fallback to system temp if same directory fails
		tmpFile, err = os.CreateTemp("", "vibe-skills-update-*")
		if err != nil {
			return fmt.Errorf("failed to create temp file: %w", err)
		}
	}
	tmpPath := tmpFile.Name()
	defer func() { _ = os.Remove(tmpPath) }()

	// Extract binary from archive
	var binaryData []byte
	if runtime.GOOS == "windows" {
		binaryData, err = extractFromZip(resp.Body, "vibe-skills.exe")
	} else {
		binaryData, err = extractFromTarGz(resp.Body, "vibe-skills")
	}
	if err != nil {
		return fmt.Errorf("failed to extract binary: %w", err)
	}

	// Write extracted binary to temp file
	if _, err := tmpFile.Write(binaryData); err != nil {
		return fmt.Errorf("failed to write update: %w", err)
	}
	_ = tmpFile.Close()

	// Make executable
	if err := os.Chmod(tmpPath, 0755); err != nil {
		return fmt.Errorf("failed to chmod: %w", err)
	}

	// Replace current executable
	// Try rename first (faster, same filesystem)
	if err := os.Rename(tmpPath, execPath); err != nil {
		// Fallback to copy if rename fails (cross-device link)
		if err := copyFile(tmpPath, execPath); err != nil {
			return fmt.Errorf("failed to replace executable: %w", err)
		}
	}

	return nil
}

// extractFromTarGz extracts a specific file from a tar.gz archive
func extractFromTarGz(r io.Reader, filename string) ([]byte, error) {
	gzr, err := gzip.NewReader(r)
	if err != nil {
		return nil, fmt.Errorf("failed to create gzip reader: %w", err)
	}
	defer func() { _ = gzr.Close() }()

	tr := tar.NewReader(gzr)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read tar: %w", err)
		}

		// Check if this is the file we're looking for
		if header.Typeflag == tar.TypeReg && filepath.Base(header.Name) == filename {
			data, err := io.ReadAll(tr)
			if err != nil {
				return nil, fmt.Errorf("failed to read file from tar: %w", err)
			}
			return data, nil
		}
	}

	return nil, fmt.Errorf("file %s not found in archive", filename)
}

// extractFromZip extracts a specific file from a zip archive
func extractFromZip(r io.Reader, filename string) ([]byte, error) {
	// We need to read the entire zip into memory since zip requires random access
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read zip data: %w", err)
	}

	zipReader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("failed to create zip reader: %w", err)
	}

	for _, file := range zipReader.File {
		if filepath.Base(file.Name) == filename {
			rc, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("failed to open file in zip: %w", err)
			}
			defer func() { _ = rc.Close() }()

			fileData, err := io.ReadAll(rc)
			if err != nil {
				return nil, fmt.Errorf("failed to read file from zip: %w", err)
			}
			return fileData, nil
		}
	}

	return nil, fmt.Errorf("file %s not found in archive", filename)
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = sourceFile.Close() }()

	// Get source file info for permissions
	sourceInfo, err := sourceFile.Stat()
	if err != nil {
		return err
	}

	// Create destination file
	destFile, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, sourceInfo.Mode())
	if err != nil {
		return err
	}
	defer func() { _ = destFile.Close() }()

	// Copy content
	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return err
	}

	return destFile.Sync()
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
