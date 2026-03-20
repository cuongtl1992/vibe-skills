# Figma Design Workflow for Flutter

How to analyze Figma designs and translate them into Flutter widgets.

---

## 1. Requesting the Design

### Prompt Template

When the task involves UI work, ask:

> "Does this task have a Figma design? If yes, please share the Figma link or screenshot so I can review the design specifications (layout, spacing, colors, typography, responsive breakpoints)."

### Figma MCP Server Check

Before or after the user shares a Figma link, **check if a Figma MCP server is available** in the current environment (e.g., `figma` or `@anthropic-ai/figma-mcp` in MCP server configuration).

- **If available:** Use the Figma MCP tools to fetch design data directly from the Figma link (nodes, styles, layout properties, design tokens). This provides more accurate and complete design specs than screenshots alone.
- **If not available:** Fall back to the user providing screenshots, exported assets, or manual design specs.

When a Figma link is shared and MCP is available:

1. Use MCP tools to fetch the relevant frames/components from the link
2. Extract layout structure, spacing, colors, typography, and component hierarchy
3. Cross-reference with the project's existing design system/theme
4. Document findings in the Design Analysis Checklist (§ 2)

### No Figma Available — Fallback

If no Figma design exists, ask the user for:

1. **Wireframe description** — rough layout description in text
2. **Screenshot or mockup** — any visual reference (even hand-drawn)
3. **Acceptance criteria** — behavioral requirements for the UI
4. **Reference screen** — an existing screen in the app to mimic

Document whatever is provided and proceed with best judgment. Flag any design assumptions in the REVIEW phase.

---

## 2. Design Analysis Checklist

When reviewing a Figma design, extract the following:

### Layout Structure

- [ ] Overall layout pattern (Column, Row, Stack, ListView, GridView)
- [ ] Container widths and constraints (maxWidth, expanded, flexible)
- [ ] Spacing between sections
- [ ] Alignment rules (center, start, spaceBetween)
- [ ] Overflow behavior (scroll, clip, wrap)
- [ ] SafeArea requirements

### Typography

