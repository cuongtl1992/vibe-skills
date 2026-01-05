package cli

import (
	"fmt"
	"os"

	"github.com/cuongtl1992/vibe-skills/internal/config"
	"github.com/cuongtl1992/vibe-skills/internal/registry"
	"github.com/spf13/cobra"
)

var (
	// Global flags
	flagBranch string
	flagRef    string
)

var rootCmd = &cobra.Command{
	Use:   "vibe-skills",
	Short: "A CLI tool to manage Claude Code skills",
	Long: `Vibe Skills is a community-driven collection of skills for Claude Code.

Install and manage AI coding assistant skills organized by technology stack.
Skills are installed to .claude/skills/ in your project directory.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	// Global flags for registry branch/ref
	rootCmd.PersistentFlags().StringVar(&flagBranch, "branch", "", "Use skills from specific branch (e.g., develop)")
	rootCmd.PersistentFlags().StringVar(&flagRef, "ref", "", "Use skills from specific ref (branch, tag, or commit)")

	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(installCmd)
	rootCmd.AddCommand(removeCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(searchCmd)
	rootCmd.AddCommand(updateCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(selfUpdateCmd)
}

// getRegistry creates a registry instance with resolved ref
func getRegistry() (*registry.GitHubRegistry, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return nil, err
	}

	// Load configs
	var projectCfg *config.Config
	if config.Exists(cwd) {
		projectCfg, _ = config.Load(cwd)
	}

	globalCfg, _ := config.LoadGlobal()

	// Resolve ref with priority
	ref := config.ResolveRef(flagBranch, flagRef, projectCfg, globalCfg)

	return registry.NewGitHubRegistry(&registry.GitHubRegistryOptions{
		Ref: ref,
	}), nil
}
