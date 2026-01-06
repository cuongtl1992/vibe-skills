---
name: bdd-practices
description: Cucumber/Gherkin BDD best practices guidance skill, providing Gherkin writing standards, scenario design principles, Discovery Workshop facilitation, and common anti-pattern identification to help teams write high-quality behavior-driven development specifications.
---

# Cucumber BDD Best Practices Skill

## Description

Cucumber/Gherkin BDD best practices guidance skill, integrating official Cucumber documentation and industry expert experience. Provides comprehensive BDD practice guidance including best practices for the three phases: Discovery, Formulation, and Automation. Helps teams write readable, maintainable behavior specifications.

## Responsibilities

- **Discovery Workshop Facilitation**: Guide teams through exploratory workshops
- **Gherkin Writing Review**: Review and improve Gherkin scenario quality
- **BDD Anti-pattern Identification**: Identify and correct common BDD mistakes
- **Test Strategy Consultation**: Provide declarative vs imperative testing advice

## Three Core BDD Practices

### 1. Discovery - What It "Could" Do

> "The hardest single part of building a software system is deciding precisely what to build." - Fred Brooks

**Purpose**: Build shared understanding through structured conversations, reducing requirement misunderstandings

**Workshop Methods**:
- **Example Mapping**: Use four-color index cards to map rules and examples
- **OOPSI Mapping**: Map Outcomes, Outputs, Processes, Scenarios, Inputs
- **Feature Mapping**: Identify actors, decompose tasks, map examples

**Workshop Principles**:
- Timing: As late as possible before development (to avoid losing details)
- Participants: Three Amigos (Product Owner, Developer, Tester) minimum 3-6 people
- Duration: 25-30 minutes per User Story
- Timeout Handling: Story too large needs splitting, or missing details need research

**Outputs**:
- Agreed user examples
- Identified rules and constraints
- Discovered knowledge gaps
- Deferred low-priority features

### 2. Formulation - What It "Should" Do

**Purpose**: Structure examples into executable documentation, establishing a common language

**Writing Principles**:

```gherkin
# ✅ Good Example - Declarative
Feature: Subscribers see different articles based on subscription level

  Scenario: Free subscribers can only see free articles
    Given Free Frieda has a free subscription
    When Free Frieda logs in with valid credentials
    Then she sees a free article

# ❌ Bad Example - Imperative
Feature: Subscribers see different articles based on subscription level

  Scenario: Free subscribers can only see free articles
    Given the user is on the login page
    When I enter "free@example.com" in the Email field
    And I enter "password123" in the Password field
    And I click the "Submit" button
    Then I see "FreeArticle1" on the homepage
```

**Key Differences**:
- **Declarative**: Describes "what to do" (behavior intent)
- **Imperative**: Describes "how to do it" (implementation details)

### 3. Automation - What It "Actually" Does

**Purpose**: Use automated examples to guide development, building a safety net

**Practice Approach**:
1. Take one example at a time
2. Connect to the system as a test (test fails)
3. Develop implementation code (using low-level examples to guide)
4. Test passes, repeat with next example

## Gherkin Writing Golden Rules

### Core Principle

> **Treat readers the way you want to be treated. When writing Gherkin, make it understandable to someone who doesn't know the feature.**

### Cardinal Rule

> **One scenario, one behavior!**

### Step Rules

#### 1. Steps Must Appear in Order

```gherkin
# ❌ Wrong: Steps out of order
Scenario: Incorrect step order
  Given initial state
  When perform action
  Then verify result
  When perform another action    # ❌ When cannot follow Then
  Then verify another result

# ✅ Correct: Split into two scenarios
Scenario: First behavior
  Given initial state
  When perform first action
  Then verify first result

Scenario: Second behavior
  Given initial state
  When perform second action
  Then verify second result
```

#### 2. Correct Usage of Step Types

- **Given**: Establish initial state (describe the scene)
- **When**: Execute action (trigger behavior)
- **Then**: Verify results (observable output)
- **And/But**: Connect steps of the same type

#### 3. Tense and Voice

```gherkin
# ✅ Correct: Always use present tense + third person
Given the Google homepage is displayed
When the user enters "panda" in the search bar
Then links related to "panda" are displayed

# ❌ Wrong: Mixed tenses and persons
Given the user navigated to Google homepage    # ❌ Implies action, not state
When the user entered "panda"                  # ❌ Past tense
Then "panda" related links will be displayed  # ❌ Future tense
```

#### 4. Step Structure: Subject + Predicate

```gherkin
# ✅ Correct: Complete subject-predicate structure
Given the user navigates to Google homepage
When the user enters "panda" in the search bar
Then the results page displays links related to "panda"
And the results page displays image links for "panda"
And the results page displays video links for "panda"

# ❌ Wrong: Missing subject or predicate
Given the user navigates to Google homepage
When the user enters "panda" in the search bar
Then the results page displays links related to "panda"
And image links for "panda"           # ❌ Missing subject and predicate
And video links for "panda"           # ❌ Cannot be reused
```

