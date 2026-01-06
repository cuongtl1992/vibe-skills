# BDD Quality Metrics

Quantitative metrics for measuring BDD test quality.

---

## 1. Basic Metrics

### M1: Feature Count

**Definition**: Total number of `.feature` files in project.

**Target**: Varies by project size

**Measurement**:
```bash
find ./features -name "*.feature" | wc -l
```

---

### M2: Scenario Count

**Definition**: Total number of scenarios across all features.

**Target**: Varies by project size

**Measurement**:
```bash
grep -rE "^\s*(Scenario:|Scenario Outline:)" ./features | wc -l
```

---

### M3: Step Count

**Definition**: Total number of steps (Given/When/Then/And/But) across all scenarios.

**Target**: Varies by project size

**Measurement**:
```bash
grep -rE "^\s*(Given|When|Then|And|But)" ./features | wc -l
```

---

## 2. Quality Metrics

### M4: Step Reuse Rate

**Definition**: Percentage of step definitions used in multiple scenarios.

**Target**: ≥60%

**Formula**:
```
Step Reuse Rate = (Steps used 2+ times) / (Total unique steps) × 100%
```

**Rating scale**:
| Rate | Rating | Interpretation |
|------|--------|----------------|
| ≥80% | Excellent | High maintainability |
| 60-79% | Good | Acceptable |
| 40-59% | Fair | Some duplication |
| <40% | Poor | Significant duplication |

---

### M5: Declarative Scenario Rate

**Definition**: Percentage of scenarios written in declarative style.

**Target**: ≥80%

**Formula**:
```
Declarative Rate = (Declarative scenarios) / (Total scenarios) × 100%
```

**Detection criteria** - Scenario is IMPERATIVE if it contains:
- UI element references: `button`, `field`, `input`, `dropdown`
- UI actions: `click`, `type`, `enter`, `select`, `scroll`
- Technical details: URLs, CSS selectors, DOM elements

**Rating scale**:
| Rate | Rating |
|------|--------|
| ≥90% | Excellent |
| 80-89% | Good |
| 60-79% | Fair |
| <60% | Poor |

---

### M6: Scenario Independence Rate

**Definition**: Percentage of scenarios that can run independently.

**Target**: 100%

**Formula**:
```
Independence Rate = (Independent scenarios) / (Total scenarios) × 100%
```

**Detection criteria** - Scenario is DEPENDENT if:
- References "previous" or "prior" scenario
- Relies on shared state not set up in Background
- Fails when run in isolation

**Rating scale**:
| Rate | Rating |
|------|--------|
| 100% | Required |
| 90-99% | Needs fix |
| <90% | Critical issue |

---

### M7: Background Usage Rate

**Definition**: Percentage of features using Background for common setup.

**Target**: ≥50%

**Formula**:
```
Background Rate = (Features with Background) / (Total features) × 100%
```

**Rating scale**:
| Rate | Rating | Interpretation |
|------|--------|----------------|
| ≥60% | Excellent | Good DRY practice |
| 40-59% | Good | Acceptable |
| 20-39% | Fair | Some repetition |
| <20% | Poor | Likely duplication |

---

### M8: Scenario Outline Usage Rate

**Definition**: Percentage of features using Scenario Outline.

**Target**: ≥30%

**Formula**:
```
Outline Rate = (Features with Scenario Outline) / (Total features) × 100%
```

**Rating scale**:
| Rate | Rating |
|------|--------|
| ≥50% | Excellent |
| 30-49% | Good |
| 10-29% | Fair |
| <10% | Poor |

---

## 3. Coverage Metrics

### M9: Happy Path Coverage

**Definition**: Percentage of features with at least one success scenario.

**Target**: 100%

**Formula**:
```
Happy Path Coverage = (Features with success scenario) / (Total features) × 100%
```

**Rating scale**:
| Rate | Rating |
|------|--------|
| 100% | Required |
| 90-99% | Fix immediately |
| <90% | Critical gap |

---

### M10: Error Path Coverage

**Definition**: Percentage of features with error handling scenarios.

**Target**: 100%

**Formula**:
```
Error Path Coverage = (Features with error scenarios) / (Total features) × 100%
```

**Rating scale**:
| Rate | Rating |
|------|--------|
| 100% | Excellent |
| 80-99% | Good |
| 60-79% | Fair |
| <60% | Poor |

---

### M11: Boundary Value Coverage

**Definition**: Percentage of numeric inputs with boundary tests.

**Target**: ≥80%

**Formula**:
```
Boundary Coverage = (Inputs with boundary tests) / (Total numeric inputs) × 100%
```

**Required boundaries per input**:
- Minimum value
- Maximum value
- Below minimum
- Above maximum

**Rating scale**:
| Rate | Rating |
|------|--------|
| ≥90% | Excellent |
| 80-89% | Good |
| 60-79% | Fair |
| <60% | Poor |

---

### M12: Security Test Coverage

**Definition**: Percentage of user inputs with security tests.

**Target**: 100%

**Formula**:
```
Security Coverage = (Inputs with security tests) / (Total user inputs) × 100%
```

**Required security tests**:
- XSS prevention (script injection)
- SQL injection (if applicable)
- Authentication bypass
- Authorization checks

**Rating scale**:
| Rate | Rating |
|------|--------|
| 100% | Required |
| 80-99% | High risk |
| <80% | Critical risk |

---

## 4. Maintainability Metrics

### M13: Tag Coverage Rate

**Definition**: Percentage of scenarios with meaningful tags.

**Target**: ≥90%

**Formula**:
```
Tag Coverage = (Scenarios with tags) / (Total scenarios) × 100%
```