- [ ] Font family (match to project's theme or closest available)
- [ ] Font sizes for each text level (headline, body, caption, label)
- [ ] Font weights (w400, w500, w600, w700)
- [ ] Line heights
- [ ] Letter spacing (if non-default)
- [ ] Text color variations (primary, secondary, hint, error)
- [ ] Map to existing TextTheme styles from the project's design system (if any)

### Colors

- [ ] Primary, secondary, accent colors
- [ ] Background colors (scaffold, card, surface)
- [ ] Border colors
- [ ] Text colors per context
- [ ] Status colors (success, warning, error, info)
- [ ] Map to existing theme colors or project design tokens

### Spacing System

- [ ] Consistent spacing scale used (4, 8, 12, 16, 24, 32, etc.)
- [ ] Padding inside widgets
- [ ] Margin between widgets
- [ ] Gap in Row/Column (using SizedBox or gap parameter)

### Responsive Behavior

- [ ] Mobile portrait layout (primary)
- [ ] Mobile landscape layout (if different)
- [ ] Tablet layout (if supported)
- [ ] What changes between screen sizes (stacking, hidden elements, font sizes)
- [ ] Use of LayoutBuilder or MediaQuery for responsive design or other 3rd libraries

### Interactive States

- [ ] Default state
- [ ] Pressed/highlight state
- [ ] Focus state (for accessibility)
- [ ] Disabled state
- [ ] Loading state (shimmer, skeleton, spinner)
- [ ] Error state
- [ ] Empty state
- [ ] Selected state (for selection mode)

### Animations / Transitions

- [ ] Entry/exit animations (page transitions, modal slides)
- [ ] Tap feedback (InkWell ripple, scale animation)
- [ ] Loading animations (shimmer, circular progress)
- [ ] List animations (item insertion/removal)

---

## 3. Widget Decomposition

Break the design into Flutter widgets following a hierarchical approach:

### Step 1: Identify Atomic Widgets

- Buttons, TextFields, Text labels, Icons, Avatars, Badges, Chips
- Check if these already exist in the project's design system package or Flutter's built-in widgets
- Do NOT recreate existing widgets

### Step 2: Identify Compound Widgets

- Form fields (label + input + error), cards, list tiles, search bars
- Check the design system package and `shared/widgets/` (or equivalent) for existing components

### Step 3: Identify Section Widgets

- Form sections, data lists, headers, tab bars, filter bars
- These are typically feature-specific widgets in the presentation layer's widgets directory

### Step 4: Identify Screen Widgets

- Full screen layouts combining section widgets
- Smart widgets that connect to state management (BLoC/Cubit, Riverpod, Provider, etc.)
- These live in the presentation layer's screens/pages directory

### Decomposition Template

```
Screen: [ScreenName]Screen
├── [SectionWidget] — [responsibility]
│   ├── [CompoundWidget] — [responsibility]
│   │   ├── [AtomWidget] — existing (design system) / new
│   │   └── [AtomWidget] — existing (Flutter built-in) / new
│   └── [CompoundWidget] — [responsibility]
└── [SectionWidget] — [responsibility]
    └── [CompoundWidget] — [responsibility]
```

---

## 4. Design-to-Flutter Mapping

### Spacing -> SizedBox / EdgeInsets

```dart
// Check if the project defines spacing constants in its design system
// Common patterns:
const double kSpacingXs = 4;
const double kSpacingSm = 8;
const double kSpacingMd = 16;
const double kSpacingLg = 24;
const double kSpacingXl = 32;

// Usage
SizedBox(height: kSpacingMd),
Padding(padding: const EdgeInsets.all(kSpacingMd)),
```

### Colors -> Theme

```dart
// Map Figma colors to Flutter's ColorScheme (Material 3)
Theme.of(context).colorScheme.primary     // Figma: "Primary"
Theme.of(context).colorScheme.surface     // Figma: "Surface"
Theme.of(context).colorScheme.error       // Figma: "Error"

// Or project-specific design tokens if the design system defines custom colors
// e.g., AppColors.primary, DesignTokens.surfaceBackground
// Check the design system package discovered in EXPLORE phase
```

### Typography -> TextTheme

```dart
// Map Figma text styles to Flutter TextTheme
Theme.of(context).textTheme.headlineMedium  // Figma: "Heading"
Theme.of(context).textTheme.bodyLarge       // Figma: "Body"
Theme.of(context).textTheme.labelSmall      // Figma: "Caption"
```

### Breakpoints -> LayoutBuilder / MediaQuery

```dart
// Responsive layout
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < 600) {
      return MobileLayout();  // Figma "Mobile" frame
    } else {
      return TabletLayout();  // Figma "Tablet" frame
    }
  },
)
```

### Icons -> Icon System

- Identify icons used in design
- Check if available in Flutter's built-in icons (`Icons.xxx` for Material, `CupertinoIcons.xxx` for Cupertino)
- Check the project's design system for custom icon sets
- Use SVG via `flutter_svg` or custom icon font if project-specific icons are needed

---

## 5. Post-Implementation Design Review

After implementing the UI, verify against the design:

### Visual Comparison

- [ ] Layout matches design structure
- [ ] Spacing is consistent with design
- [ ] Typography (size, weight, color) matches
- [ ] Colors match design tokens
- [ ] Border radius, shadows, elevation match
- [ ] Icons are correct

### Responsive Behavior

- [ ] Portrait layout matches design
- [ ] Landscape layout works (if applicable)
- [ ] Tablet layout matches (if applicable)
- [ ] Widgets don't overflow on small screens

### Interactive States

- [ ] Tap/press effects match design
- [ ] Disabled states match design
- [ ] Loading states match design (shimmer, spinner)
- [ ] Error states display correctly
- [ ] Empty states display correctly

### Edge Cases

- [ ] Long text (truncation with ellipsis, wrapping)
- [ ] Missing/null data (graceful handling)
- [ ] Empty lists (empty state widget)
- [ ] Single item vs many items
- [ ] Very long lists (scroll behavior, lazy loading)
- [ ] RTL support (if required)

### Accessibility

- [ ] Semantic widgets used (Semantics, ExcludeSemantics)
- [ ] TalkBack/VoiceOver can navigate the screen
- [ ] Touch targets are at least 48x48 dp
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus traversal order is logical
