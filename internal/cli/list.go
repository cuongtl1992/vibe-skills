package cli

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/cuongtl/vibe-skills/internal/installer"
	"github.com/cuongtl/vibe-skills/internal/registry"
	"github.com/spf13/cobra"
)

var (
	listStack     string
	listInstalled bool
)

var listCmd = &cobra.Command{
	Use:     "list",
	Aliases: []string{"ls"},
	Short:   "List available skills",
	Long: `List all available skills or filter by stack.

Examples:
  vibe-skills list                    # List all available skills
  vibe-skills list --stack dotnet     # List skills in dotnet stack
  vibe-skills list --installed        # List installed skills only
  vibe-skills list --branch develop   # List skills from develop branch`,
	RunE: runList,
}

func init() {
	listCmd.Flags().StringVarP(&listStack, "stack", "s", "", "Filter by stack")
	listCmd.Flags().BoolVarP(&listInstalled, "installed", "i", false, "List installed skills only")
}

func runList(cmd *cobra.Command, args []string) error {
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %w", err)
	}

	reg, err := getRegistry()
	if err != nil {
		return fmt.Errorf("failed to create registry: %w", err)
	}

	inst := installer.New(reg, cwd)

	if listInstalled {
		installed, err := inst.ListInstalled()
		if err != nil {
			return fmt.Errorf("failed to list installed skills: %w", err)
		}

		if len(installed) == 0 {
			fmt.Println("No skills installed in this project.")
			return nil
		}

		fmt.Printf("Installed skills (%d):\n", len(installed))
		for _, name := range installed {
			fmt.Printf("  %s\n", name)
		}
		return nil
	}

	var skills []registry.Skill
	if listStack != "" {
		skills, err = reg.ListByStack(listStack)
		if err != nil {
			return fmt.Errorf("failed to list skills: %w", err)
		}
		if len(skills) == 0 {
			fmt.Printf("No skills found in stack: %s\n", listStack)
			stacks, _ := reg.GetStacks()
			if len(stacks) > 0 {
				fmt.Println("\nAvailable stacks:")
				for _, stack := range stacks {
					fmt.Printf("  %s\n", stack)
				}
			}
			return nil
		}
	} else {
		skills, err = reg.List()
		if err != nil {
			return fmt.Errorf("failed to list skills: %w", err)
		}
	}

	if len(skills) == 0 {
		fmt.Println("No skills available.")
		return nil
	}

	// Group by stack
	grouped := make(map[string][]registry.Skill)
	for _, skill := range skills {
		grouped[skill.Stack] = append(grouped[skill.Stack], skill)
	}

	// Get sorted stack names
	var stacks []string
	for stack := range grouped {
		stacks = append(stacks, stack)
	}
	sort.Strings(stacks)

	// Print header with registry info
	fmt.Printf("Registry: %s\n", reg.GetRef())

	// Print grouped skills
	for _, stack := range stacks {
		fmt.Printf("\n%s:\n", strings.ToUpper(stack))
		stackSkills := grouped[stack]
		sort.Slice(stackSkills, func(i, j int) bool {
			return stackSkills[i].Name < stackSkills[j].Name
		})

		for _, skill := range stackSkills {
			installed := ""
			if inst.IsInstalled(skill.Name) {
				installed = " [installed]"
			}
			if skill.Description != "" {
				fmt.Printf("  %-25s %s%s\n", skill.Name, skill.Description, installed)
			} else {
				fmt.Printf("  %s%s\n", skill.Name, installed)
			}
		}
	}

	return nil
}
