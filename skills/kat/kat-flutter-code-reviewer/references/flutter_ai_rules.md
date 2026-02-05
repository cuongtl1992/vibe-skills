# KAT Flutter AI Rules

AI rules for reviewing Flutter code following KAT team standards.

## Architecture Principles

### Clean Architecture

- Use clean architecture with clear layer separation:
  - **Presentation**: Widgets, screens, controllers (Cubit/Bloc)
  - **Domain**: Business logic, use cases, entities
  - **Data**: Repositories, models, API clients, data sources
  - **Core**: Shared utilities, extensions, constants

### State Management

- **Use Cubit/Bloc** for state management (not Riverpod, GetX, or Provider unless explicitly requested)
- **Use freezed** to manage UI states for immutability
- Controllers always take methods as input and update UI state
- Controllers should only contain presentation logic
- Business logic belongs in use cases, not controllers

### Dependency Injection

- **Use GetIt** for dependency injection
- **Singleton** for services and repositories
- **Factory** for use cases
- **Lazy singleton** for controllers
- Dependencies should be injected, not created within classes

### Repository Pattern

- Use repository pattern for all data persistence
- Repositories abstract data sources (API, local storage, cache)
- Implement caching strategy within repositories when needed

### Routing

- **Use AutoRoute** for navigation management
- Use `extras` to pass data between pages
- Configure deep linking when needed
- Define routes in a centralized location

## Widget Best Practices

### Widget Structure

- **Avoid deeply nested widgets** - extract to smaller components
- Break down large widgets into smaller, focused widgets
- Use small, private Widget classes instead of helper methods that return widgets
- Break down large `build()` methods into smaller, reusable private Widget classes
- A flatter structure improves performance, readability, and maintainability

### Performance Optimization

- Use `const` constructors wherever possible to reduce rebuilds
- Use `ListView.builder` or `SliverList` for long lists (lazy loading)
- Avoid expensive operations in `build()` methods (network calls, heavy computations)
- Use `compute()` for expensive calculations to avoid blocking UI thread
- Use isolates for heavy background work
- Minimize widget rebuilds by proper use of keys and const

### Widget Lifecycle

- Handle app lifecycle events (background/foreground, termination)
- Properly dispose of resources:
  - `TextEditingController`
  - `FocusNode`
  - `AnimationController`
  - `Stream` subscriptions
  - `Future` subscriptions
- Guard `setState` with `mounted` check
- Use `keepAlive` when state needs to persist

### BuildContext Safety

- Safe `BuildContext` usage (no async gaps after dispose)
- Don't use `BuildContext` after async operations without checking `mounted`

## UI & Theming

### Theming

- Use `ThemeData` for centralized theme management
- Define both light and dark themes
- Use `ColorScheme.fromSeed()` for harmonious color palettes
- Use theme extensions (`ThemeExtension`) for custom design tokens
- Use `Theme.of(context).textTheme` for consistent text styles
- Configure `textCapitalization` and `keyboardType` appropriately

### Responsive Design

- Use `LayoutBuilder` or `MediaQuery` for responsive UIs
- Support multiple screen sizes (mobile, tablet, web, desktop)
- Test with different font sizes (dynamic text scaling)
- Ensure UI remains usable at various sizes

### Layout

- Use `Expanded`, `Flexible`, and `Wrap` to prevent overflow
- Use `SingleChildScrollView` for scrollable content
- Use `ListView.builder`/`GridView.builder` for long lists
- Use `FittedBox` for scaling widgets
- Use `SizedBox` for spacing instead of `Container`
- Use `Stack` with `Positioned` or `Align` for layering

### Material Design

- Follow Material 3 design guidelines
- Use `WidgetStateProperty` for interactive widget states
- Implement proper elevation and shadows
- Use semantic colors from theme

### Visual Design

- Ensure proper color contrast (WCAG 4.5:1 for text, 3:1 for large text)
- Use consistent typography hierarchy
- Line height should be 1.4x-1.6x the font size
- Limit to 1-2 font families
- Use icons to enhance understanding
- Implement beautiful, intuitive interfaces

### Assets & Images

- Declare all assets in `pubspec.yaml`
- Use `Image.asset` for local images
- Use `Image.network` with `loadingBuilder` and `errorBuilder`
- Consider `cached_network_image` for network images
- Use `ImageIcon` for custom icons
- Optimize image loading and caching

## Code Quality

### Dart Specifics

