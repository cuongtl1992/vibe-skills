---
name: flutter-tdd
description: Flutter TDD workflow with codebase exploration and Figma design integration. Guides the Explore-Plan-Test-Implement-Refactor-Review cycle for any Flutter application. Use when implementing Flutter features test-first, "TDD", "Red-Green-Refactor", developing UI from Figma designs, or when user says "write tests first". Do NOT use for Flutter architecture setup (follow CLAUDE.md), BDD/Gherkin scenarios, or E2E/integration tests.
metadata:
  version: 1.0.0
  tags: [flutter, tdd, testing, red-green-refactor, figma, dart]
---

# Flutter TDD Workflow

Test-Driven Development workflow for Flutter applications. Adapts to any testing stack, state management, and architecture discovered in the EXPLORE phase.

Every piece of code follows the **Explore -> Plan -> Test (RED) -> Implement (GREEN) -> Refactor -> Review** cycle.

---

## Phase 0: EXPLORE

Before writing any code, understand the project you are working in.

1. **Find project references** — look for `CLAUDE.md`, `.cursorrules`, `.cursor/rules/*.mdc`, `README.md`, or any documentation files that describe project overview, base structure, architecture decisions, and coding conventions. These are your primary source of truth.
2. **Identify Flutter version** — check `pubspec.yaml`, `flutter --version`, and `.fvmrc` or `.fvm/fvm_config.json` to determine if the project uses FVM (Flutter Version Management) or a direct Flutter SDK setup.
3. **Understand project structure** — based on reference docs found in step 1, determine: monorepo workspace or standalone? Clean Architecture, Hexagonal Architecture, Onion Architecture, or other? Feature-based, layer-based, or hybrid organization?
4. **Find testing setup** — `flutter_test`, `bloc_test`, `mocktail` or `mockito`?
5. **Review existing patterns** — BLoC/Cubit style, state management, DI approach
6. **Check UI framework** — Material, Cupertino, custom design system, or third-party component library

### Exploration Output Template (Summary)

```
Reference Docs: [CLAUDE.md, .cursorrules, README.md, etc.]
Flutter Version: [version] | FVM: [yes (version) / no]
Dart Version: [version]
Project Type: [workspace monorepo / standalone app / Melos monorepo]
Architecture: [Clean Architecture / Hexagonal / Onion / feature-based / hybrid]
State Management: [library + pattern + state definition approach]
DI: [library + registration pattern + resolution pattern]
Error Handling: [Result<T> / Either / exceptions / sealed classes / AsyncValue]
Testing: [stack + mocking + test structure]
UI Framework: [Material / Cupertino / custom design system]
Key Conventions: [list notable patterns from reference docs]
```

For the **full output template** with detailed fields per section, consult `references/exploration-checklist.md` § 10.

---

## Phase 1: PLAN

Analyze the requirement before writing any code or test.

### Step 1: Figma Design Check

**If the task involves UI work**, ask the user:

> "Does this task have a Figma design? If yes, please share the Figma link or screenshot so I can review the design specifications (layout, spacing, colors, typography, responsive breakpoints)."

When a Figma link is provided:

- **Check if a Figma MCP server is available** — if yes, use it to fetch design data directly from the link
- Identify all visual widgets needed
- Note spacing, colors, typography tokens
- Identify responsive breakpoints and variants
- Map design components to Flutter widgets
- Cross-reference with the project's existing design system/theme

For detailed Figma analysis process and MCP integration, consult `references/figma-workflow.md`.

### Step 2: Requirement Analysis

1. **Understand the requirement** — what is the expected behavior?
2. **Identify components** — based on the architecture discovered in EXPLORE phase:
   - Which domain logic / business rules are needed? (validations, calculations, filtering)
   - Which utilities / helpers are needed? (formatters, parsers, extensions)
   - Which entities, enums, DTOs are needed?
   - Which use cases / services are needed?
   - Which repository interfaces and implementations are needed?
   - Which state management components are needed? (BLoC/Cubit/StateNotifier/etc.)
   - Which screens and widgets are needed?
3. **List test cases** — happy path, edge cases, error states, loading states, empty states, boundary values
4. **Define the public API** — widget constructor params, state management methods, use case signatures

### Component -> Test Strategy Matrix

