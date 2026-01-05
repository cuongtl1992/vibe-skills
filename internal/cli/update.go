package cli

import (
	"fmt"
	"os"

	"github.com/cuongtl1992/vibe-skills/internal/installer"
	"github.com/spf13/cobra"
)

var updateCmd = &cobra.Command{
	Use:   "update [skill-names...]",
	Short: "Update installed skills to latest version",
	Long: `Update installed skills to their latest version from the registry.

Examples:
  # Update all installed skills
  vibe-skills update

  # Update specific skill(s)
  vibe-skills update code-reviewer
  vibe-skills update code-reviewer sqlserver-expert`,
	RunE: runUpdate,
}

func runUpdate(cmd *cobra.Command, args []string) error {
	reg, err := getRegistry()
	if err != nil {
		return err
	}

	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %w", err)
	}

	inst := installer.New(reg, cwd)

	var updated []string
	var errors []error

	if len(args) == 0 {
		// Update all installed skills
		installed, err := inst.ListInstalled()
		if err != nil {
			return fmt.Errorf("failed to list installed skills: %w", err)
		}

		if len(installed) == 0 {
			fmt.Println("No skills installed to update")
			return nil
		}

		fmt.Printf("Updating %d installed skill(s)...\n", len(installed))
		updated, errors = inst.UpdateAll()
	} else {
		// Update specific skills
		fmt.Printf("Updating %d skill(s)...\n", len(args))
		for _, name := range args {
			if err := inst.Update(name); err != nil {
				errors = append(errors, fmt.Errorf("%s: %w", name, err))
			} else {
				updated = append(updated, name)
			}
		}
	}

	// Print results
	for _, name := range updated {
		fmt.Printf("  ✓ %s\n", name)
	}
	for _, err := range errors {
		fmt.Printf("  ✗ %s\n", err)
	}

	if len(errors) > 0 {
		return fmt.Errorf("failed to update %d skill(s)", len(errors))
	}

	if len(updated) > 0 {
		fmt.Printf("\nUpdated %d skill(s)\n", len(updated))
	}
	return nil
}
