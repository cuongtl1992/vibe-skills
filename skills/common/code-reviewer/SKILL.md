# Code Reviewer

Systematic approach to reviewing code changes for quality, correctness, and maintainability.

## Review Checklist

### Functionality
- [ ] Code accomplishes the intended purpose
- [ ] Edge cases are handled appropriately
- [ ] Error handling is comprehensive and user-friendly
- [ ] No regressions to existing functionality

### Code Quality
- [ ] Code is readable and self-documenting
- [ ] Functions/methods have single responsibility
- [ ] No code duplication (DRY principle)
- [ ] Appropriate abstraction level
- [ ] Naming is clear and consistent

### Architecture
- [ ] Follows established project patterns
- [ ] Dependencies are appropriate and minimal
- [ ] No circular dependencies
- [ ] Changes are in the right location/layer

### Performance
- [ ] No obvious performance issues (N+1 queries, unnecessary loops)
- [ ] Resources are properly released/cleaned up
- [ ] Caching is used appropriately
- [ ] Database queries are optimized

### Security
- [ ] Input validation is present
- [ ] No hardcoded secrets or credentials
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Authentication/authorization checks in place

### Testing
- [ ] Unit tests cover new/changed code
- [ ] Edge cases are tested
- [ ] Tests are readable and maintainable
- [ ] Integration tests if needed

### Documentation
- [ ] Public APIs are documented
- [ ] Complex logic has comments explaining "why"
- [ ] README updated if needed
- [ ] Breaking changes documented

## Review Comments

When leaving feedback:

1. **Be specific**: Point to exact lines and suggest alternatives
2. **Be constructive**: Explain why something is an issue
3. **Be respectful**: Focus on the code, not the person
4. **Prioritize**: Mark blocking issues vs. suggestions
5. **Praise good work**: Acknowledge well-written code

### Comment Prefixes

- `[BLOCKING]`: Must be fixed before merge
- `[SUGGESTION]`: Consider this improvement
- `[QUESTION]`: Need clarification
- `[NIT]`: Minor style issue, optional to fix