| Component                         | What to test                                              | Mocking strategy                            |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Screen (Smart Widget)**         | State rendering, navigation, user interactions            | Mock state management (Cubit/BLoC/Provider) |
| **Widget (Dumb/Presentational)**  | Rendering, callbacks, visual states                       | No mocks — pass data directly               |
| **Cubit/BLoC/StateNotifier**      | Event/method → State transitions                          | Mock UseCases / Services                    |
| **UseCase**                       | Orchestration logic, repository calls, result mapping     | Mock Repository                             |
| **Repository Impl**               | DTO → Entity mapping, error handling                      | Mock DataSource                             |
| **Remote DataSource**             | HTTP request formation, response parsing                  | Mock HTTP client                            |
| **Domain Logic / Business Rules** | Calculations, validations, filtering, sorting, predicates | No mocks needed — pure functions            |
| **Utility / Helper Functions**    | Extensions, formatters, parsers, converters               | No mocks needed — pure functions            |
| **Entity**                        | Equality, `fromDto()` factory, domain methods             | No mocks needed                             |
| **Enum (with behavior)**          | Labels, colors, `fromString`, helpers                     | No mocks needed                             |
| **DTO**                           | JSON serialization/deserialization, round-trip            | No mocks needed                             |

### Plan Output Template

```
Feature: [Feature Name]

Domain Logic (no mocks):
- [Validation/Calculation/Filter] — [what it does]

Utilities (no mocks):
- [Formatter/Parser/Extension] — [what it does]

Entities / DTOs / Enums:
- [Name] — [responsibility]

Application Layer:
- [UseCase/Service] — [responsibility]
  - Input: [request type or params]
  - Output: [Result<EntityType> / Either<Failure, EntityType> / etc.]
  - Error cases: [what can go wrong]
- [Repository interface] — [contract]

Infrastructure:
- [Repository impl] — [data source mapping]
- [Data source] — [API/local]

Presentation:
- [State management component] — [state transitions]
- [Screen/Widget] — [UI responsibility]

Test Cases (ordered by complexity):
1. should [pure logic / validation case]
2. should [utility / formatter case]
3. should [entity / DTO case]
4. should [use case happy path]
5. should [use case error case]
6. should [state transition — loading → loaded]
7. should [state transition — loading → error]
8. should [widget renders correct state]
9. should [widget interaction triggers event]
10. should [edge case / boundary value]
```

---

## Phase 2: TEST (RED)

Write failing tests BEFORE any implementation. Tests must fail for the RIGHT reason.

### Test File Location

Test files should follow the project's test directory structure discovered in EXPLORE phase. Common pattern — mirror `lib/` inside `test/`:

```
lib/modules/invoice/application/use_case/get_invoices_usecase.dart
test/modules/invoice/application/use_case/get_invoices_usecase_test.dart
```

### Naming Convention

```dart
void main() {
  group('ClassName or FunctionName', () {
    test('should [expected behavior] when [condition]', () {
      // ...
    });
  });
}
```

### Test Structure: Arrange-Act-Assert

Every test follows the AAA pattern:

```dart
test('should return invoices when repository succeeds', () async {
  // Arrange — set up test data and configure mocks
  final invoices = [InvoiceEntity(id: '1', title: 'Invoice A')];
  when(() => mockRepository.getInvoices())
      .thenAnswer((_) async => Result.success(invoices));

  // Act — call the method under test
  final result = await useCase.execute(null);

  // Assert — verify the result
  expect(result.success, isTrue);
  expect(result.value, equals(invoices));
  verify(() => mockRepository.getInvoices()).called(1);
});
```

### What to Test First

Start with the **simplest, most pure tests** — they have no dependencies and provide fast feedback:

1. **Domain logic / pure functions** — validations, calculations, filtering (no mocks needed)
2. **Utility / helper functions** — extensions, formatters, parsers (no mocks needed)
3. **Entities** — equality, factory methods, domain methods (no mocks needed)
4. **DTOs** — JSON serialization round-trip (no mocks needed)
5. **Use cases** — orchestration logic (mock repository)
6. **Repository implementations** — DTO→Entity mapping (mock data source)
7. **State management** — BLoC/Cubit/StateNotifier state transitions (mock use cases)
8. **Widgets** — rendering, interactions, state display (mock state management)

### Key RED Phase Rules

1. **Write the test first** — it MUST fail (compile error counts as failing)
2. **One test at a time** — don't write all tests before implementing
3. **Test behavior, not implementation** — focus on what the user sees/experiences
4. **Start with pure functions** — domain logic and utilities need no mocks, test them first
5. **Use the project's existing test utilities** — don't introduce new libraries without reason
6. **Use the project's mocking library** — `mocktail`, `mockito`, or whatever was found in EXPLORE phase
7. **Use the project's state test library** — `bloc_test`, Riverpod testing utilities, etc.

For all TDD patterns (domain logic, utilities, Cubit, Widget, UseCase, Repository, DTO, Entity, Enum), consult `references/tdd-patterns.md`.

---

## Phase 3: IMPLEMENT (GREEN)

### Minimal Code to Pass

Write the **absolute minimum** code to make the failing test pass. No premature optimization, no extra features, no "while I'm here" changes.

