# Contributing to Vibe Skills

Thank you for your interest in contributing to Vibe Skills! This document provides guidelines and instructions for contributing.

## Ways to Contribute

- **Add new skills**: Create skills for technologies you know well
- **Improve existing skills**: Enhance documentation, fix errors
- **Report bugs**: Submit issues for problems you encounter
- **Suggest features**: Share ideas for improving the CLI
- **Improve documentation**: Help make docs clearer

## Creating a New Skill

### 1. Choose the Right Stack

Skills are organized by technology stack:

```
skills/
├── common/      # Universal skills (code review, commits, PRs)
├── dotnet/      # .NET ecosystem
├── database/    # Database technologies
├── frontend/    # Frontend frameworks
├── devops/      # DevOps and infrastructure
```

### 2. Create the Skill Directory

```bash
mkdir -p skills/<stack>/<skill-name>
```

### 3. Write SKILL.md

Create a `SKILL.md` file with your skill content:

```markdown
# Skill Name

Brief description of what this skill teaches Claude to do.

## Overview
Explain the purpose and context.

## Guidelines
- Specific instruction 1
- Specific instruction 2
- Specific instruction 3

## Examples
Show concrete examples of how to apply this skill.

## Best Practices
List recommended practices.

## Common Pitfalls
Describe what to avoid.
```

### 4. Update the Registry

After creating your skill, regenerate the registry index:

```bash
./scripts/generate-registry.sh
```

This will automatically update `skills/registry.json` with your new skill.

### 5. Skill Guidelines

- **Be concise**: Claude has limited context, keep skills focused
- **Be specific**: Provide concrete examples, not abstract concepts
- **Be actionable**: Include clear instructions Claude can follow
- **Use formatting**: Headers, lists, and code blocks improve readability
- **Include examples**: Show both good and bad patterns

### 6. Test Locally

Since the CLI fetches skills from GitHub, you'll need to push your changes to test with the remote registry. However, you can verify the skill structure:

```bash
# Regenerate registry.json
./scripts/generate-registry.sh

# Verify your skill appears in registry.json
cat skills/registry.json | grep "<skill-name>"

# Build the CLI
go build -o vibe-skills ./cmd/vibe-skills

# Test with a specific branch (after pushing)
./vibe-skills list --branch your-feature-branch
./vibe-skills install <skill-name> --branch your-feature-branch
```

## Submitting Changes

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-new-skill`
3. Create your skill in `skills/<stack>/<skill-name>/SKILL.md`
4. Run `./scripts/generate-registry.sh` to update registry.json
5. Commit both the SKILL.md and registry.json changes
6. Push to your fork
7. Open a pull request

### PR Requirements

- [ ] Skill is in `skills/<stack>/<skill-name>/SKILL.md`
- [ ] `skills/registry.json` is updated (run `./scripts/generate-registry.sh`)
- [ ] SKILL.md is well-formatted
- [ ] No breaking changes to existing skills

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(skills): add new database optimization skill
fix(cli): resolve install path issue on Windows
docs(readme): update installation instructions
```

## Development Setup

### Prerequisites

- Go 1.22 or later
- Git

### Building

```bash
# Clone the repo
git clone https://github.com/cuongtl/vibe-skills.git
cd vibe-skills

# Install dependencies
go mod download

# Build
go build -o vibe-skills ./cmd/vibe-skills

# Run tests
go test ./...
```

### Project Structure

```
vibe-skills/
├── cmd/vibe-skills/       # CLI entry point
├── internal/
│   ├── cli/               # Cobra commands
│   ├── config/            # Config file handling (.vibe-skills.yaml)
│   ├── installer/         # Skill installation logic
│   ├── registry/          # GitHub registry client & caching
│   ├── updater/           # Self-update logic
│   └── version/           # Version info
├── skills/                # Skill content (fetched from GitHub)
│   ├── registry.json      # Auto-generated skill index
│   └── <stack>/<name>/    # Individual skills
├── scripts/
│   ├── install.sh         # One-liner installer
│   └── generate-registry.sh  # Registry generator
└── .github/workflows/     # CI/CD workflows
```

### How the Remote Registry Works

Skills are fetched from GitHub raw content at runtime:

```
https://raw.githubusercontent.com/cuongtl/vibe-skills/{ref}/skills/registry.json
https://raw.githubusercontent.com/cuongtl/vibe-skills/{ref}/skills/{stack}/{name}/SKILL.md
```

The `{ref}` can be a branch, tag, or commit hash. Users can specify it via:
- CLI flags: `--branch develop` or `--ref v1.0.0`
- Project config: `.vibe-skills.yaml`
- Global config: `~/.vibe-skills/config.yaml`

## Code Style

- Follow standard Go formatting (`gofmt`)
- Run `golangci-lint` before submitting
- Keep functions small and focused
- Add comments for non-obvious logic

## Getting Help

- Open an issue for questions
- Join discussions in existing issues
- Tag maintainers if needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
