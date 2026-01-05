package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const (
	ConfigFileName       = ".vibe-skills.yaml"
	GlobalConfigDir      = ".vibe-skills"
	GlobalConfigFileName = "config.yaml"
)

// RegistryConfig holds registry-specific configuration
type RegistryConfig struct {
	Branch string `yaml:"branch,omitempty"`
	Ref    string `yaml:"ref,omitempty"`
}

// Config represents the project-level configuration
type Config struct {
	Registry *RegistryConfig `yaml:"registry,omitempty"`
	Skills   []string        `yaml:"skills"`
}

// GlobalConfig represents user-level configuration
type GlobalConfig struct {
	Registry *RegistryConfig `yaml:"registry,omitempty"`
}

// Load loads project configuration from the specified directory
func Load(dir string) (*Config, error) {
	path := filepath.Join(dir, ConfigFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// Save saves project configuration to the specified directory
func Save(dir string, cfg *Config) error {
	path := filepath.Join(dir, ConfigFileName)
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// Exists checks if project configuration exists
func Exists(dir string) bool {
	path := filepath.Join(dir, ConfigFileName)
	_, err := os.Stat(path)
	return err == nil
}

// GetDefaultConfig returns default project configuration
func GetDefaultConfig() *Config {
	return &Config{
		Skills: []string{
			"common/commit-convention",
			"common/code-reviewer",
		},
	}
}

// LoadGlobal loads global user configuration
func LoadGlobal() (*GlobalConfig, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	path := filepath.Join(homeDir, GlobalConfigDir, GlobalConfigFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &GlobalConfig{}, nil
		}
		return nil, err
	}

	var cfg GlobalConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// SaveGlobal saves global user configuration
func SaveGlobal(cfg *GlobalConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	dir := filepath.Join(homeDir, GlobalConfigDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	path := filepath.Join(dir, GlobalConfigFileName)
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// ResolveRef resolves the registry ref with priority: flag > project > global > default
func ResolveRef(flagBranch, flagRef string, projectCfg *Config, globalCfg *GlobalConfig) string {
	// Priority 1: CLI flags
	if flagRef != "" {
		return flagRef
	}
	if flagBranch != "" {
		return flagBranch
	}

	// Priority 2: Project config
	if projectCfg != nil && projectCfg.Registry != nil {
		if projectCfg.Registry.Ref != "" {
			return projectCfg.Registry.Ref
		}
		if projectCfg.Registry.Branch != "" {
			return projectCfg.Registry.Branch
		}
	}

	// Priority 3: Global config
	if globalCfg != nil && globalCfg.Registry != nil {
		if globalCfg.Registry.Ref != "" {
			return globalCfg.Registry.Ref
		}
		if globalCfg.Registry.Branch != "" {
			return globalCfg.Registry.Branch
		}
	}

	// Priority 4: Default
	return "main"
}
