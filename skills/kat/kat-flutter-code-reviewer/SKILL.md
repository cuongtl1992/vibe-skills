---
name: kat-flutter-code-reviewer
description: Systematic code review for Flutter applications following KAT team standards. Use when reviewing pull requests, code changes, diffs, or when asked to review/critique Flutter/Dart code. Covers functionality, architecture, performance, security, testing, and documentation with structured feedback using priority prefixes.
---

# KAT Flutter Code Reviewer

Systematic approach to reviewing Flutter/Dart code changes following KAT team best practices.

## How to Request a Review

Before requesting a review, please provide context using the [Request Code Review Template](references/request_code_review_template.md). This helps the reviewer understand:
- What code to review (git diff, specific files, or entire feature)
- Base and compare commits/branches
- Context and purpose of changes
- Areas to focus on

## Review Process

1. **Understand context** - Read review request, PR description, linked issues, related files
2. **Review by area** 
    - Apply common checklist from [references/common_checklist.md](references/common_checklist.md)
    - Apply Dart-specific rules from [references/dart_ai_rules.md](references/dart_ai_rules.md)
    - Apply Flutter-specific rules from [references/flutter_ai_rules.md](references/flutter_ai_rules.md)
3. **Provide feedback** - Use comment format below

## Comment Format

Use prefixes to indicate priority:

| Prefix | Meaning | Action |
|--------|---------|--------|
| `[BLOCKING]` | Must fix before merge | Required |
| `[SUGGESTION]` | Improvement opportunity | Optional |
| `[QUESTION]` | Need clarification | Response needed |
| `[NIT]` | Minor style issue | Optional |

**Comment structure:**
```
[PREFIX] Brief issue description

Why: Explanation of the problem or risk
Fix: Suggested solution or alternative
```

**Example:**
```
[BLOCKING] State management not using clean architecture pattern

Why: Controller directly accesses repository instead of using use case layer
Fix: Create GetUserUseCase and inject it into the controller

// Before
class UserController extends Cubit<UserState> {
  final UserRepository repository;
  
  Future<void> loadUser() async {
    final user = await repository.getUser();
    emit(UserState.loaded(user));
  }
}

// After  
class UserController extends Cubit<UserState> {
  final GetUserUseCase getUserUseCase;
  
  Future<void> loadUser() async {
    final user = await getUserUseCase.execute();
    emit(UserState.loaded(user));
  }
}
```

## Feedback Principles

- Point to exact lines with specific alternatives
- Explain *why* something is problematic based on KAT standards
- Focus on code, not the author
- Acknowledge good patterns when found
- Ensure code follows clean architecture principles
- Verify proper use of state management (Cubit/Bloc with freezed)
- Check for proper dependency injection with GetIt
