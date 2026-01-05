package registry

// Skill represents a skill in the registry
type Skill struct {
	Name        string `json:"name"`
	Stack       string `json:"stack"`
	Description string `json:"description"`
	Path        string `json:"path"`
}

// RegistryIndex represents the registry.json structure
type RegistryIndex struct {
	Version string  `json:"version"`
	Skills  []Skill `json:"skills"`
}

// Registry defines the interface for skill registries
type Registry interface {
	// List returns all available skills
	List() ([]Skill, error)

	// ListByStack returns skills filtered by stack
	ListByStack(stack string) ([]Skill, error)

	// GetStacks returns all available stack names
	GetStacks() ([]string, error)

	// Find returns a skill by name (supports both "skill-name" and "stack/skill-name")
	Find(name string) (*Skill, error)

	// Search returns skills matching the query
	Search(query string) ([]Skill, error)

	// GetContent returns the content of a skill's SKILL.md
	GetContent(skill *Skill) ([]byte, error)
}