## Common Anti-Patterns and Corrections

### Anti-Pattern 1: Procedure-Driven Tests

```gherkin
# ❌ Wrong: Applying traditional test steps with BDD keywords
Feature: Google Search

  Scenario: Google image search displays images
    Given the user opens a web browser
    And the user navigates to "https://www.google.com/"
    When the user enters "panda" in the search bar
    Then the results page displays links related to "panda"
    When the user clicks the "Images" link at the top    # ❌ Second When-Then appears
    Then the results page displays images related to "panda"

# ✅ Correct: One behavior per scenario
Feature: Google Search

  Scenario: Search from search bar
    Given the web browser is at Google homepage
    When the user enters "panda" in the search bar
    Then links related to "panda" are displayed

  Scenario: Image search
    Given Google search results for "panda" are displayed
    When the user clicks the "Images" link at the top
    Then images related to "panda" are displayed
```

### Anti-Pattern 2: Overly Imperative

```gherkin
# ❌ Wrong: Over-describing implementation details
Scenario: User login
  Given I visit "/login"
  When I enter "Bob" in the "username" field
  And I enter "tester" in the "password" field
  And I click the "login" button
  Then I should see the "welcome" page

# ✅ Correct: Declarative behavior description
Scenario: User login
  Given Bob is a registered user
  When Bob logs in with valid credentials
  Then Bob sees the welcome page
```

### Anti-Pattern 3: Misusing Scenario Outline

```gherkin
# ❌ Wrong: Too many unnecessary variations
Scenario Outline: Search
  Given the user is on the search page
  When the user searches for "<query>"
  Then results related to "<query>" are displayed
  
  Examples:
    | query     |
    | panda     |
    | elephant  |  # ❌ Does not add test value
    | tiger     |  # ❌ Equivalent class repetition
    | lion      |  # ❌ Wastes execution time

# ✅ Correct: Focus on meaningful variations
Scenario Outline: Access permissions for different subscription levels
  Given <user> has a <subscription> subscription
  When <user> logs in
  Then <user> can access <accessible> articles
  
  Examples:
    | user  | subscription | accessible              |
    | Free  | free         | free articles           |
    | Basic | basic paid   | free and paid articles  |
    | Pro   | professional | all articles            |
```

### Anti-Pattern 4: Hardcoded Test Data

```gherkin
# ❌ Wrong: Hardcoding data that may change
Scenario: Google search suggestions
  When the user searches for "panda"
  Then the following related results are displayed
    | Related Search |
    | Panda Express  |  # ❌ Will fail if business closes
    | Giant Panda    |
    | panda videos   |

# ✅ Correct: Defensive validation
Scenario: Google search suggestions
  When the user searches for "panda"
  Then links related to "panda" are displayed
  And each result contains the "panda" keyword
```

## Describe Behavior, Not Implementation

### Core Concept

**Functional requirements belong to features, procedures belong to implementation details**

```gherkin
# ✅ Functional requirement (describes "what to do")
When Bob logs in

# ❌ Procedure reference (describes "how to do it")
Given I visit "/login"
When I enter "Bob" in the "user name" field
And I enter "tester" in the "password" field
And I click the "login" button
Then I should see the "welcome" page
```

### Verification Method

Ask yourself: "If the implementation changes, would this wording need to change?"
- Answer is "yes" → Rewrite to avoid implementation details
- Answer is "no" → Behavior-oriented, good to go

## Step Length Recommendations

### Ideal Length

- Recommended step count: **3-5 steps**
- Maximum step count: **Single digits (<10 steps)**

### Reduction Techniques

#### 1. Declarative Instead of Imperative

```gherkin
# Imperative - 8 steps
When the user scrolls mouse to search bar
And the user clicks the search bar
And the user types letter "p"
And the user types letter "a"
And the user types letter "n"
And the user types letter "d"
And the user types letter "a"
And the user presses ENTER key

# Declarative - 1 step
When the user enters "panda" in the search bar
```

#### 2. Hide Implementation Details

```gherkin
# ❌ Exposing all details
Given the user has email "user@example.com"
And the user has name "John Doe"
And the user has phone "0912345678"
When the user registers

# ✅ Hidden in step definitions
Given John is a new user
When John registers with valid information
```

## Scenario Outline Checklist

When using Scenario Outline, ask yourself the following questions:

### 1. Equivalence Class Check

- ❓ Does each row represent a different equivalence class?
- ❌ Searching "elephant" in addition to "panda" does not add test value

### 2. Combination Necessity

- ❓ Do you need to cover all input combinations?
- ⚠️ N fields with M inputs each = M^N combinations
- ✅ Consider each input appearing only once, without considering combinations

### 3. Behavior Separation

- ❓ Are there columns representing different behaviors?
- 🔍 If columns are never referenced together in the same step
- ✅ Consider splitting Scenario Outline by column

