# Code Review Request Template

Use this template to provide context when requesting a code review from the KAT Flutter Code Reviewer.

## Review Request Format

### Option 1: Git Diff Review (Commits/Branches)

When reviewing changes between commits or branches:

```
Please review the following changes:

**Review Type:** Git Diff

**Base:** [commit-hash or branch-name]
**Compare:** [commit-hash or branch-name]

**Location:**
- [ ] Local branches/commits
- [ ] Remote branches/commits (origin/branch-name)

**Context:**
[Brief description of what changed and why]

**Focus Areas:** (optional)
- [ ] Architecture changes
- [ ] State management
- [ ] Performance optimizations
- [ ] Security concerns
- [ ] UI/UX changes
- [ ] Testing coverage
- [ ] Other: _____________

**Related:**
- Issue/Ticket: #___
- PR/MR: #___
```

**Examples:**

```
Please review the following changes:

**Review Type:** Git Diff
**Base:** develop
**Compare:** feat/user-authentication
**Location:** Local branches

**Context:**
Implemented user authentication feature using Firebase Auth.
Added login/register screens, auth repository, and authentication state management.

**Focus Areas:**
- [x] Architecture changes
- [x] State management
- [x] Security concerns
- [x] Testing coverage

**Related:**
- Issue: #123
- PR: #456
```

```
Please review the following changes:

**Review Type:** Git Diff
**Base:** abc123def (last stable release)
**Compare:** HEAD
**Location:** Local commits

**Context:**
Bug fixes for payment processing issues reported by users.

**Focus Areas:**
- [x] Security concerns
- [x] Testing coverage
```

### Option 2: Specific Files/Folders Review

When reviewing specific files or folders without git context:

```
Please review the following code:

**Review Type:** Specific Files/Folders

**Files/Folders to Review:**
- path/to/file1.dart
- path/to/file2.dart
- path/to/folder/

**Context:**
[Brief description of what these files do and any specific concerns]

**Focus Areas:** (optional)
- [ ] Architecture patterns
- [ ] State management
- [ ] Code quality
- [ ] Performance
- [ ] Security
- [ ] Testing
- [ ] Documentation
- [ ] Other: _____________

**Specific Concerns:** (optional)
[Any particular issues or questions you have about this code]
```

**Examples:**

```
Please review the following code:

**Review Type:** Specific Files/Folders

**Files/Folders to Review:**
- lib/features/payment/presentation/controllers/payment_controller.dart
- lib/features/payment/data/repositories/payment_repository.dart
- lib/features/payment/domain/use_cases/

**Context:**
New payment processing feature. Want to ensure we're following clean architecture
and properly handling sensitive payment data.

**Focus Areas:**
- [x] Architecture patterns
- [x] Security
- [x] Testing

**Specific Concerns:**
- Is the error handling comprehensive enough for payment failures?
- Are we properly sanitizing user input before sending to payment gateway?
- Should we add more unit tests for edge cases?
```

```
Please review the following code:

**Review Type:** Specific Files/Folders

**Files/Folders to Review:**
- lib/core/widgets/

**Context:**
Refactored common widgets to be more reusable. Want to check if they follow
Flutter best practices and KAT standards.

**Focus Areas:**
- [x] Code quality
- [x] Performance
- [x] Documentation
```

### Option 3: Entire Feature/Module Review

When reviewing a complete feature or module:

```
Please review the following feature:

**Review Type:** Feature/Module Review

**Feature/Module:** [name]
**Location:** [path to feature folder]

**Description:**
[What does this feature do?]

**Architecture Overview:**
- Presentation: [brief description]
- Domain: [brief description]
- Data: [brief description]

**Key Components:**
- Controllers: [list]
- Use Cases: [list]
- Repositories: [list]
- Models/Entities: [list]

**Focus Areas:** (optional)
- [ ] Complete architecture review
- [ ] State management implementation
- [ ] Data flow and business logic
- [ ] API integration
- [ ] Error handling
- [ ] Testing strategy
- [ ] Performance considerations
- [ ] Other: _____________

**Known Issues/Questions:**
[Any known issues or specific questions]
```

**Example:**

```
Please review the following feature:

**Review Type:** Feature/Module Review

**Feature/Module:** User Profile Management
**Location:** lib/features/profile/

**Description:**
Allows users to view and edit their profile information, upload avatar,
and manage account settings.

**Architecture Overview:**
- Presentation: ProfileScreen, ProfileController (Cubit), profile widgets
- Domain: UpdateProfileUseCase, GetProfileUseCase, User entity
- Data: ProfileRepository, ProfileRemoteDataSource, ProfileLocalDataSource

**Key Components:**
- Controllers: ProfileController
- Use Cases: GetProfileUseCase, UpdateProfileUseCase, UploadAvatarUseCase
- Repositories: ProfileRepository
- Models/Entities: User, UserProfile, ProfileUpdateRequest

**Focus Areas:**
- [x] Complete architecture review
- [x] State management implementation
- [x] Error handling
- [x] Testing strategy

**Known Issues/Questions:**
- Should we cache profile data locally or always fetch from server?
- Image upload currently blocks UI - should we use isolates?
```

## Git Commands for Getting Commit/Branch Info

### Find Commit Hashes

```bash
# Show recent commits
git log --oneline -10

# Show commits between branches
git log develop..feat/my-feature --oneline

# Show current commit
git rev-parse HEAD

# Show specific branch's latest commit
git rev-parse origin/develop
```

### Compare Branches

```bash
# Show files changed between branches
git diff --name-only develop..feat/my-feature

# Show detailed diff between branches
git diff develop..feat/my-feature

# Show commits in feature branch not in develop
git log develop..feat/my-feature
```

### Check Branch Information

```bash
# List all local branches
git branch

# List all remote branches
git branch -r

# List all branches (local and remote)
git branch -a

# Show current branch
git branch --show-current
```

## Review Scope Guidelines

### When to Use Git Diff Review

- Reviewing pull request changes
- Comparing feature branch against main/develop
- Reviewing changes since last release
- Checking what changed between commits

### When to Use Specific Files Review

- Refactoring specific components
- New feature in isolated files
- Reviewing code snippets or examples
- Checking specific implementations without git history

### When to Use Feature/Module Review

- Complete feature implementation
- New module or microservice
- Major refactoring of existing feature
- Architecture validation for a component

## Tips for Better Reviews

1. **Provide Context:** Explain what changed and why. Include links to issues/tickets.

2. **Be Specific:** If you have concerns about specific areas, mention them upfront.

3. **Include Tests:** If you've added tests, mention them so the reviewer can check coverage.

4. **Note Dependencies:** If changes depend on other PRs or external changes, note them.

5. **Highlight Risks:** If there are potential breaking changes or risky modifications, call them out.

6. **Size Matters:** Smaller, focused reviews are easier to review thoroughly. Consider breaking large changes into smaller PRs.

7. **Self-Review First:** Review your own code first and fix obvious issues before requesting review.

## After Review

When you receive review feedback:

- Address all `[BLOCKING]` issues before merging
- Consider all `[SUGGESTION]` items and respond with your decision
- Answer all `[QUESTION]` comments
- Fix `[NIT]` issues if time permits

Mark conversations as resolved once addressed, and re-request review if significant changes were made.
