# Code Review Checklists

Apply relevant sections based on the changes being reviewed.

## Functionality

- Code accomplishes intended purpose
- Edge cases handled (null, empty, boundary values)
- Error handling is comprehensive and user-friendly
- No regressions to existing functionality
- Business logic matches requirements

## Code Quality

- Readable and self-documenting
- Functions have single responsibility
- No code duplication (DRY)
- Appropriate abstraction level
- Clear, consistent naming
- No magic numbers/strings

## Architecture

- Follows established project patterns
- Dependencies are appropriate and minimal
- No circular dependencies
- Changes in correct location/layer
- SOLID principles followed

## Performance

- No N+1 queries
- No unnecessary loops or iterations
- Resources properly released/cleaned up
- Caching used appropriately
- Database queries optimized (indexes, projections)
- Async operations where beneficial

## Security

- Input validation present
- No hardcoded secrets/credentials
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- Authentication/authorization checks in place
- Sensitive data properly handled (logging, storage)
- CSRF protection where needed

## Testing

- Unit tests cover new/changed code
- Edge cases tested
- Tests are readable and maintainable
- Integration tests if needed
- Tests don't depend on external state
- Mocks/stubs used appropriately

## Documentation

- Public APIs documented
- Complex logic has comments explaining "why"
- README updated if needed
- Breaking changes documented
- API versioning considered

## Database Changes

- Migrations are reversible
- No breaking schema changes without migration plan
- Indexes added for query patterns
- Data integrity constraints in place
- Consider data volume impact

## API Changes

- Backward compatible or versioned
- Request/response validation
- Error responses follow conventions
- Rate limiting considered
- Documentation updated