#!/usr/bin/env ts-node
/**
 * Analyzes step definition coverage and detects duplicates.
 *
 * Usage:
 *   npx ts-node scripts/check-step-coverage.ts [features-dir] [steps-dir]
 *
 * Defaults:
 *   features-dir: ./features
 *   steps-dir: ./src/tests/steps
 *
 * Output: step-coverage-report.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface StepDefinition {
  file: string;
  line: number;
  type: 'Given' | 'When' | 'Then';
  pattern: string;
  regex: RegExp | null;
}

interface StepUsage {
  file: string;
  line: number;
  text: string;
  type: string;
}

interface StepCoverageReport {
  generatedAt: string;
  totalDefinitions: number;
  totalUsages: number;
  usedDefinitions: number;
  unusedDefinitions: StepDefinition[];
  reuseRate: number;
  stepUsageCounts: Map<string, number>;
  potentialDuplicates: Array<{ patterns: string[]; similarity: number }>;
  unmatchedSteps: StepUsage[];
}

// ============================================================================
// File Discovery
// ============================================================================

function findFiles(dir: string, extension: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findFiles(fullPath, extension));
    } else if (entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

// ============================================================================
// Step Definition Extraction
// ============================================================================

function extractStepDefinitions(filePath: string): StepDefinition[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const definitions: StepDefinition[] = [];

  const stepDefRegex = /^\s*(Given|When|Then)\s*\(\s*['"`](.+?)['"`]/;
  const stepDefRegexPattern = /^\s*(Given|When|Then)\s*\(\s*\/(.+?)\//;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let match = stepDefRegex.exec(line);
    if (match) {
      const pattern = match[2];
      definitions.push({
        file: filePath,
        line: i + 1,
        type: match[1] as 'Given' | 'When' | 'Then',
        pattern,
        regex: patternToRegex(pattern),
      });
      continue;
    }

    match = stepDefRegexPattern.exec(line);
    if (match) {
      const pattern = match[2];
      definitions.push({
        file: filePath,
        line: i + 1,
        type: match[1] as 'Given' | 'When' | 'Then',
        pattern: `/${pattern}/`,
        regex: new RegExp(pattern),
      });
    }
  }

  return definitions;
}

function patternToRegex(pattern: string): RegExp | null {
  try {
    let regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\{string\\}/g, '(?:"([^"]*)"|\'([^\']*)\')')
      .replace(/\\{int\\}/g, '(-?\\d+)')
      .replace(/\\{float\\}/g, '(-?\\d+\\.?\\d*)')
      .replace(/\\{word\\}/g, '(\\S+)')
      .replace(/\\{[^}]+\\}/g, '(.+)');

    return new RegExp(`^${regexStr}$`, 'i');
  } catch {
    return null;
  }
}

// ============================================================================
// Step Usage Extraction
// ============================================================================

function extractStepUsages(filePath: string): StepUsage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const usages: StepUsage[] = [];

  const stepRegex = /^\s*(Given|When|Then|And|But)\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = stepRegex.exec(line);

    if (match) {
      usages.push({
        file: filePath,
        line: i + 1,
        type: match[1],
        text: match[2].trim(),
      });
    }
  }

  return usages;
}

// ============================================================================
// Analysis
// ============================================================================

function findMatchingDefinition(
  step: StepUsage,
  definitions: StepDefinition[]
): StepDefinition | null {
  for (const def of definitions) {
    if (def.regex && def.regex.test(step.text)) {
      return def;
    }
  }
  return null;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

function findPotentialDuplicates(
  definitions: StepDefinition[]
): Array<{ patterns: string[]; similarity: number }> {
  const duplicates: Array<{ patterns: string[]; similarity: number }> = [];
  const checked = new Set<string>();

  for (let i = 0; i < definitions.length; i++) {
    for (let j = i + 1; j < definitions.length; j++) {
      const a = definitions[i];
      const b = definitions[j];

      if (a.type !== b.type) continue;

      const key = `${a.pattern}:${b.pattern}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const similarity = calculateSimilarity(a.pattern, b.pattern);

      if (similarity > 0.7) {
        duplicates.push({
          patterns: [a.pattern, b.pattern],
          similarity,
        });
      }
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

// ============================================================================
// Report Generation
// ============================================================================

function generateCoverageReport(
  definitions: StepDefinition[],
  usages: StepUsage[]
): StepCoverageReport {
  const stepUsageCounts = new Map<string, number>();
  const unmatchedSteps: StepUsage[] = [];

  for (const def of definitions) {
    stepUsageCounts.set(def.pattern, 0);
  }

  for (const usage of usages) {
    const matchingDef = findMatchingDefinition(usage, definitions);
    if (matchingDef) {
      const current = stepUsageCounts.get(matchingDef.pattern) || 0;
      stepUsageCounts.set(matchingDef.pattern, current + 1);
    } else {
      unmatchedSteps.push(usage);
    }
  }

  const unusedDefinitions = definitions.filter((def) => {
    const count = stepUsageCounts.get(def.pattern) || 0;
    return count === 0;
  });

  const usedMultipleTimes = [...stepUsageCounts.values()].filter((count) => count >= 2).length;
  const reuseRate = definitions.length > 0 ? (usedMultipleTimes / definitions.length) * 100 : 0;

  const potentialDuplicates = findPotentialDuplicates(definitions);

  return {
    generatedAt: new Date().toISOString(),
    totalDefinitions: definitions.length,
    totalUsages: usages.length,
    usedDefinitions: definitions.length - unusedDefinitions.length,
    unusedDefinitions,
    reuseRate,
    stepUsageCounts,
    potentialDuplicates,
    unmatchedSteps,
  };
}

function formatMarkdownReport(report: StepCoverageReport): string {
  let md = `# Step Definition Coverage Report\n\n`;
  md += `**Generated**: ${report.generatedAt}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Step Definitions | ${report.totalDefinitions} |\n`;
  md += `| Total Step Usages | ${report.totalUsages} |\n`;
  md += `| Used Definitions | ${report.usedDefinitions} |\n`;
  md += `| Unused Definitions | ${report.unusedDefinitions.length} |\n`;
  md += `| Reuse Rate (2+ uses) | ${report.reuseRate.toFixed(1)}% |\n`;
  md += `| Unmatched Steps | ${report.unmatchedSteps.length} |\n`;
  md += `| Potential Duplicates | ${report.potentialDuplicates.length} |\n\n`;

  const status = report.reuseRate >= 60 ? '✅ Good' : '⚠️ Needs Improvement';
  md += `**Step Reuse Status**: ${status}\n\n`;

  md += `## Most Used Steps (Top 10)\n\n`;
  const sortedSteps = [...report.stepUsageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  md += `| Step Pattern | Usage Count |\n`;
  md += `|--------------|-------------|\n`;
  for (const [pattern, count] of sortedSteps) {
    md += `| \`${pattern}\` | ${count} |\n`;
  }
  md += `\n`;

  if (report.unusedDefinitions.length > 0) {
    md += `## Unused Step Definitions (${report.unusedDefinitions.length})\n\n`;
    for (const def of report.unusedDefinitions.slice(0, 20)) {
      md += `- \`${def.pattern}\` in \`${def.file}:${def.line}\`\n`;
    }
    if (report.unusedDefinitions.length > 20) {
      md += `\n_...and ${report.unusedDefinitions.length - 20} more_\n`;
    }
    md += `\n`;
  }

  if (report.potentialDuplicates.length > 0) {
    md += `## Potential Duplicate Steps (${report.potentialDuplicates.length})\n\n`;
    for (const dup of report.potentialDuplicates.slice(0, 10)) {
      md += `- **Similarity: ${(dup.similarity * 100).toFixed(0)}%**\n`;
      for (const pattern of dup.patterns) {
        md += `  - \`${pattern}\`\n`;
      }
    }
    md += `\n`;
  }

  if (report.unmatchedSteps.length > 0) {
    md += `## Unmatched Steps (${report.unmatchedSteps.length})\n\n`;
    for (const step of report.unmatchedSteps.slice(0, 20)) {
      md += `- \`${step.type} ${step.text}\` in \`${step.file}:${step.line}\`\n`;
    }
    if (report.unmatchedSteps.length > 20) {
      md += `\n_...and ${report.unmatchedSteps.length - 20} more_\n`;
    }
    md += `\n`;
  }

  md += `## Recommendations\n\n`;
  if (report.unusedDefinitions.length > 0) {
    md += `1. **Remove unused step definitions** - ${report.unusedDefinitions.length} steps are never used\n`;
  }
  if (report.potentialDuplicates.length > 0) {
    md += `2. **Consolidate duplicate steps** - ${report.potentialDuplicates.length} potential duplicates found\n`;
  }
  if (report.unmatchedSteps.length > 0) {
    md += `3. **Implement missing steps** - ${report.unmatchedSteps.length} steps have no definition\n`;
  }
  if (report.reuseRate < 60) {
    md += `4. **Improve step reuse** - Current rate ${report.reuseRate.toFixed(1)}% is below 60% target\n`;
  }

  return md;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const featuresDir = process.argv[2] || './features';
  const stepsDir = process.argv[3] || './src/tests/steps';
  const outputFile = 'step-coverage-report.md';

  console.log(`🔍 Searching for feature files in: ${featuresDir}`);
  const featureFiles = findFiles(featuresDir, '.feature');
  console.log(`✅ Found ${featureFiles.length} feature files`);

  console.log(`🔍 Searching for step definition files in: ${stepsDir}`);
  const stepFiles = findFiles(stepsDir, '.ts');
  console.log(`✅ Found ${stepFiles.length} step definition files`);

  console.log(`📊 Extracting step definitions...`);
  const definitions: StepDefinition[] = [];
  for (const file of stepFiles) {
    definitions.push(...extractStepDefinitions(file));
  }
  console.log(`✅ Found ${definitions.length} step definitions`);

  console.log(`📊 Extracting step usages...`);
  const usages: StepUsage[] = [];
  for (const file of featureFiles) {
    usages.push(...extractStepUsages(file));
  }
  console.log(`✅ Found ${usages.length} step usages`);

  console.log(`📊 Analyzing coverage...`);
  const report = generateCoverageReport(definitions, usages);

  const markdown = formatMarkdownReport(report);
  fs.writeFileSync(outputFile, markdown);

  console.log(`\n📝 Report generated: ${outputFile}`);
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Reuse Rate: ${report.reuseRate.toFixed(1)}%`);
  console.log(`Unused Steps: ${report.unusedDefinitions.length}`);
  console.log(`${'─'.repeat(50)}`);
}

if (require.main === module) {
  main();
}

export { extractStepDefinitions, extractStepUsages, generateCoverageReport };
