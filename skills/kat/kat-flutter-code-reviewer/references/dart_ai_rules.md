# KAT Dart AI Rules

AI rules for reviewing Dart code following KAT team standards.

## General Principles

- Use English for all code and documentation
- Always declare the type of each variable and function (parameters and return value)
- Avoid using `any` or `dynamic` unless absolutely necessary
- Create necessary types rather than using primitives everywhere
- Don't leave blank lines within a function
- One export per file

## Nomenclature

- **PascalCase** for classes
- **camelCase** for variables, functions, and methods
- **underscores_case** for file and directory names
- **UPPERCASE** for environment variables
- Avoid magic numbers and define constants
- Start each function with a verb
- Use verbs for boolean variables (isLoading, hasError, canDelete, etc.)
- Use complete words instead of abbreviations with correct spelling
  - Exception: Standard abbreviations (API, URL, etc.)
  - Exception: Well-known abbreviations (i/j for loops, err for errors, ctx for contexts, req/res/next for middleware)

## Functions

- Write short functions with a single purpose (less than 20 instructions)
- Name functions with a verb and something else
  - Boolean returns: use `isX`, `hasX`, `canX`
  - No return: use `executeX`, `saveX`, etc.
- Avoid nesting blocks by:
  - Early checks and returns
  - Extraction to utility functions
- Use higher-order functions (map, filter, reduce, etc.) to avoid nesting
- Use arrow functions for simple functions (less than 3 instructions)
- Use named functions for non-simple functions
- Use default parameter values instead of checking for null/undefined
- Use single level of abstraction

### Function Parameters

- Reduce function parameters using RO-RO pattern:
  - Use an object to pass multiple parameters
  - Use an object to return results
- Declare necessary types for input arguments and output

## Data Handling

- Don't abuse primitive types; encapsulate data in composite types
- Avoid data validations in functions; use classes with internal validation
- Prefer immutability for data
- Use `readonly` for data that doesn't change
- Use `as const` for literals that don't change

## Classes

- Follow SOLID principles
- Prefer composition over inheritance
- Declare interfaces to define contracts
- Write small classes with a single purpose:
  - Less than 200 instructions
  - Less than 10 public methods
  - Less than 10 properties

## Null Safety

- Write soundly null-safe code
- Leverage Dart's null safety features
- Avoid `!` (null assertion) unless value is guaranteed to be non-null
- Use null-aware operators (`?.`, `??`, `??=`) appropriately

## Async Programming

- Use `Future`, `async`, and `await` for asynchronous operations
- Use `Stream`s for sequences of asynchronous events
- Ensure proper error handling with `try-catch` blocks
- Use appropriate exceptions for error types
- Create custom exceptions for app-specific scenarios

## Pattern Matching & Modern Dart

- Use pattern matching features where they simplify code
- Use records to return multiple types when defining a class is cumbersome
- Prefer exhaustive `switch` statements/expressions (no `break` needed)
- Use arrow syntax for simple one-line functions

## Exceptions

- Use exceptions to handle errors you don't expect
- Catch exceptions only to:
  - Fix an expected problem
  - Add context
- Otherwise, use a global handler

## Best Practices

- Follow the official Effective Dart guidelines
- Define related classes within the same library file
- Group related libraries in the same folder
- Add documentation comments (`///`) to all public APIs
- Write clear comments for complex or non-obvious code
- Avoid over-commenting or trailing comments
- Comments should explain "why", not "what" (code should be self-explanatory)

## Testing

- Follow Arrange-Act-Assert convention
- Name test variables clearly:
  - `inputX` for inputs
  - `mockX` for mocks
  - `actualX` for actual results
  - `expectedX` for expected results
- Write unit tests for each public function
- Use test doubles to simulate dependencies
  - Exception: Third-party dependencies that are not expensive
- Write acceptance tests for each module following Given-When-Then

## Code Organization

- Use clean architecture principles
- Organize code into logical layers:
  - Presentation (widgets, screens)
  - Domain (business logic, use cases, entities)
  - Data (repositories, models, API clients)
  - Core (shared utilities, extensions, constants)
- For larger projects, use feature-based organization

## Logging

- Use `logging` package or `dart:developer` log instead of `print`
- Never use `print` in production code
- Log meaningful information with appropriate levels
- Don't log sensitive information (PII, credentials, etc.)

## Documentation

- Use `dartdoc`-style comments (`///`) for public APIs
- Start with a single-sentence summary ending with a period
- Add a blank line after the first sentence
- Avoid redundancy and obvious information
- Don't document both getter and setter
- Be brief and avoid jargon
- Use backticks for code references
- Include code samples where appropriate
- Explain parameters, return values, and exceptions
- Place doc comments before annotations
