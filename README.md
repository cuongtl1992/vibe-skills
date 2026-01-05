# Vibe Skills

A community-driven collection of skills for Claude Code. Easily install and manage AI coding assistant skills organized by technology stack.

## Features

- **Stack-based organization** - Skills organized by technology (dotnet, database, frontend, devops)
- **Project-level installation** - Install skills per project, commit to git for team consistency
- **Simple CLI** - Easy to use command-line interface
- **Self-updating** - CLI can update itself from GitHub releases
- **Remote registry** - Skills fetched from GitHub, always up-to-date without CLI updates
- **Multi-branch support** - Test pre-release skills from develop or feature branches

## Installation

### Quick Install (Recommended)

```bash
# macOS/Linux
curl -sSL https://raw.githubusercontent.com/cuongtl/vibe-skills/main/scripts/install.sh | bash

# Or with Go
go install github.com/cuongtl/vibe-skills/cmd/vibe-skills@latest
```

### Download from GitHub Releases

```bash
# macOS (Apple Silicon)
curl -L https://github.com/cuongtl/vibe-skills/releases/latest/download/vibe-skills_darwin_arm64.tar.gz | tar xz
sudo mv vibe-skills /usr/local/bin/

# macOS (Intel)
curl -L https://github.com/cuongtl/vibe-skills/releases/latest/download/vibe-skills_darwin_amd64.tar.gz | tar xz
sudo mv vibe-skills /usr/local/bin/

# Linux (amd64)
curl -L https://github.com/cuongtl/vibe-skills/releases/latest/download/vibe-skills_linux_amd64.tar.gz | tar xz
sudo mv vibe-skills /usr/local/bin/

# Linux (arm64)
curl -L https://github.com/cuongtl/vibe-skills/releases/latest/download/vibe-skills_linux_arm64.tar.gz | tar xz
sudo mv vibe-skills /usr/local/bin/
```

### Windows

```powershell
Invoke-WebRequest -Uri https://github.com/cuongtl/vibe-skills/releases/latest/download/vibe-skills_windows_amd64.zip -OutFile vibe-skills.zip
Expand-Archive vibe-skills.zip -DestinationPath .
# Add to PATH or move to a directory in PATH
```

## Usage

### Initialize a project

```bash
cd your-project
vibe-skills init
```

This creates a `.vibe-skills.yaml` config file in your project.

### Install skills

```bash
# Install from config file
vibe-skills install

# Install specific skills
vibe-skills install commit-convention code-reviewer

# Install all skills from a stack
vibe-skills install --stack dotnet

# Install multiple stacks
vibe-skills install --stack common,dotnet,database

# Install all available skills
vibe-skills install --all
```

### List available skills

```bash
# List all skills
vibe-skills list

# List skills in a specific stack
vibe-skills list --stack dotnet

# List installed skills only
vibe-skills list --installed
```

### Search skills

```bash
vibe-skills search "database"
vibe-skills search "review"
```

### Remove skills

```bash
vibe-skills remove commit-convention
```

### Update CLI

```bash
vibe-skills self-update
```

### Using Different Branches/Versions

```bash
# Use skills from develop branch (pre-release testing)
vibe-skills list --branch develop
vibe-skills install commit-convention --branch develop

# Use skills from a specific tag/version
vibe-skills list --ref v1.0.0
vibe-skills install --ref v1.0.0
```

## Config File

### Project Config: `.vibe-skills.yaml`

Create in your project root:

```yaml
# Optional: Use a specific branch/ref for this project
registry:
  branch: develop  # or use 'ref: v1.0.0' for a specific version

skills:
  # Common skills for all projects
  - common/commit-convention
  - common/code-reviewer

  # Stack-specific skills
  - dotnet/clean-architecture
  - dotnet/ef-core
  - database/sql-optimization
```

### Global Config: `~/.vibe-skills/config.yaml`

Set default branch for all projects:

```yaml
registry:
  branch: main  # default branch to use
```

### Config Priority

1. CLI flags (`--branch`, `--ref`) - highest priority
2. Project config (`.vibe-skills.yaml`)
3. Global config (`~/.vibe-skills/config.yaml`)
4. Default: `main` branch

## Available Skills

### Common
| Skill | Description |
|-------|-------------|
| `commit-convention` | Conventional commit message format |
| `code-reviewer` | Code review checklist and guidelines |

*More skills coming soon! Contributions welcome.*

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Creating a new skill

1. Fork the repository
2. Create a new directory under `skills/<stack>/<skill-name>/`
3. Add a `SKILL.md` file with your skill content
4. Run `./scripts/generate-registry.sh` to update the registry
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
