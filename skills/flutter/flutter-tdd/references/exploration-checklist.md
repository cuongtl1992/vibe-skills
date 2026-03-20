# Flutter Codebase Exploration Checklist

Use this checklist when starting work on an unfamiliar Flutter project or module.

---

## 1. Find Project References

Before anything else, locate documentation that describes the project:

### Documentation Files to Look For
- `CLAUDE.md` — Claude Code project instructions (highest priority)
- `.cursorrules` — Cursor AI project rules
- `.cursor/rules/*.mdc` — Cursor rule files
- `README.md` — Project readme
- `CONTRIBUTING.md` — Contribution guidelines
- Any other `.md` or config files describing architecture, conventions, or setup

### What to Extract from Reference Docs
- **Project overview** — what the project does, its domain
- **Architecture pattern** — Clean Architecture, Hexagonal, Onion, feature-based, etc.
- **Coding conventions** — naming rules, file organization, code style
- **Layer structure** — which layers exist and their responsibilities
- **Dependency rules** — which layers can depend on which
- **DI approach** — how dependencies are registered and resolved
- **Key patterns** — Result type, base classes, entity patterns, etc.
- **Testing conventions** — preferred mocking library, test file structure, naming patterns, any test helpers/utilities
- **Error handling strategy** — how errors are modeled and propagated (Result type, exceptions, sealed classes)
- **State management approach** — BLoC vs Cubit, base classes, state/event patterns

> **These docs are your primary source of truth.** All subsequent exploration steps should validate and extend what you find here.

---

## 2. Project Configuration

### Flutter & Dart Version
- Check `pubspec.yaml` for SDK version constraints (`environment.sdk`, `environment.flutter`)
- Run `flutter --version` for the active Flutter/Dart version
- **Check for FVM (Flutter Version Management):**
  - `.fvmrc` — FVM 3.x+ config (contains Flutter version string)
  - `.fvm/fvm_config.json` — FVM 2.x config (contains `flutterSdkVersion`)
  - `.fvm/` directory presence indicates FVM is in use
  - If FVM is used, run `fvm flutter --version` instead of `flutter --version`

### pubspec.yaml (root & apps)
- Flutter SDK version constraint
- Dart SDK version constraint
- Key dependencies (flutter_bloc, equatable, get_it, json_serializable, etc.)
- Dev dependencies (flutter_test, bloc_test, mocktail, build_runner, etc.)
- Workspace resolution (`resolution: workspace`)

### analysis_options.yaml
- Strict mode enabled?
- Custom lint rules
- Line length setting (e.g., 100 characters)
- Excluded files/directories

### build.yaml
- `build_runner` configuration
- `json_serializable` options (field_rename, explicit_to_json, etc.)

> **If unclear:** Ask the user — "I couldn't find `pubspec.yaml` or the SDK version constraint is missing. Could you confirm the Flutter/Dart version and whether FVM or another version manager is used?"

---

## 3. Project Type Detection

### Dart Workspace Monorepo
- Check for `pubspec.yaml` with `workspace` field at root
- Check `packages/` and `apps/` directories
- Review dependency flow between packages
- Check for shared `pubspec.lock` at root

### Standalone App
- Single `pubspec.yaml` with no workspace
- `lib/` as main source directory

### Package Structure (Monorepo)
For each package found in `packages/` or similar directories, identify its role:

| Role | Description | Examples |
|---|---|---|
| **Core / Domain** | Pure Dart abstractions, interfaces, contracts | `core`, `domain`, `shared_kernel` |
| **Infrastructure** | Concrete implementations (HTTP, DI, logging, storage) | `infrastructure`, `data`, `network` |
| **UI / Design System** | Reusable Flutter widgets, theme, foundation | `ui`, `design_system`, `components` |
| **Utilities** | Shared extensions, helpers, base classes | `utils`, `common`, `shared` |
| **Localization** | i18n support, generated translations | `l10n`, `localization`, `intl` |
| **Domain Modules** | Feature-specific domain logic (pure Dart) | `modules`, `features`, `domains` |