### 4. Data Transparency

- ❓ Does the reader need to know all data explicitly?
- ✅ Consider hiding some data in step definitions
- ✅ Some data can be derived from other data

## Scenario Title Writing Guidelines

### Good Title Characteristics

- **Concise**: One line describing the behavior
- **Clear**: Understandable even to someone unfamiliar with the feature
- **User-facing**: Describes user value
- **Recordable**: Framework will record the title

### Examples

```gherkin
# ✅ Good titles
Scenario: Free members can only see free content
Scenario: Paid members can access premium features
Scenario: Search results are sorted by relevance

# ❌ Bad titles
Scenario: Test 1
Scenario: Check permissions
Scenario: Verify API endpoint response
```

## Handling Known Unknowns

### Principles

- Write scenarios defensively to avoid failures due to underlying data changes
- Treat data as behavior examples, not test data

### Techniques

#### 1. Smart Validation Instead of Hardcoding

```gherkin
# ❌ Hardcoded validation
Then results contain "Panda Express"

# ✅ Pattern validation
Then each result is related to the search term "panda"
```

#### 2. Hide Data in Step Definitions

```gherkin
Scenario: Search result links
  Given Google search results for "panda" are displayed
  When the user clicks the first result link           # Link value not explicitly named
  Then the page for the selected result link is displayed  # Step definition passes link data
```

## Style and Structure

### Consistency Principles

- **Third person**: Always use third-person perspective
- **Present tense**: Always use present tense
- **Subject-predicate**: Complete sentence structure

### Examples

```gherkin
# ✅ Consistent style
Feature: User Authentication

  Scenario: Successful login
    Given the user has a valid account
    When the user enters correct credentials
    Then the user sees the dashboard

# ❌ Inconsistent style
Feature: User Authentication

  Scenario: Successful login
    Given I have an account              # ❌ First person
    When the user entered credentials    # ❌ Past tense
    Then the dashboard will be displayed # ❌ Future tense
```

## Interactive Guidance Flow

When users seek assistance, follow this flow:

### 1. Discovery Phase Assistance

```
Q1: Who is the main user of this User Story?
Q2: What does the user want to achieve?
Q3: What rules or constraints exist?
Q4: Can you give a specific example?
Q5: Are there edge cases or exceptions?
```

### 2. Formulation Phase Review

```
Checklist:
□ Does the scenario describe behavior, not implementation?
□ Is it declarative rather than imperative?
□ Does each scenario cover only one behavior?
□ Do steps follow Given-When-Then order?
□ Is third-person present tense used?
□ Is the title clear and concise?
```

### 3. Anti-Pattern Detection

```
Scan for the following anti-patterns:
- [ ] Multiple When-Then pairs
- [ ] UI implementation details (buttons, fields, URLs)
- [ ] Hardcoded data that may change
- [ ] Overly long scenarios (>10 steps)
- [ ] Overuse of Scenario Outline
```

## Suggestion Format

### Correction Suggestion Template

```markdown
### 🔴 Issue Found
[Describe the problem]

### ❌ Original Version
```gherkin
[Original Gherkin]
```

### 💡 Problem Analysis
[Explain why this is a problem]

### ✅ Suggested Correction
```gherkin
[Corrected Gherkin]
```

### 📝 Correction Explanation
[Explain why this is better]
```

## Reference Resources

### Official Documentation

- [Cucumber BDD Documentation](https://cucumber.io/docs/bdd/)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)
- [Discovery Workshop](https://cucumber.io/docs/bdd/discovery-workshop/)

### Best Practices Articles

- [Automation Panda - BDD 101: Writing Good Gherkin](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/)
- [Should Gherkin Steps Use First-Person or Third-Person?](https://automationpanda.com/2017/01/18/should-gherkin-steps-use-first-person-or-third-person/)
- [Good Gherkin Scenario Titles](https://automationpanda.com/2018/01/31/good-gherkin-scenario-titles/)

## Usage Examples

### Request Example 1: Review Scenario

```
User: Please review this Gherkin scenario:
Scenario: User login
  When I visit the login page
  And I enter username and password
  Then I see the homepage
Assistant: [Use correction suggestion template to provide feedback]
```

### Request Example 2: Guide Discovery

```
User: We are developing a "shopping cart checkout" feature but not sure how to start

Assistant: [Use Discovery phase assistance flow to guide]
```

### Request Example 3: Convert Traditional Tests

```
User: How do I convert this traditional test to a BDD scenario?
[Traditional test steps]

Assistant: [Identify behaviors, split scenarios, convert to declarative Gherkin]
```

## Important Notes

- Always prioritize **readability** over brevity
- Remember the audience includes **non-technical people**
- Gherkin is a **communication tool**, not just testing
- Maintain **behavior-driven thinking**, avoid procedure-driven
- Continuously **refactor** scenarios, just like refactoring code