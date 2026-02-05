# Android Code Review Checklists

Apply relevant sections based on the changes being reviewed (UI, ViewModel, repository, platform, etc.).

## Functionality

- [ ] Code accomplishes intended purpose; behavior matches requirements
- [ ] Edge cases handled (null, empty, boundary values; configuration changes)
- [ ] Error handling is comprehensive and user-friendly (no silent failures; messages shown when appropriate)
- [ ] No regressions to existing functionality
- [ ] Business logic matches product/feature requirements

## Code Quality

- [ ] Readable and self-documenting; Kotlin idioms used where appropriate
- [ ] Functions/classes have single responsibility
- [ ] No code duplication (DRY); shared logic in extensions or utils
- [ ] Appropriate abstraction level; no over- or under-engineering
- [ ] Clear, consistent naming (project conventions)
- [ ] No magic numbers/strings; use constants or resources (dimens, strings)

## Lifecycle and Context

- [ ] No work or callbacks run after Activity/Fragment is destroyed (no leaks from listeners, coroutines, handlers)
- [ ] Context/Activity/View references not held longer than needed; application context where appropriate
- [ ] Lifecycle-aware components used correctly (ViewModel, LiveData/StateFlow, lifecycleScope)
- [ ] No manual lifecycle handling where the framework can do it (e.g. lifecycleScope vs manual Job)

## Threading and Coroutines

- [ ] UI updates only on main thread; background work off main thread
- [ ] Dispatchers chosen correctly (Main for UI, IO for I/O, Default for CPU)
- [ ] No blocking calls on main thread; suspend/async used appropriately
- [ ] Cancellation and cleanup on scope cancel; no ignored Job or orphaned coroutines

## Memory and Resources

- [ ] Listeners, callbacks, and subscriptions removed in onDestroy/onCleared or equivalent
- [ ] No strong references to Activity/Fragment from static or long-lived objects
- [ ] Bitmaps/large objects disposed or recycled where applicable
- [ ] Cursor/stream/connection-style resources used in try-with-resources or use/close pattern
- [ ] No unnecessary object allocations in hot paths (e.g. list bind, scroll)

## UI and Views

- [ ] View access only after view is attached; no access in init or before onViewCreated
- [ ] RecyclerView/ListView: ViewHolder pattern, no heavy work in bind; DiffUtil for list updates where applicable
- [ ] Adapters follow project rules (e.g. extend BindingRecyclerAdapter where applicable)

## Architecture and Layers

- [ ] Clear separation: UI (Activity/Fragment/Compose) → ViewModel → use case, repository; no direct DB/API in UI layer
- [ ] No business logic in Activity/Fragment; no direct DB/API in UI layer
- [ ] Dependencies appropriate and minimal; no circular dependencies
- [ ] Changes in correct layer; project patterns followed
- [ ] Dependency injection or factory used for testability where applicable

## Performance

- [ ] No blocking or heavy work on main thread
- [ ] List scrolling smooth; no heavy work in adapter bind
- [ ] Resources released/cleaned up; no leaks
- [ ] Caching used appropriately (in-memory, disk) without unbounded growth
- [ ] Database/Realm queries optimized (indexes, projections); follow project migration rules if schema changes

## Documentation

- [ ] Complex logic has comments explaining "why"
- [ ] README or docs updated if behavior or setup changes
- [ ] Breaking changes or migration steps documented when applicable

## Local Data and Persistence

- [ ] Migrations reversible or documented; follow project rules (e.g. Realm migration)
- [ ] No breaking schema changes without migration plan
- [ ] Data integrity and constraints in place where applicable

## Navigation and Intents

- [ ] Back stack and up/back behavior correct; no duplicate entries or wrong launchMode without reason
- [ ] Intent extras parcelable/serializable; size and sensitivity considered
- [ ] Deep links handled safely; validated before use
- [ ] Navigation arguments typed and documented where shared
