package cli

import (
	"fmt"
	"os"

	"github.com/cuongtl/vibe-skills/internal/installer"
	"github.com/spf13/cobra"
)

var removeCmd = &cobra.Command{
	Use:     "remove [skills...]",
	Aliases: []string{"rm", "uninstall"},
	Short:   "Remove installed skills",
	Long: `Remove one or more installed skills from the current project.

Examples:
  vibe-skills remove commit-convention
  vibe-skills remove ef-core sql-optimization`,
	Args: cobra.MinimumNArgs(1),
	RunE: runRemove,
}

func runRemove(cmd *cobra.Command, args []string) error {
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %w", err)
	}

	reg, err := getRegistry()
	if err != nil {
		return fmt.Errorf("failed to create registry: %w", err)
	}

	inst := installer.New(reg, cwd)

	var removed []string
	var errors []error

	for _, name := range args {
		if err := inst.Remove(name); err != nil {
			errors = append(errors, fmt.Errorf("%s: %w", name, err))
		} else {
			removed = append(removed, name)
		}
	}

	if len(removed) > 0 {
		fmt.Printf("Removed %d skill(s):\n", len(removed))
		for _, name := range removed {
			fmt.Printf("  ✓ %s\n", name)
		}
	}

	if len(errors) > 0 {
		fmt.Printf("\nFailed to remove %d skill(s):\n", len(errors))
		for _, err := range errors {
			fmt.Printf("  ✗ %s\n", err)
		}
		return fmt.Errorf("some skills failed to remove")
	}

	return nil
}