- List each package, its role, and what it exports
- Map the dependency flow between packages (which depends on which)
- Note which packages are pure Dart vs Flutter-dependent

> **If unclear:** Ask the user — "I see multiple `pubspec.yaml` files but I'm not sure if this is a Dart workspace monorepo or uses Melos/other tooling. Could you clarify the project structure and how packages relate to each other?"

---

## 4. State Management Patterns

Identify which state management solution the project uses and how states are defined.

### Detect the Approach

| Approach | Key Indicators | What to Look For |
|---|---|---|
| **BLoC** | `flutter_bloc`, `Bloc<Event, State>` | Event classes, `on<Event>()` handlers, `emit()` |
| **Cubit** | `flutter_bloc`, `Cubit<State>` | Methods that call `emit()`, no event classes |
| **Riverpod** | `flutter_riverpod`, `hooks_riverpod` | `Provider`, `StateNotifier`, `ref.watch()` |
| **Provider** | `provider` package | `ChangeNotifier`, `Consumer`, `context.watch()` |
| **GetX** | `get` package | `GetxController`, `Obx()`, `.obs` |
| **Redux** | `flutter_redux` | `Store`, `Reducer`, `StoreProvider` |
| **Signals** | `signals` package | `signal()`, `computed()`, `effect()` |

### Determine State Definition Pattern

| Pattern | Key Indicators | Testing Implication |
|---|---|---|
| **Equatable + copyWith** | `extends Equatable`, manual `copyWith()` | Compare states with `==`, mock with constructors |
| **Freezed** | `@freezed`, `part '*.freezed.dart'` | Generated `copyWith()`, union types for states |
| **Sealed classes** | `sealed class State` (Dart 3+) | Pattern matching in tests with `switch` |
| **Plain classes** | No Equatable, no code gen | May need custom matchers for state comparison |

### What to Document
- State management library and version
- Base classes used (e.g., `BaseCubit`, `StateNotifier`, custom base classes)
- State definition pattern (Equatable, Freezed, sealed, plain)
- How use cases / services are accessed (DI, constructor injection, `ref`, `context.read()`)
- Event/action pattern (separate event classes, methods, actions)

> **If unclear:** Ask the user — "I found [library] in pubspec.yaml but couldn't determine the state pattern. Could you point me to an example feature module or provide reference docs?"

---

## 5. Architecture Layers

Identify the layers used in the project. Not all projects use the same layer names or structure — map what you find to these common patterns.

### Common Layer Patterns

| Layer | Purpose | Common Directory Names |
|---|---|---|
| **Domain** | Business entities, value objects, rules | `domain/`, `entities/`, `models/` |
| **Application** | Use cases, repository interfaces, orchestration | `application/`, `use_cases/`, `usecases/`, `interactors/` |
| **Infrastructure / Data** | API clients, DTOs, repository implementations, storage | `infrastructure/`, `data/`, `repository/`, `services/` |
| **Presentation / UI** | State management, screens, widgets | `presentation/`, `ui/`, `pages/`, `views/`, `screens/` |

### For Each Layer, Identify

**Domain Layer:**
- Entity definition pattern — `Equatable`, `Freezed`, `sealed class`, plain class
- Value objects — are they used? how are they validated?
- Domain enums — how are domain-specific types defined?
- Dependency rule — should have zero dependencies on other layers

**Application Layer:**
- Use case pattern — base class (`UseCase<TRequest, TResponse>`), naming convention, return type
- Repository interfaces — abstract classes or abstract interface classes?
- Result type — `Result<T>`, `Either<L, R>` (dartz/fpdart), `AsyncValue`, exceptions, or custom