- Follow Effective Dart guidelines
- Prefer concise, declarative code
- Favor immutability (especially for widgets)
- Use null safety properly (avoid `!` unless guaranteed non-null)
- Use `Future`/`async`/`await` for async operations
- Use `Stream`s for event sequences
- Use pattern matching and records where appropriate

### Widget Immutability

- Widgets (especially `StatelessWidget`) should be immutable
- When UI needs to change, Flutter rebuilds the widget tree
- Use `const` for immutable widgets

### Composition Over Inheritance

- Prefer composition for building complex widgets and logic
- Create reusable widget components
- Avoid deep inheritance hierarchies

### Separation of Concerns

- UI logic separate from business logic
- Business logic in use cases, not in widgets or controllers
- Data access through repositories only
- Controllers coordinate between UI and domain layer

## Testing

### Test Strategy

- Write unit tests for domain logic, data layer, and state management
- Write widget tests for UI components
- Write integration tests for end-to-end user flows
- Use `integration_test` package for integration tests

### Test Quality

- Follow Arrange-Act-Assert convention
- Use clear test variable names (inputX, mockX, actualX, expectedX)
- Use fakes/stubs over mocks when possible
- Use `mockito` or `mocktail` only when necessary
- Aim for high test coverage
- Tests should be independent and not rely on external state

## Performance

### Optimization

- No N+1 queries
- Avoid unnecessary loops or iterations
- Resources properly cleaned up
- Use appropriate caching strategies
- Optimize database queries
- Use async operations appropriately
- Battery and network usage are reasonable

### Threading

- Avoid blocking main/UI thread for I/O or heavy work
- Use background work APIs appropriately
- Use `compute()` or isolates for heavy computations
- Handle platform channels correctly (threading and errors)

## Security & Privacy

- Input validation present
- No hardcoded secrets (use environment variables)
- Proper authentication/authorization checks
- Sensitive data handled securely
- Analytics/logging don't leak PII
- Respect platform permissions and privacy prompts

## Mobile Best Practices

- Handle offline/poor network conditions gracefully
- Optimize image/video loading and caching
- Avoid excessive memory usage
- Handle app lifecycle events properly
- Respect platform conventions (iOS/Android)
- Test on multiple devices and screen sizes

## Logging & Debugging

- Use `dart:developer` log or `debugPrint` instead of `print`
- Never use `print` in production code
- Use structured logging with appropriate levels
- Don't log sensitive information

## Package Management

- Use `pub` tool or `flutter pub` for dependencies
- Keep dependencies up to date
- Prefer stable, well-maintained packages
- Document why specific packages are chosen
- Use `dev_dependencies` for development-only packages

## Linting

- Enforce `flutter_lints` package
- Use `dart format` for consistent formatting
- Configure `analysis_options.yaml` appropriately
- Fix linter warnings before merge

## Documentation

- Use `dartdoc` comments (`///`) for public APIs
- Document complex logic explaining "why"
- Update README for significant changes
- Document breaking changes
- Include code samples where helpful
- Keep documentation concise and relevant

## Accessibility (A11Y)

- Ensure color contrast meets WCAG standards
- Support dynamic text scaling
- Use `Semantics` widget for screen reader support
- Test with TalkBack (Android) and VoiceOver (iOS)
- Make interactive elements accessible

## Code Generation

- Use `build_runner` for code generation tasks
- Run `dart run build_runner build --delete-conflicting-outputs` after changes
- Use `json_serializable` for JSON parsing
- Use `freezed` for immutable state classes
- Use `auto_route_generator` for routing code generation

## Extensions

- Use extensions to manage reusable code
- Create extension methods for common operations
- Keep extensions focused and well-named
- Document extension methods

## Constants & Configuration

- Use `ThemeData` for theme constants
- Use `AppLocalizations` for translations
- Use constant values instead of magic numbers/strings
- Organize constants in dedicated files/classes

## Best Practices Summary

1. **SOLID principles** throughout the codebase
2. **Clean architecture** with clear layer separation
3. **Cubit/Bloc** for state management with **freezed** for immutability
4. **GetIt** for dependency injection
5. **Repository pattern** for data access
6. **Use cases** for business logic
7. **AutoRoute** for navigation
8. **Composition over inheritance**
9. **Immutable widgets** with **const** constructors
10. **Avoid deep nesting** - extract to smaller widgets
11. **Performance-conscious** - lazy loading, const, compute
12. **Proper disposal** of resources
13. **Comprehensive testing** - unit, widget, integration
14. **Clear documentation** explaining "why"
15. **Accessibility** for all users
