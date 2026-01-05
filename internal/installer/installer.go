package installer

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/cuongtl1992/vibe-skills/internal/registry"
)

const TargetDir = ".claude/skills"

// SkillProvider defines the interface for skill sources
type SkillProvider interface {
	Find(name string) (*registry.Skill, error)
	List() ([]registry.Skill, error)
	ListByStack(stack string) ([]registry.Skill, error)
	GetContent(skill *registry.Skill) ([]byte, error)
	GetFiles(skill *registry.Skill) (map[string][]byte, error)
}

type Installer struct {
	provider SkillProvider
	baseDir  string
}

func New(provider SkillProvider, baseDir string) *Installer {
	return &Installer{
		provider: provider,
		baseDir:  baseDir,
	}
}

func (i *Installer) Install(skillName string) error {
	skill, err := i.provider.Find(skillName)
	if err != nil {
		return fmt.Errorf("skill not found: %s", skillName)
	}

	// Always install to folder: .claude/skills/{skill-name}/
	skillDir := filepath.Join(i.baseDir, TargetDir, skill.Name)

	// Fetch all files (at minimum SKILL.md)
	files, err := i.provider.GetFiles(skill)
	if err != nil {
		return fmt.Errorf("failed to fetch skill files: %w", err)
	}

	for relPath, content := range files {
		fullPath := filepath.Join(skillDir, relPath)

		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			return fmt.Errorf("failed to create directory for %s: %w", relPath, err)
		}

		if err := os.WriteFile(fullPath, content, 0644); err != nil {
			return fmt.Errorf("failed to write %s: %w", relPath, err)
		}
	}

	return nil
}

func (i *Installer) InstallMultiple(skillNames []string) (installed []string, errors []error) {
	for _, name := range skillNames {
		if err := i.Install(name); err != nil {
			errors = append(errors, fmt.Errorf("%s: %w", name, err))
		} else {
			installed = append(installed, name)
		}
	}
	return
}

func (i *Installer) InstallStack(stack string) (installed []string, errors []error) {
	skills, err := i.provider.ListByStack(stack)
	if err != nil {
		errors = append(errors, fmt.Errorf("failed to list stack %s: %w", stack, err))
		return
	}
	if len(skills) == 0 {
		errors = append(errors, fmt.Errorf("no skills found in stack: %s", stack))
		return
	}

	for _, skill := range skills {
		if err := i.Install(skill.Name); err != nil {
			errors = append(errors, err)
		} else {
			installed = append(installed, skill.Name)
		}
	}
	return
}

func (i *Installer) InstallAll() (installed []string, errors []error) {
	skills, err := i.provider.List()
	if err != nil {
		errors = append(errors, fmt.Errorf("failed to list skills: %w", err))
		return
	}

	for _, skill := range skills {
		if err := i.Install(skill.Name); err != nil {
			errors = append(errors, err)
		} else {
			installed = append(installed, skill.Name)
		}
	}
	return
}

func (i *Installer) Remove(skillName string) error {
	dirPath := filepath.Join(i.baseDir, TargetDir, skillName)

	// Check if skill directory exists
	info, err := os.Stat(dirPath)
	if os.IsNotExist(err) {
		return fmt.Errorf("skill not installed: %s", skillName)
	}
	if err != nil {
		return fmt.Errorf("failed to check skill: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("skill not installed: %s", skillName)
	}

	return os.RemoveAll(dirPath)
}

func (i *Installer) ListInstalled() ([]string, error) {
	targetDir := filepath.Join(i.baseDir, TargetDir)

	entries, err := os.ReadDir(targetDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}

	var installed []string
	for _, entry := range entries {
		if entry.IsDir() {
			// Skill directory: check for SKILL.md inside
			skillMd := filepath.Join(targetDir, entry.Name(), "SKILL.md")
			if _, err := os.Stat(skillMd); err == nil {
				installed = append(installed, entry.Name())
			}
		}
	}

	return installed, nil
}

func (i *Installer) IsInstalled(skillName string) bool {
	dirPath := filepath.Join(i.baseDir, TargetDir, skillName)
	info, err := os.Stat(dirPath)
	if err != nil || !info.IsDir() {
		return false
	}

	// Check for SKILL.md inside the directory
	skillMd := filepath.Join(dirPath, "SKILL.md")
	_, err = os.Stat(skillMd)
	return err == nil
}

func (i *Installer) Update(skillName string) error {
	if !i.IsInstalled(skillName) {
		return fmt.Errorf("skill not installed: %s", skillName)
	}

	// Remove old and install new
	if err := i.Remove(skillName); err != nil {
		return fmt.Errorf("failed to remove old skill: %w", err)
	}

	return i.Install(skillName)
}

func (i *Installer) UpdateAll() (updated []string, errors []error) {
	installed, err := i.ListInstalled()
	if err != nil {
		errors = append(errors, err)
		return
	}

	if len(installed) == 0 {
		return
	}

	for _, name := range installed {
		if err := i.Update(name); err != nil {
			errors = append(errors, fmt.Errorf("%s: %w", name, err))
		} else {
			updated = append(updated, name)
		}
	}
	return
}
