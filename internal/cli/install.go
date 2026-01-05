package cli

import (
	"fmt"
	"os"
	"strings"

	"github.com/cuongtl/vibe-skills/internal/config"
	"github.com/cuongtl/vibe-skills/internal/installer"
	"github.com/spf13/cobra"
)

var (
	installStack string
	installAll   bool
	installForce bool
)

var installCmd = &cobra.Command{
	Use:   "install [skills...]",
	Short: "Install skills to the current project",
	Long: `Install one or more skills to the current project.

Skills are installed to .claude/skills/ directory.

Examples:
  vibe-skills install                     # Install from .vibe-skills.yaml
  vibe-skills install commit-convention   # Install a specific skill
  vibe-skills install ef-core sql-opt     # Install multiple skills
  vibe-skills install --stack dotnet      # Install all skills from a stack
  vibe-skills install --all               # Install all available skills`,
	RunE: runInstall,
}

func init() {
	installCmd.Flags().StringVarP(&installStack, "stack", "s", "", "Install all skills from specified stack(s), comma-separated")
	installCmd.Flags().BoolVarP(&installAll, "all", "a", false, "Install all available skills")
	installCmd.Flags().BoolVarP(&installForce, "force", "f", false, "Overwrite existing skills")
}

func runInstall(cmd *cobra.Command, args []string) error {
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %w", err)
	}

	reg, err := getRegistry()
	if err != nil {
		return fmt.Errorf("failed to create registry: %w", err)
	}

	fmt.Printf("Using registry: %s\n\n", reg.GetRef())

	inst := installer.New(reg, cwd)

	var installed []string
	var errors []error

	switch {
	case installAll:
		installed, errors = inst.InstallAll()

	case installStack != "":
		stacks := strings.Split(installStack, ",")
		for _, stack := range stacks {
			stack = strings.TrimSpace(stack)
			i, e := inst.InstallStack(stack)
			installed = append(installed, i...)
			errors = append(errors, e...)
		}

	case len(args) > 0:
		installed, errors = inst.InstallMultiple(args)

	default:
		// Install from config file
		cfg, err := config.Load(cwd)
		if err != nil {
			return fmt.Errorf("no skills specified and no config file found.\nRun 'vibe-skills init' to create a config file, or specify skills to install.")
		}
		installed, errors = inst.InstallMultiple(cfg.Skills)
	}

	// Print results
	if len(installed) > 0 {
		fmt.Printf("Installed %d skill(s):\n", len(installed))
		for _, name := range installed {
			fmt.Printf("  ✓ %s\n", name)
		}
	}

	if len(errors) > 0 {
		fmt.Printf("\nFailed to install %d skill(s):\n", len(errors))
		for _, err := range errors {
			fmt.Printf("  ✗ %s\n", err)
		}
		return fmt.Errorf("some skills failed to install")
	}

	if len(installed) == 0 {
		fmt.Println("No skills to install.")
	}

	return nil
}