**Rating scale**:
| Rate | Rating |
|------|--------|
| ≥95% | Excellent |
| 90-94% | Good |
| 80-89% | Fair |
| <80% | Poor |

---

### M14: Flaky Test Rate

**Definition**: Percentage of tests with flaky patterns.

**Target**: 0%

**Formula**:
```
Flaky Rate = (Tests with flaky patterns) / (Total tests) × 100%
```

**Flaky patterns**:
- `waitForTimeout(N)` usage
- Text-based selectors
- Random data without seeding
- Time-dependent assertions

**Rating scale**:
| Rate | Rating |
|------|--------|
| 0% | Excellent |
| 1-5% | Good |
| 6-10% | Fair |
| >10% | Poor |

---

### M15: Average Scenario Length

**Definition**: Average number of steps per scenario.

**Target**: 3-7 steps

**Formula**:
```
Avg Length = (Total steps) / (Total scenarios)
```

**Rating scale**:
| Steps | Rating | Interpretation |
|-------|--------|----------------|
| 3-7 | Optimal | Focused scenarios |
| 8-10 | Acceptable | Consider splitting |
| >10 | Too long | Definitely split |
| <3 | Too short | May lack detail |

---

## 5. Composite Metrics

### M16: Overall Quality Score

**Definition**: Weighted average of all quality metrics.

**Target**: ≥80

**Formula**:
```
Quality Score = Σ(Metric × Weight) / Σ(Weight) × 100
```

**Weights**:
| Metric | Weight | Rationale |
|--------|--------|-----------|
| Happy Path Coverage | 10 | Critical |
| Error Path Coverage | 10 | Critical |
| Security Coverage | 10 | Critical |
| Independence Rate | 8 | High impact |
| Flaky Test Rate | 8 | High impact |
| Step Reuse Rate | 6 | Maintainability |
| Declarative Rate | 6 | Maintainability |
| Boundary Coverage | 5 | Coverage |
| Background Usage | 3 | Best practice |
| Outline Usage | 3 | Best practice |
| Tag Coverage | 2 | Organization |

**Grade scale**:
| Score | Grade | Action |
|-------|-------|--------|
| 90-100 | A | Maintain |
| 80-89 | B | Minor improvements |
| 70-79 | C | Improvement plan needed |
| 60-69 | D | Significant work needed |
| <60 | F | Major overhaul required |

---

## 6. Trend Analysis

### M17: Quality Score Trend

**Definition**: Quality score change over time.

**Target**: Stable or improving

**Measurement frequency**: Weekly or per sprint

**Visualization**:
```
Score
100 ┤                              ●
 90 ┤                         ●
 80 ┤                    ●
 70 ┤               ●
 60 ┤          ●
    └─────────────────────────────────
     Sprint1  Sprint2  Sprint3  Sprint4
```

**Interpretation**:
- Upward trend: Improvements taking effect
- Stable: Maintenance mode
- Downward trend: Technical debt accumulating

---

## Dashboard Template

```markdown
# BDD Quality Dashboard

## Overall Score: B (85/100)

### Basic Stats
| Metric | Value |
|--------|-------|
| Features | 12 |
| Scenarios | 87 |
| Steps | 342 |

### Quality Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Step Reuse Rate | 68% | 60% | ✅ |
| Declarative Rate | 75% | 80% | ⚠️ |
| Independence Rate | 100% | 100% | ✅ |

### Coverage Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Happy Path | 100% | 100% | ✅ |
| Error Path | 92% | 100% | ⚠️ |
| Boundary | 70% | 80% | ⚠️ |
| Security | 100% | 100% | ✅ |

### Maintainability
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Tag Coverage | 95% | 90% | ✅ |
| Flaky Rate | 3% | 0% | ⚠️ |
| Avg Scenario Length | 5.2 | 3-7 | ✅ |

### Priority Improvements
1. 🔴 Fix 3 flaky tests
2. 🟡 Add error paths for 1 feature  
3. 🟡 Add boundary tests for 3 inputs
4. 🟡 Refactor 22 imperative scenarios

### Trend (Last 4 Sprints)
Sprint 1: 72 → Sprint 2: 78 → Sprint 3: 82 → Sprint 4: 85 📈
```

---

## Automation

### Metric Collection Script

```typescript
interface QualityMetrics {
  basic: {
    featureCount: number;
    scenarioCount: number;
    stepCount: number;
  };
  quality: {
    stepReuseRate: number;
    declarativeRate: number;
    independenceRate: number;
    backgroundUsageRate: number;
    outlineUsageRate: number;
  };
  coverage: {
    happyPathCoverage: number;
    errorPathCoverage: number;
    boundaryCoverage: number;
    securityCoverage: number;
  };
  maintainability: {
    tagCoverage: number;
    flakyRate: number;
    avgScenarioLength: number;
  };
  overall: {
    score: number;
    grade: string;
  };
}
```

### Thresholds Configuration

```json
{
  "thresholds": {
    "stepReuseRate": { "target": 60, "warning": 50, "critical": 40 },
    "declarativeRate": { "target": 80, "warning": 70, "critical": 60 },
    "independenceRate": { "target": 100, "warning": 95, "critical": 90 },
    "happyPathCoverage": { "target": 100, "warning": 95, "critical": 90 },
    "errorPathCoverage": { "target": 100, "warning": 90, "critical": 80 },
    "securityCoverage": { "target": 100, "warning": 90, "critical": 80 },
    "flakyRate": { "target": 0, "warning": 5, "critical": 10 },
    "overallScore": { "target": 80, "warning": 70, "critical": 60 }
  }
}
```
