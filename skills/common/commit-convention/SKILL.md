# Commit Convention

Follow conventional commit format for all git commits.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Examples

```
feat(auth): add OAuth2 login support

fix(api): handle null response from external service

docs(readme): update installation instructions

refactor(user): extract validation logic to separate module

perf(query): add database index for user lookup

test(auth): add unit tests for token refresh

chore(deps): update dependencies to latest versions
```

## Rules

1. Use lowercase for type and scope
2. Keep the subject line under 72 characters
3. Use imperative mood in the subject line ("add" not "added")
4. Do not end the subject line with a period
5. Separate subject from body with a blank line
6. Use the body to explain what and why vs. how
7. Include breaking changes in footer with `BREAKING CHANGE:` prefix
