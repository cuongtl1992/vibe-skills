package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	DefaultOwner  = "cuongtl"
	DefaultRepo   = "vibe-skills"
	DefaultBranch = "main"
	RawGitHubURL  = "https://raw.githubusercontent.com"
)

// GitHubRegistry fetches skills from GitHub
type GitHubRegistry struct {
	owner  string
	repo   string
	ref    string // branch, tag, or commit
	cache  *Cache
	client *http.Client
}

// GitHubRegistryOptions configures the GitHub registry
type GitHubRegistryOptions struct {
	Owner  string
	Repo   string
	Branch string
	Ref    string // Takes precedence over Branch if set
}

// NewGitHubRegistry creates a new GitHub-based registry
func NewGitHubRegistry(opts *GitHubRegistryOptions) *GitHubRegistry {
	if opts == nil {
		opts = &GitHubRegistryOptions{}
	}

	owner := opts.Owner
	if owner == "" {
		owner = DefaultOwner
	}

	repo := opts.Repo
	if repo == "" {
		repo = DefaultRepo
	}

	ref := opts.Ref
	if ref == "" {
		ref = opts.Branch
	}
	if ref == "" {
		ref = DefaultBranch
	}

	return &GitHubRegistry{
		owner: owner,
		repo:  repo,
		ref:   ref,
		cache: NewCache(),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// List returns all available skills
func (g *GitHubRegistry) List() ([]Skill, error) {
	index, err := g.fetchIndex()
	if err != nil {
		return nil, err
	}
	return index.Skills, nil
}

// ListByStack returns skills filtered by stack
func (g *GitHubRegistry) ListByStack(stack string) ([]Skill, error) {
	skills, err := g.List()
	if err != nil {
		return nil, err
	}

	var result []Skill
	for _, s := range skills {
		if s.Stack == stack {
			result = append(result, s)
		}
	}
	return result, nil
}

// GetStacks returns all available stack names
func (g *GitHubRegistry) GetStacks() ([]string, error) {
	skills, err := g.List()
	if err != nil {
		return nil, err
	}

	stackMap := make(map[string]bool)
	for _, s := range skills {
		stackMap[s.Stack] = true
	}

	var stacks []string
	for stack := range stackMap {
		stacks = append(stacks, stack)
	}
	return stacks, nil
}

// Find returns a skill by name
func (g *GitHubRegistry) Find(name string) (*Skill, error) {
	skills, err := g.List()
	if err != nil {
		return nil, err
	}

	for _, s := range skills {
		// Match by name only
		if s.Name == name {
			return &s, nil
		}
		// Match by full path (stack/name)
		if s.Stack+"/"+s.Name == name {
			return &s, nil
		}
	}
	return nil, fmt.Errorf("skill not found: %s", name)
}

// Search returns skills matching the query
func (g *GitHubRegistry) Search(query string) ([]Skill, error) {
	skills, err := g.List()
	if err != nil {
		return nil, err
	}

	query = strings.ToLower(query)
	var result []Skill
	for _, s := range skills {
		if strings.Contains(strings.ToLower(s.Name), query) ||
			strings.Contains(strings.ToLower(s.Description), query) ||
			strings.Contains(strings.ToLower(s.Stack), query) {
			result = append(result, s)
		}
	}
	return result, nil
}

// GetContent returns the content of a skill's SKILL.md
func (g *GitHubRegistry) GetContent(skill *Skill) ([]byte, error) {
	url := g.buildRawURL("skills/" + skill.Path)
	return g.fetch(url)
}

// fetchIndex fetches and caches the registry index
func (g *GitHubRegistry) fetchIndex() (*RegistryIndex, error) {
	// Try cache first
	if cached, ok := g.cache.Get(g.ref); ok {
		return cached, nil
	}

	// Fetch from GitHub
	url := g.buildRawURL("skills/registry.json")
	data, err := g.fetch(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch registry: %w", err)
	}

	var index RegistryIndex
	if err := json.Unmarshal(data, &index); err != nil {
		return nil, fmt.Errorf("failed to parse registry: %w", err)
	}

	// Cache the result
	g.cache.Set(g.ref, &index)

	return &index, nil
}

// buildRawURL builds a raw GitHub content URL
func (g *GitHubRegistry) buildRawURL(path string) string {
	return fmt.Sprintf("%s/%s/%s/%s/%s", RawGitHubURL, g.owner, g.repo, g.ref, path)
}

// fetch performs an HTTP GET request
func (g *GitHubRegistry) fetch(url string) ([]byte, error) {
	resp, err := g.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("not found: %s", url)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, url)
	}

	return io.ReadAll(resp.Body)
}

// GetRef returns the current ref (branch/tag)
func (g *GitHubRegistry) GetRef() string {
	return g.ref
}

// ClearCache clears the registry cache
func (g *GitHubRegistry) ClearCache() error {
	return g.cache.ClearRef(g.ref)
}
