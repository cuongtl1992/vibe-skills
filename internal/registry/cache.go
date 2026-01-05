package registry

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

const (
	DefaultCacheTTL = 1 * time.Hour
	CacheDir        = ".vibe-skills"
	CacheFile       = "registry-cache.json"
)

// CacheEntry represents a cached registry entry
type CacheEntry struct {
	Data      *RegistryIndex `json:"data"`
	Ref       string         `json:"ref"`
	FetchedAt time.Time      `json:"fetched_at"`
}

// Cache handles local caching of registry data
type Cache struct {
	dir string
	ttl time.Duration
}

// NewCache creates a new cache instance
func NewCache() *Cache {
	homeDir, _ := os.UserHomeDir()
	return &Cache{
		dir: filepath.Join(homeDir, CacheDir, "cache"),
		ttl: DefaultCacheTTL,
	}
}

// Get retrieves cached registry data if valid
func (c *Cache) Get(ref string) (*RegistryIndex, bool) {
	entry, err := c.loadEntry(ref)
	if err != nil {
		return nil, false
	}

	// Check if cache is still valid
	if time.Since(entry.FetchedAt) > c.ttl {
		return nil, false
	}

	return entry.Data, true
}

// Set stores registry data in cache
func (c *Cache) Set(ref string, data *RegistryIndex) error {
	entry := &CacheEntry{
		Data:      data,
		Ref:       ref,
		FetchedAt: time.Now(),
	}

	return c.saveEntry(ref, entry)
}

// Clear removes all cached data
func (c *Cache) Clear() error {
	return os.RemoveAll(c.dir)
}

// ClearRef removes cached data for a specific ref
func (c *Cache) ClearRef(ref string) error {
	path := c.getCachePath(ref)
	return os.Remove(path)
}

func (c *Cache) getCachePath(ref string) string {
	// Sanitize ref for filename
	safeRef := sanitizeFilename(ref)
	return filepath.Join(c.dir, safeRef+".json")
}

func (c *Cache) loadEntry(ref string) (*CacheEntry, error) {
	path := c.getCachePath(ref)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var entry CacheEntry
	if err := json.Unmarshal(data, &entry); err != nil {
		return nil, err
	}

	return &entry, nil
}

func (c *Cache) saveEntry(ref string, entry *CacheEntry) error {
	// Ensure cache directory exists
	if err := os.MkdirAll(c.dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(entry, "", "  ")
	if err != nil {
		return err
	}

	path := c.getCachePath(ref)
	return os.WriteFile(path, data, 0644)
}

func sanitizeFilename(s string) string {
	// Replace / with _ for safe filenames
	result := make([]byte, len(s))
	for i, c := range s {
		if c == '/' || c == '\\' || c == ':' {
			result[i] = '_'
		} else {
			result[i] = byte(c)
		}
	}
	return string(result)
}