**Infrastructure / Data Layer:**
- DTO / Model pattern — `json_serializable`, `Freezed`, `json_annotation`, manual parsing
- Data sources — remote (API), local (cache/DB), or both?
- Repository implementations — how DTOs map to entities
- DI registration — per-module file, centralized, or auto-generated (injectable)

**Presentation Layer:**
- State management location — co-located with screens or separate directory?
- Screen/page pattern — naming convention, base classes
- Widget organization — feature-specific vs shared widgets
- Navigation — how screens are wired together

### Architecture Variations

Projects may not follow a strict 4-layer pattern. Common variations:

- **3-layer** (data / domain / presentation) — no separate application layer, use cases live in domain
- **Feature-first** — each feature folder contains all layers internally
- **Layer-first** — top-level folders are layers, features are subdirectories
- **Hybrid** — shared layers at top level, feature-specific layers inside modules

> **If unclear:** Ask the user — "I can see [directories found] but I'm not sure how layers are organized. Could you point me to an example feature module or clarify the architecture?"

---

## 6. Dependency Injection

Identify the DI approach and how dependencies are wired throughout the project.

### Detect the DI Approach

| Approach | Key Indicators | What to Look For |
|---|---|---|
| **GetIt** | `get_it` package, `getIt<T>()` | Global instance, `registerLazySingleton`, `registerFactory` |
| **Injectable (GetIt + codegen)** | `injectable`, `@injectable`, `@module` | Generated `*.config.dart`, `@InjectableInit` |
| **Riverpod** | `flutter_riverpod`, `Provider` | `ref.watch()`, `ref.read()`, provider declarations |
| **Provider** | `provider` package | `Provider.of<T>()`, `context.read<T>()`, `MultiProvider` |
| **Manual / Constructor** | No DI package | Dependencies passed via constructors, no service locator |

### What to Document

- **DI library** and version
- **Registration pattern** — how are services registered?
  - Per-module files (e.g., `{feature}_di.dart`) or centralized?
  - Auto-generated (injectable) or manual?
  - Singleton vs factory — which types use which?
- **Resolution pattern** — how are dependencies accessed?
  - Service locator (`getIt<T>()`, `locator<T>()`)
  - Constructor injection (passed in via constructor)
  - Context-based (`context.read<T>()`, `ref.watch()`)
  - Mix of approaches?
- **Registration entry point** — where is DI initialized? (e.g., `main.dart`, `registrar.dart`, `injection.dart`)

### Testing Implication

| DI Approach | How to Mock in Tests |
|---|---|
| **GetIt** | `getIt.registerFactory<T>(() => mockT)` or reset + re-register |
| **Injectable** | Same as GetIt, override registrations |
| **Riverpod** | `ProviderScope(overrides: [provider.overrideWithValue(mock)])` |
| **Provider** | Wrap widget with `Provider<T>.value(value: mock)` |
| **Constructor injection** | Pass mocks directly via constructor |

> **If unclear:** Ask the user — "I found [package] but I'm not sure how DI is organized. Could you point me to where dependencies are registered?"

---

## 7. Testing Setup

Identify the testing stack, conventions, and existing patterns before writing any tests.

### Detect Testing Libraries

Check `dev_dependencies` in `pubspec.yaml` for the testing stack:

| Library | Purpose | Key Indicators |
|---|---|---|
| **flutter_test** | Widget & unit testing (always available) | `testWidgets`, `WidgetTester`, `expect` |
| **bloc_test** | BLoC/Cubit state testing | `blocTest<C, S>()`, `expect: [...]` |
| **mocktail** | Typed mocking (no codegen) | `class MockX extends Mock implements X {}`, `when(() =>)` |
| **mockito** | Mocking with codegen | `@GenerateMocks`, `when(mock.method).thenReturn()` |
| **golden_toolkit / alchemist** | Golden (snapshot) testing | `testGoldens`, `GoldenTestScenario` |
| **integration_test** | Integration / E2E testing | `IntegrationTestWidgetsFlutterBinding` |
| **patrol** | Native integration testing | `patrolTest`, `$.native` |

