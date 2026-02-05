# KAT Code Review Common Checklist

Apply relevant sections based on the changes being reviewed.

## Functionality

- Code accomplishes intended purpose
- Edge cases handled (null, empty, boundary values)
- Error handling is comprehensive and user-friendly
- No regressions to existing functionality
- Business logic matches requirements
- Offline/poor network conditions handled gracefully

## Code Quality

- Readable and self-documenting
- Functions have single responsibility (less than 20 instructions)
- No code duplication (DRY)
- Appropriate abstraction level
- Clear, consistent naming (no abbreviations except standard ones)
- No magic numbers/strings - use constants
- Complete words with correct spelling
- Functions start with verbs
- Boolean variables use verbs (isLoading, hasError, canDelete)

## Architecture

- Follows clean architecture (presentation, domain, data, core layers)
- Feature-based organization when appropriate
- Repository pattern used for data persistence
- Controller pattern with Cubit/Bloc for business logic
- Use cases separate business logic from controllers
- Dependencies injected via GetIt (singleton for services/repositories, lazy singleton for controllers)
- No circular dependencies
- SOLID principles followed
- Composition over inheritance

## Performance

- No N+1 queries
- No unnecessary loops or iterations
- Resources properly released/cleaned up
- Caching used appropriately (repository pattern)
- Database queries optimized
- Async operations where beneficial
- Heavy computations use isolates/compute
- Avoid blocking main/UI thread

## Security

- Input validation present
- No hardcoded secrets/credentials (use UPPERCASE for environment variables)
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- Authentication/authorization checks in place
- Sensitive data properly handled (logging, storage)
- Analytics/logging do not leak PII
- Platform permissions respected

## Testing

- Unit tests for each public function
- Edge cases tested
- Tests follow Arrange-Act-Assert convention
- Test variables clearly named (inputX, mockX, actualX, expectedX)
- Integration tests for each module
- Tests don't depend on external state
- Test doubles used for dependencies (except inexpensive third-party deps)
- Acceptance tests follow Given-When-Then convention

## Documentation

- Public APIs documented with dartdoc comments
- Complex logic has comments explaining "why" (not "what")
- README updated if needed
- Breaking changes documented
- Comments explain context, not obvious code

## State Management

- Uses Cubit/Bloc for state management
- State defined with freezed for immutability
- Controllers take methods as input and update UI state
- State kept alive when needed (keepAlive)
- Subscriptions and controllers properly disposed
- `setState` guarded by `mounted` check

## Dependency Management

- GetIt used for dependency injection
- Singleton pattern for services and repositories
- Factory pattern for use cases
- Lazy singleton for controllers
- Dependencies properly registered

## Routing

- Navigator used for navigation
- Routes properly defined
- Extras used for passing data between pages
- Deep linking configured when needed

## Naming Conventions

- PascalCase for classes
- camelCase for variables, functions, methods
- underscores_case for file and directory names
- UPPERCASE for environment variables
- Clear type declarations (avoid `any`/`dynamic` unless necessary)

## Widget Structure

- Avoid deeply nested widgets (extract to smaller widgets)
- Use `const` constructors wherever possible
- Break down large widgets into smaller, reusable components
- Prefer small, private Widget classes over helper methods
- Keep widget tree flat for better performance and readability