- Follow existing project patterns discovered in EXPLORE phase (base classes, use case signatures, result types, ui components, common widgets,...)
- Use the project's established DI approach (service locator, constructor injection, provider, etc.)
- Match naming conventions from reference docs and EXPLORE phase
- Reuse existing helpers, utilities, and design system components — don't recreate what already exists

### Before Creating Shared / Common Code

If implementation requires creating something new that lives **outside** the feature module (shared widgets, common utilities, design system components, base classes, extensions), **ask the user first**:

> "To implement this, I need a [reusable widget / utility function / base class] that doesn't exist yet. Should I:
>
> 1. Create it in [shared location] so other features can reuse it?
> 2. Keep it local to this feature for now and extract later if needed?
> 3. Is there an existing component I missed that already handles this?"

**Why:** Creating shared code has a wider blast radius — it affects other features and developers. The user may know about existing solutions, have preferences on where shared code lives, or prefer to keep things feature-local until a pattern emerges.

---

## Phase 4: REFACTOR

After GREEN, refactor with confidence — tests are your safety net.

**CRITICAL**: Run tests after EVERY refactoring step. If a test fails, undo the refactor.

### Code Quality

- Ensure proper Dart types — no `dynamic` without reason
- Use `const` constructors wherever possible (widgets, entities, values)
- Remove dead code, unused imports, and commented-out code
- Simplify complex conditions — extract into well-named boolean methods or variables
- Extract pure functions out of stateful classes (easier to test, reuse)
- Run project's formatter and linter (e.g., `dart format`, `flutter analyze`)

### Widget Refactoring

- Extract reusable widgets if a pattern repeats 3+ times
- Keep `build()` methods small — extract sub-widgets for readability
- Avoid unnecessary rebuilds — use `const` widgets, `BlocSelector`/`select` for granular state
- Check accessibility (Semantics widgets, labels, sufficient touch targets)

### State & Logic Refactoring

- No business logic in state management classes — extract into use cases or domain functions
- State class props are complete — missing props in Equatable/Freezed = broken equality
- `copyWith` handles all fields correctly (if manually written)
- Extract shared domain logic into reusable functions (validators, calculators, filters)

### Project Conventions

- Barrel exports created for new files (if the project uses them)
- DI registrations added for new injectable classes
- Naming conventions match project standards
- File organization follows project's layer/feature structure

### The Inner Loop

```
Write ONE test (RED) -> Write minimal code (GREEN) -> Refactor -> Run tests -> Next test
```

---

## Phase 5: REVIEW

After implementing the feature, perform a systematic review.

### Test Coverage

- Are all test cases from the PLAN phase covered?
- Is the AAA pattern followed consistently in every test?
- Is test naming descriptive and consistent?
- Are there missing edge cases (loading, error, empty states, boundary values)?
- Are domain logic / pure functions tested without mocks?
- Do all tests pass? Run the project's test command.

### Architecture & Code Quality

- Does the code follow the project's architecture layers discovered in EXPLORE phase?
- Are dependencies flowing in the correct direction (no layer violations)?
- Is business logic in the correct layer (domain/application, not presentation)?
- State class props are complete (Equatable, Freezed, or however the project defines equality)
- No `dynamic` types without justification
- Code formatted and linted (project's formatter/analyzer)

### Integration

- Are dependencies registered in DI?
- Are barrel exports created (if the project uses them)?
- Does navigation work correctly?
- Are new strings localized (if the project uses i18n)?

### UI (if applicable)

- Does the UI match the Figma design (if provided)?
- Are all interactive states handled (loading, error, empty, disabled)?
- Accessibility: semantic labels, touch targets, contrast
- Responsive behavior on different screen sizes

### Final Verification

- Run all tests one final time: `flutter test` (or project-specific command)
- Run linter: `flutter analyze` (or project-specific command)
- Manual smoke test if possible

---

## Bug Fix Workflow

Bug fixes also follow TDD:

1. **EXPLORE**: Understand the current behavior, reproduce the bug, and check reference docs for context
2. **PLAN**: Identify root cause and affected components — document which layers are impacted
3. **TEST (RED)**: Write a test that reproduces the bug — it MUST fail
4. **IMPLEMENT (GREEN)**: Fix the bug with minimal changes — the test passes
5. **REFACTOR**: Clean up if needed, ensure no regressions
6. **REVIEW**: Verify fix doesn't break other tests, run full test suite

> **Important:** Bug fix scope should be minimal. Fix the bug, don't refactor surrounding code unless it's directly related to the root cause.

---

## References

For detailed guidance, consult these files as needed:

- `references/exploration-checklist.md` — What to look for when exploring a Flutter codebase
- `references/tdd-patterns.md` — Flutter TDD patterns (domain logic, utilities, state management, widgets, use cases, repositories, DTOs, entities, enums)
- `references/figma-workflow.md` — How to analyze Figma designs and translate to Flutter widgets (includes MCP integration)