### Determine Test Directory Structure

Tests typically mirror the `lib/` structure inside `test/`. Check which pattern is used:

| Pattern | Description |
|---|---|
| **Mirror lib/** | `test/` mirrors `lib/` folder-by-folder (most common) |
| **Flat by type** | `test/unit/`, `test/widget/`, `test/integration/` |
| **Feature-grouped** | `test/{feature}/` with all test types inside |
| **Mixed** | Combination of the above |

Look for:
- Where do existing `*_test.dart` files live?
- Is there a `test/` directory at root, in app, or in packages?
- Are there shared test utilities (`test/helpers/`, `test/fixtures/`, `test/mocks/`)?

### What to Document from Existing Tests

- **Test pattern** — AAA (Arrange-Act-Assert), Given-When-Then, or other
- **Mock creation** — how are mocks defined? (inline in test file, shared mock file, generated)
- **Test data** — factories, fixtures, fake data builders, or inline construction
- **Setup/teardown** — `setUp()`, `tearDown()`, `setUpAll()`, shared helpers
- **State management testing** — `blocTest()`, `ProviderScope overrides`, `notifier.state`, etc.
- **Widget testing** — `pumpWidget` wrappers, common `MaterialApp`/`ProviderScope` setup
- **Naming convention** — `should [behavior] when [condition]`, `[method] returns [result]`, etc.
- **Coverage** — is there a minimum coverage requirement? (`--coverage` flag usage)

### Run Command Detection

Check how tests are executed in the project:
- `flutter test` (standard)
- `flutter test --coverage` (with coverage)
- `very_good test` (Very Good CLI)
- `melos test` or `melos run test` (Melos monorepo)
- Custom scripts in `Makefile`, `justfile`, or `scripts/`

> **If unclear:** Ask the user — "I found [libraries] in dev_dependencies but couldn't find existing test files to reference. Could you point me to an example test or describe the testing conventions?"

---

## 8. Error Handling

Identify how the project models, propagates, and handles errors across layers.

### Detect the Error Handling Strategy

| Strategy | Key Indicators | How It Works |
|---|---|---|
| **Result type (custom)** | `Result<T>`, `Result.success()`, `Result.failure()` | Wraps success/failure in a single return type |
| **Either (dartz)** | `dartz` package, `Either<Failure, T>`, `Left`, `Right` | Functional error handling with fold |
| **Either (fpdart)** | `fpdart` package, `Either<L, R>`, `TaskEither` | Functional programming with chaining |
| **Exceptions only** | `try/catch`, custom exception classes | Thrown and caught across layers |
| **Sealed classes** | `sealed class Result`, pattern matching (Dart 3+) | Exhaustive handling via `switch` |
| **AsyncValue (Riverpod)** | `AsyncValue<T>`, `AsyncLoading`, `AsyncError` | Built-in loading/error/data states |
| **Freezed unions** | `@freezed`, `.when()`, `.map()` | Generated union types for success/error |

### What to Document

- **Error type** — what class/type represents errors? (`Failure`, `AppException`, `NetworkException`, custom)
- **Propagation pattern** — how errors flow between layers:
  - Data source → Repository → Use case → BLoC/Cubit → UI
  - Are errors caught and re-wrapped at each layer, or passed through?
- **Error categorization** — are there distinct error types? (network, validation, server, auth, timeout)
- **UI error handling** — how are errors displayed? (snackbar, dialog, inline, error widget)

### Testing Implication

| Strategy | How to Test |
|---|---|
| **Result type** | Assert `result.success`, `result.failure`, check `result.value` |
| **Either** | Assert `result.isRight()`, `result.isLeft()`, use `fold()` |
| **Exceptions** | Use `throwsA(isA<SpecificException>())` |
| **Sealed classes** | Pattern match in assertions |
| **AsyncValue** | Assert `AsyncData`, `AsyncError`, `AsyncLoading` |

> **If unclear:** Ask the user — "I found [error pattern] but I'm not sure how errors propagate across layers. Could you point me to an example use case or repository that handles errors?"

---

## 9. UI Framework

Identify the UI toolkit, design system, and styling conventions used in the project.

### Detect the UI Approach

| Approach | Key Indicators |
|---|---|
| **Material Design** | `MaterialApp`, `ThemeData`, Material widgets (`Scaffold`, `AppBar`, etc.) |
| **Cupertino** | `CupertinoApp`, `CupertinoTheme`, Cupertino widgets |
| **Custom design system** | Shared UI package (e.g., `ui/`, `design_system/`), custom widget library |
| **Component library** | Third-party UI kit (`fluent_ui`, `macos_ui`, `shadcn_flutter`, etc.) |
| **Adaptive / Platform-aware** | Mix of Material + Cupertino, platform checks |

### What to Document

- **Base framework** — Material, Cupertino, or custom
- **Design system package** — is there a shared UI package? What does it export?
- **Theme configuration** — where is the theme defined? Custom `ThemeData`, theme extensions?
- **Reusable components** — shared widgets, buttons, cards, form fields, etc.
- **Styling approach** — theme tokens, design tokens, inline styles, or style constants
- **Responsive strategy** — `LayoutBuilder`, `MediaQuery`, breakpoints, adaptive widgets

### Testing Implication

- Widget tests need the correct app wrapper (`MaterialApp`, `CupertinoApp`, or custom)
- Custom design system widgets may need their theme provider in test setup
- Golden tests need consistent theme configuration

> **If unclear:** Ask the user — "I found [UI setup] but I'm not sure about the design system conventions. Is there a shared UI package or style guide I should reference?"

---

## 10. Output Template

Fill this in after exploration:

```
# Project Exploration Summary

## References
Reference Docs: [list docs found — CLAUDE.md, .cursorrules, README.md, etc.]

## Environment
Flutter Version: ___
FVM: [yes (version) / no — direct SDK]
Dart Version: ___
Analysis Options: [strict mode? line length? custom rules?]
Code Generation: [json_serializable / freezed / build_runner / none]

## Project Structure
Project Type: [workspace monorepo / standalone app / Melos monorepo]
Architecture: [Clean Architecture / Hexagonal / Onion / feature-based / hybrid]
Layer Organization: [layer-first / feature-first / hybrid]
Packages: [list packages and their roles, if monorepo]

## State Management
Library: [flutter_bloc / riverpod / provider / getx / redux / signals]
Pattern: [BLoC / Cubit / StateNotifier / ChangeNotifier / other]
Base Classes: [list base classes used, if any]
State Definition: [Equatable + copyWith / Freezed / sealed classes / plain]

## Dependency Injection
Library: [GetIt / injectable / riverpod / provider / manual]
Registration: [per-module files / centralized / auto-generated]
Resolution: [service locator / constructor injection / context-based]
Entry Point: [file where DI is initialized]

## Error Handling
Strategy: [Result<T> / Either / exceptions / sealed classes / AsyncValue]
Error Types: [list error/failure classes found]
Propagation: [how errors flow across layers]

## Testing
Testing Stack: [flutter_test + bloc_test + mocktail / mockito / other]
Test Structure: [mirrors lib / flat by type / feature-grouped]
Test Runners: [flutter test / melos / very_good / custom scripts]
Mocking Approach: [mocktail / mockito / manual / generated]
Existing Helpers: [list shared test utilities, fixtures, factories]

## UI Framework
Base: [Material / Cupertino / custom / adaptive]
Design System: [shared package name, or none]
Theme: [where theme is defined]
Styling: [theme tokens / inline / constants]

## Key Conventions
- [list notable patterns discovered from reference docs and codebase]
- [naming conventions, file organization, barrel exports, etc.]
- [anything that affects how tests should be written]
```
