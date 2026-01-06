#!/usr/bin/env ts-node
/**
 * Analyzes .feature files and generates a BDD quality report.
 *
 * Usage:
 *   npx ts-node scripts/analyze-features.ts [features-dir]
 *
 * Default features-dir: ./features
 *
 * Output: bdd-quality-report.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface ScenarioAnalysis {
  name: string;
  line: number;
  tags: string[];
  stepCount: number;
  isDeclarative: boolean;
  imperativeKeywords: string[];
}

interface FeatureAnalysis {
  filePath: string;
  featureName: string;
  tags: string[];
  scenarioCount: number;
  stepCount: number;
  hasBackground: boolean;
  hasScenarioOutline: boolean;
  scenarios: ScenarioAnalysis[];
}

interface AnalysisReport {
  generatedAt: string;
  featuresDir: string;
  totalFeatures: number;
  totalScenarios: number;
  totalSteps: number;
  backgroundUsageRate: number;
  scenarioOutlineUsageRate: number;
  declarativeScenarioRate: number;
  tagCoverageRate: number;
  avgScenarioLength: number;
  features: FeatureAnalysis[];
  imperativeScenarios: Array<{
    file: string;
    scenario: string;
    keywords: string[];
  }>;
  untaggedScenarios: Array<{
    file: string;
    scenario: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const IMPERATIVE_KEYWORDS = [
  // English
  'click',
  'clicks',
  'enter',
  'enters',
  'type',
  'types',
  'input',
  'inputs',
  'select',
  'selects',
  'field',
  'button',
  'dropdown',
  'checkbox',
  'radio',
  'scroll',
  'hover',
  'drag',
  'drop',
  // Vietnamese (for KiotViet context)
  'nhấn',
  'bấm',
  'nhập',
  'điền',
  'chọn',
  'trường',
  'nút',
];

const TARGETS = {
  backgroundUsageRate: 50,
  scenarioOutlineUsageRate: 30,
  declarativeScenarioRate: 80,
  tagCoverageRate: 90,
  avgScenarioLength: { min: 3, max: 7 },
};

// ============================================================================
// File Discovery
// ============================================================================

function findFeatureFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findFeatureFiles(fullPath));
    } else if (entry.name.endsWith('.feature')) {
      results.push(fullPath);
    }
  }

  return results;
}

// ============================================================================
// Feature Analysis
// ============================================================================

function analyzeFeatureFile(filePath: string): FeatureAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let featureName = '';
  const featureTags: string[] = [];
  let hasBackground = false;
  let hasScenarioOutline = false;
  const scenarios: ScenarioAnalysis[] = [];

  let currentScenario: Partial<ScenarioAnalysis> | null = null;
  let currentSteps: string[] = [];
  let pendingTags: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    // Collect tags
    if (trimmed.startsWith('@')) {
      const tags = trimmed.split(/\s+/).filter((t) => t.startsWith('@'));
      pendingTags.push(...tags);
      continue;
    }

    // Feature declaration
    if (trimmed.startsWith('Feature:')) {
      featureName = trimmed.replace('Feature:', '').trim();
      featureTags.push(...pendingTags);
      pendingTags = [];
      continue;
    }

    // Background
    if (trimmed.startsWith('Background:')) {
      hasBackground = true;
      pendingTags = [];
      continue;
    }

    // Scenario or Scenario Outline
    if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
      // Save previous scenario
      if (currentScenario) {
        const analysis = analyzeScenarioSteps(currentSteps);
        scenarios.push({
          name: currentScenario.name || '',
          line: currentScenario.line || 0,
          tags: currentScenario.tags || [],
          stepCount: currentSteps.length,
          isDeclarative: analysis.isDeclarative,
          imperativeKeywords: analysis.foundKeywords,
        });
      }

      // Start new scenario
      const isOutline = trimmed.startsWith('Scenario Outline:');
      if (isOutline) {
        hasScenarioOutline = true;
      }

      currentScenario = {
        name: trimmed.replace(/Scenario( Outline)?:/, '').trim(),
        line: lineNumber,
        tags: [...pendingTags],
      };
      currentSteps = [];
      pendingTags = [];
      continue;
    }

    // Steps
    if (/^\s*(Given|When|Then|And|But)\s/.test(trimmed)) {
      currentSteps.push(trimmed);
    }
  }

  // Save last scenario
  if (currentScenario) {
    const analysis = analyzeScenarioSteps(currentSteps);
    scenarios.push({
      name: currentScenario.name || '',
      line: currentScenario.line || 0,
      tags: currentScenario.tags || [],
      stepCount: currentSteps.length,
      isDeclarative: analysis.isDeclarative,
      imperativeKeywords: analysis.foundKeywords,
    });
  }

  return {
    filePath,
    featureName,
    tags: featureTags,
    scenarioCount: scenarios.length,
    stepCount: scenarios.reduce((sum, s) => sum + s.stepCount, 0),
    hasBackground,
    hasScenarioOutline,
    scenarios,
  };
}

function analyzeScenarioSteps(steps: string[]): {
  isDeclarative: boolean;
  foundKeywords: string[];
} {
  const foundKeywords: string[] = [];

  for (const step of steps) {
    const stepLower = step.toLowerCase();
    for (const keyword of IMPERATIVE_KEYWORDS) {
      if (stepLower.includes(keyword.toLowerCase())) {
        if (!foundKeywords.includes(keyword)) {
          foundKeywords.push(keyword);
        }
      }
    }
  }

  return {
    isDeclarative: foundKeywords.length === 0,
    foundKeywords,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(features: FeatureAnalysis[], featuresDir: string): AnalysisReport {
  const totalFeatures = features.length;
  const totalScenarios = features.reduce((sum, f) => sum + f.scenarioCount, 0);
  const totalSteps = features.reduce((sum, f) => sum + f.stepCount, 0);

  const featuresWithBackground = features.filter((f) => f.hasBackground).length;
  const backgroundUsageRate =
    totalFeatures > 0 ? (featuresWithBackground / totalFeatures) * 100 : 0;

  const featuresWithOutline = features.filter((f) => f.hasScenarioOutline).length;
  const scenarioOutlineUsageRate =
    totalFeatures > 0 ? (featuresWithOutline / totalFeatures) * 100 : 0;

  const allScenarios = features.flatMap((f) => f.scenarios);
  const declarativeScenarios = allScenarios.filter((s) => s.isDeclarative).length;
  const declarativeScenarioRate =
    totalScenarios > 0 ? (declarativeScenarios / totalScenarios) * 100 : 0;

  const taggedScenarios = allScenarios.filter((s) => s.tags.length > 0).length;
  const tagCoverageRate = totalScenarios > 0 ? (taggedScenarios / totalScenarios) * 100 : 0;

  const avgScenarioLength = totalScenarios > 0 ? totalSteps / totalScenarios : 0;

  // Collect issues
  const imperativeScenarios: Array<{ file: string; scenario: string; keywords: string[] }> = [];
  const untaggedScenarios: Array<{ file: string; scenario: string }> = [];

  for (const feature of features) {
    for (const scenario of feature.scenarios) {
      if (!scenario.isDeclarative) {
        imperativeScenarios.push({
          file: feature.filePath,
          scenario: scenario.name,
          keywords: scenario.imperativeKeywords,
        });
      }
      if (scenario.tags.length === 0) {
        untaggedScenarios.push({
          file: feature.filePath,
          scenario: scenario.name,
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    featuresDir,
    totalFeatures,
    totalScenarios,
    totalSteps,
    backgroundUsageRate,
    scenarioOutlineUsageRate,
    declarativeScenarioRate,
    tagCoverageRate,
    avgScenarioLength,
    features,
    imperativeScenarios,
    untaggedScenarios,
  };
}

function formatMarkdownReport(report: AnalysisReport): string {
  const status = (value: number, target: number, higherBetter = true): string => {
    if (higherBetter) {
      return value >= target ? '✅' : '⚠️';
    }
    return value <= target ? '✅' : '⚠️';
  };

  const lengthStatus = (value: number): string => {
    if (value >= TARGETS.avgScenarioLength.min && value <= TARGETS.avgScenarioLength.max) {
      return '✅';
    }
    return '⚠️';
  };

  let md = `# BDD Quality Analysis Report\n\n`;
  md += `**Generated**: ${report.generatedAt}\n`;
  md += `**Features Directory**: ${report.featuresDir}\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Metric | Value | Target | Status |\n`;
  md += `|--------|-------|--------|--------|\n`;
  md += `| Total Features | ${report.totalFeatures} | - | - |\n`;
  md += `| Total Scenarios | ${report.totalScenarios} | - | - |\n`;
  md += `| Total Steps | ${report.totalSteps} | - | - |\n`;
  md += `| Background Usage | ${report.backgroundUsageRate.toFixed(1)}% | ≥${TARGETS.backgroundUsageRate}% | ${status(report.backgroundUsageRate, TARGETS.backgroundUsageRate)} |\n`;
  md += `| Scenario Outline Usage | ${report.scenarioOutlineUsageRate.toFixed(1)}% | ≥${TARGETS.scenarioOutlineUsageRate}% | ${status(report.scenarioOutlineUsageRate, TARGETS.scenarioOutlineUsageRate)} |\n`;
  md += `| Declarative Scenario Rate | ${report.declarativeScenarioRate.toFixed(1)}% | ≥${TARGETS.declarativeScenarioRate}% | ${status(report.declarativeScenarioRate, TARGETS.declarativeScenarioRate)} |\n`;
  md += `| Tag Coverage | ${report.tagCoverageRate.toFixed(1)}% | ≥${TARGETS.tagCoverageRate}% | ${status(report.tagCoverageRate, TARGETS.tagCoverageRate)} |\n`;
  md += `| Avg Scenario Length | ${report.avgScenarioLength.toFixed(1)} steps | ${TARGETS.avgScenarioLength.min}-${TARGETS.avgScenarioLength.max} | ${lengthStatus(report.avgScenarioLength)} |\n\n`;

  // Strengths
  md += `## Strengths ✅\n\n`;
  const strengths: string[] = [];

  if (report.backgroundUsageRate >= TARGETS.backgroundUsageRate) {
    strengths.push(`Background used appropriately (${report.backgroundUsageRate.toFixed(1)}%)`);
  }
  if (report.declarativeScenarioRate >= TARGETS.declarativeScenarioRate) {
    strengths.push(
      `Most scenarios use declarative style (${report.declarativeScenarioRate.toFixed(1)}%)`
    );
  }
  if (report.tagCoverageRate >= TARGETS.tagCoverageRate) {
    strengths.push(`Good tag coverage (${report.tagCoverageRate.toFixed(1)}%)`);
  }
  if (
    report.avgScenarioLength >= TARGETS.avgScenarioLength.min &&
    report.avgScenarioLength <= TARGETS.avgScenarioLength.max
  ) {
    strengths.push(`Scenario length is optimal (${report.avgScenarioLength.toFixed(1)} steps)`);
  }

  if (strengths.length > 0) {
    strengths.forEach((s, i) => {
      md += `${i + 1}. ${s}\n`;
    });
  } else {
    md += `_None identified_\n`;
  }
  md += `\n`;

  // Issues
  md += `## Issues ⚠️\n\n`;
  const issues: string[] = [];

  if (report.declarativeScenarioRate < TARGETS.declarativeScenarioRate) {
    issues.push(
      `**Imperative scenarios**: ${report.imperativeScenarios.length} scenarios use UI-level details`
    );
  }
  if (report.tagCoverageRate < TARGETS.tagCoverageRate) {
    issues.push(`**Missing tags**: ${report.untaggedScenarios.length} scenarios have no tags`);
  }
  if (report.backgroundUsageRate < TARGETS.backgroundUsageRate) {
    issues.push(`**Background underused**: Consider extracting common preconditions`);
  }
  if (report.scenarioOutlineUsageRate < TARGETS.scenarioOutlineUsageRate) {
    issues.push(`**Scenario Outline underused**: Look for similar scenarios to parameterize`);
  }

  if (issues.length > 0) {
    issues.forEach((s, i) => {
      md += `${i + 1}. ${s}\n`;
    });
  } else {
    md += `_None identified_\n`;
  }
  md += `\n`;

  // Feature details
  md += `## Feature Details\n\n`;
  md += `| Feature | Scenarios | Steps | Background | Outline | Declarative |\n`;
  md += `|---------|-----------|-------|------------|---------|-------------|\n`;

  for (const feature of report.features) {
    const declarativeCount = feature.scenarios.filter((s) => s.isDeclarative).length;
    const declarativeRate =
      feature.scenarioCount > 0
        ? `${((declarativeCount / feature.scenarioCount) * 100).toFixed(0)}%`
        : '-';

    md += `| ${feature.featureName || path.basename(feature.filePath)} | ${feature.scenarioCount} | ${feature.stepCount} | ${feature.hasBackground ? '✅' : '-'} | ${feature.hasScenarioOutline ? '✅' : '-'} | ${declarativeRate} |\n`;
  }
  md += `\n`;

  // Imperative scenarios detail
  if (report.imperativeScenarios.length > 0) {
    md += `## Imperative Scenarios (${report.imperativeScenarios.length})\n\n`;
    md += `These scenarios contain UI-level details and should be refactored:\n\n`;

    for (const item of report.imperativeScenarios.slice(0, 20)) {
      md += `- **${item.scenario}**\n`;
      md += `  - File: \`${item.file}\`\n`;
      md += `  - Keywords: ${item.keywords.join(', ')}\n`;
    }

    if (report.imperativeScenarios.length > 20) {
      md += `\n_...and ${report.imperativeScenarios.length - 20} more_\n`;
    }
    md += `\n`;
  }

  // Untagged scenarios
  if (report.untaggedScenarios.length > 0) {
    md += `## Untagged Scenarios (${report.untaggedScenarios.length})\n\n`;

    for (const item of report.untaggedScenarios.slice(0, 20)) {
      md += `- **${item.scenario}** in \`${item.file}\`\n`;
    }

    if (report.untaggedScenarios.length > 20) {
      md += `\n_...and ${report.untaggedScenarios.length - 20} more_\n`;
    }
    md += `\n`;
  }

  return md;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const featuresDir = process.argv[2] || './features';
  const outputFile = 'bdd-quality-report.md';

  console.log(`🔍 Searching for .feature files in: ${featuresDir}`);

  const featureFiles = findFeatureFiles(featuresDir);

  if (featureFiles.length === 0) {
    console.error(`❌ No .feature files found in: ${featuresDir}`);
    process.exit(1);
  }

  console.log(`✅ Found ${featureFiles.length} feature files`);

  console.log(`📊 Analyzing...`);
  const features = featureFiles.map(analyzeFeatureFile);

  const report = generateReport(features, featuresDir);
  const markdown = formatMarkdownReport(report);

  fs.writeFileSync(outputFile, markdown);
  console.log(`\n📝 Report generated: ${outputFile}`);

  // Print summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`SUMMARY`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Features:           ${report.totalFeatures}`);
  console.log(`Scenarios:          ${report.totalScenarios}`);
  console.log(`Declarative Rate:   ${report.declarativeScenarioRate.toFixed(1)}%`);
  console.log(`Tag Coverage:       ${report.tagCoverageRate.toFixed(1)}%`);
  console.log(`Background Usage:   ${report.backgroundUsageRate.toFixed(1)}%`);
  console.log(`${'─'.repeat(50)}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { analyzeFeatureFile, generateReport, formatMarkdownReport, FeatureAnalysis, AnalysisReport };
