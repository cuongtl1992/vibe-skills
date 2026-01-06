#!/usr/bin/env ts-node
/**
 * Detects flaky test patterns in Playwright test files.
 *
 * Usage:
 *   npx ts-node scripts/detect-flaky-patterns.ts [tests-dir]
 *
 * Default tests-dir: ./src/tests
 *
 * Output: flaky-patterns-report.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface FlakyPattern {
  name: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  pattern: RegExp;
  fix: string;
}

interface FlakyMatch {
  file: string;
  line: number;
  code: string;
  pattern: FlakyPattern;
}

interface FlakyReport {
  generatedAt: string;
  testsDir: string;
  totalFiles: number;
  totalMatches: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  matches: FlakyMatch[];
  filesSummary: Map<string, number>;
}

// ============================================================================
// Flaky Patterns
// ============================================================================

const FLAKY_PATTERNS: FlakyPattern[] = [
  {
    name: 'Fixed Timeout',
    severity: 'high',
    description: 'Using fixed timeout instead of waiting for specific condition',
    pattern: /page\.waitForTimeout\s*\(\s*\d+\s*\)/g,
    fix: 'Use page.waitForSelector(), page.waitForLoadState(), or expect().toBeVisible()',
  },
  {
    name: 'setTimeout Usage',
    severity: 'high',
    description: 'Using setTimeout for waiting',
    pattern: /setTimeout\s*\(/g,
    fix: 'Use Playwright built-in waiting mechanisms',
  },
  {
    name: 'sleep/delay Function',
    severity: 'high',
    description: 'Using custom sleep or delay functions',
    pattern: /await\s+(?:sleep|delay)\s*\(\s*\d+\s*\)/g,
    fix: 'Use explicit wait conditions instead of arbitrary delays',
  },
  {
    name: 'Text Selector',
    severity: 'medium',
    description: 'Using text-based selector that may break with i18n or text changes',
    pattern: /(?:page|locator)\.[a-z]+\s*\(\s*['"`]text=/gi,
    fix: 'Use data-testid attributes for stable element selection',
  },
  {
    name: 'has-text Selector',
    severity: 'medium',
    description: 'Using :has-text() selector that depends on display text',
    pattern: /:has-text\s*\(/g,
    fix: 'Use data-testid attributes instead of text content',
  },
  {
    name: 'Role with Name',
    severity: 'low',
    description: 'Using role selector with name that may change',
    pattern: /getByRole\s*\([^)]+name\s*:/g,
    fix: 'Consider using data-testid for more stable selection',
  },
  {
    name: 'CSS Class Selector',
    severity: 'medium',
    description: 'Using CSS class selector that may change with styling',
    pattern: /(?:page|locator)\.[a-z]+\s*\(\s*['"`]\.[a-z]/gi,
    fix: 'Use data-testid attributes instead of CSS classes',
  },
  {
    name: 'Nested Waits',
    severity: 'high',
    description: 'Multiple sequential wait calls',
    pattern: /waitFor\w+[^;]+;\s*await\s+.*waitFor/g,
    fix: 'Combine into single wait condition or use Promise.all()',
  },
  {
    name: 'Random Data',
    severity: 'medium',
    description: 'Using Math.random() which may cause non-deterministic results',
    pattern: /Math\.random\s*\(\s*\)/g,
    fix: 'Use seeded random or fixed test data',
  },
  {
    name: 'Date.now() Dependency',
    severity: 'medium',
    description: 'Using current time which may cause timing issues',
    pattern: /Date\.now\s*\(\s*\)/g,
    fix: 'Mock time or use fixed test dates',
  },
  {
    name: 'Force Click',
    severity: 'low',
    description: 'Using force:true may mask visibility issues',
    pattern: /\.click\s*\(\s*\{[^}]*force\s*:\s*true/g,
    fix: 'Ensure element is properly visible and clickable',
  },
  {
    name: 'No Await on Action',
    severity: 'high',
    description: 'Missing await on async Playwright action',
    pattern: /(?<!await\s+)page\.(?:click|fill|type|goto|waitFor)/g,
    fix: 'Add await before async Playwright actions',
  },
  {
    name: 'Hard-coded URL',
    severity: 'low',
    description: 'Hard-coded localhost URL that may differ in CI',
    pattern: /['"`]https?:\/\/localhost:\d+/g,
    fix: 'Use baseURL config or environment variables',
  },
  {
    name: 'Network Race Condition',
    severity: 'medium',
    description: 'Action without waiting for network to settle',
    pattern: /\.click\([^)]+\)\s*;\s*(?:const|let|var|await\s+expect)/g,
    fix: 'Add waitForLoadState or waitForResponse after navigation actions',
  },
];

// ============================================================================
// File Discovery
// ============================================================================

function findTestFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findTestFiles(fullPath));
    } else if (
      entry.name.endsWith('.spec.ts') ||
      entry.name.endsWith('.test.ts') ||
      entry.name.endsWith('.steps.ts')
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

// ============================================================================
// Pattern Detection
// ============================================================================

function detectPatternsInFile(filePath: string): FlakyMatch[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: FlakyMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    for (const pattern of FLAKY_PATTERNS) {
      // Reset regex state
      pattern.pattern.lastIndex = 0;

      if (pattern.pattern.test(line)) {
        matches.push({
          file: filePath,
          line: lineNumber,
          code: line.trim(),
          pattern,
        });
      }
    }
  }

  return matches;
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(matches: FlakyMatch[], testsDir: string, totalFiles: number): FlakyReport {
  const filesSummary = new Map<string, number>();

  for (const match of matches) {
    const current = filesSummary.get(match.file) || 0;
    filesSummary.set(match.file, current + 1);
  }

  return {
    generatedAt: new Date().toISOString(),
    testsDir,
    totalFiles,
    totalMatches: matches.length,
    highSeverity: matches.filter((m) => m.pattern.severity === 'high').length,
    mediumSeverity: matches.filter((m) => m.pattern.severity === 'medium').length,
    lowSeverity: matches.filter((m) => m.pattern.severity === 'low').length,
    matches,
    filesSummary,
  };
}

function formatMarkdownReport(report: FlakyReport): string {
  let md = `# Flaky Test Patterns Report\n\n`;
  md += `**Generated**: ${report.generatedAt}\n`;
  md += `**Tests Directory**: ${report.testsDir}\n\n`;

  // Summary
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Files Scanned | ${report.totalFiles} |\n`;
  md += `| Total Issues Found | ${report.totalMatches} |\n`;
  md += `| 🔴 High Severity | ${report.highSeverity} |\n`;
  md += `| 🟡 Medium Severity | ${report.mediumSeverity} |\n`;
  md += `| 🟢 Low Severity | ${report.lowSeverity} |\n\n`;

  // Status
  if (report.totalMatches === 0) {
    md += `✅ **No flaky patterns detected!**\n\n`;
  } else if (report.highSeverity > 0) {
    md += `🔴 **Action Required**: ${report.highSeverity} high severity issues found\n\n`;
  } else if (report.mediumSeverity > 0) {
    md += `🟡 **Review Recommended**: ${report.mediumSeverity} medium severity issues found\n\n`;
  } else {
    md += `🟢 **Minor Issues**: Only low severity patterns found\n\n`;
  }

  // Files with most issues
  if (report.filesSummary.size > 0) {
    md += `## Files with Most Issues\n\n`;
    md += `| File | Issues |\n`;
    md += `|------|--------|\n`;

    const sortedFiles = [...report.filesSummary.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    for (const [file, count] of sortedFiles) {
      md += `| \`${file}\` | ${count} |\n`;
    }
    md += `\n`;
  }

  // High severity issues
  const highMatches = report.matches.filter((m) => m.pattern.severity === 'high');
  if (highMatches.length > 0) {
    md += `## 🔴 High Severity Issues (${highMatches.length})\n\n`;

    for (const match of highMatches) {
      md += `### ${match.pattern.name}\n\n`;
      md += `- **File**: \`${match.file}:${match.line}\`\n`;
      md += `- **Code**: \`${match.code}\`\n`;
      md += `- **Problem**: ${match.pattern.description}\n`;
      md += `- **Fix**: ${match.pattern.fix}\n\n`;
    }
  }

  // Medium severity issues
  const mediumMatches = report.matches.filter((m) => m.pattern.severity === 'medium');
  if (mediumMatches.length > 0) {
    md += `## 🟡 Medium Severity Issues (${mediumMatches.length})\n\n`;

    for (const match of mediumMatches.slice(0, 20)) {
      md += `- **${match.pattern.name}** in \`${match.file}:${match.line}\`\n`;
      md += `  - Code: \`${match.code.substring(0, 80)}${match.code.length > 80 ? '...' : ''}\`\n`;
      md += `  - Fix: ${match.pattern.fix}\n`;
    }

    if (mediumMatches.length > 20) {
      md += `\n_...and ${mediumMatches.length - 20} more_\n`;
    }
    md += `\n`;
  }

  // Low severity issues
  const lowMatches = report.matches.filter((m) => m.pattern.severity === 'low');
  if (lowMatches.length > 0) {
    md += `## 🟢 Low Severity Issues (${lowMatches.length})\n\n`;

    for (const match of lowMatches.slice(0, 10)) {
      md += `- **${match.pattern.name}** in \`${match.file}:${match.line}\`\n`;
    }

    if (lowMatches.length > 10) {
      md += `\n_...and ${lowMatches.length - 10} more_\n`;
    }
    md += `\n`;
  }

  // Pattern reference
  md += `## Pattern Reference\n\n`;
  md += `| Pattern | Severity | Description |\n`;
  md += `|---------|----------|-------------|\n`;

  for (const pattern of FLAKY_PATTERNS) {
    const icon = pattern.severity === 'high' ? '🔴' : pattern.severity === 'medium' ? '🟡' : '🟢';
    md += `| ${icon} ${pattern.name} | ${pattern.severity} | ${pattern.description} |\n`;
  }
  md += `\n`;

  // Recommendations
  md += `## Recommendations\n\n`;
  md += `1. **Fix high severity issues first** - These cause most test failures\n`;
  md += `2. **Use data-testid attributes** - Add to components for stable selectors\n`;
  md += `3. **Replace waitForTimeout** - Use explicit wait conditions\n`;
  md += `4. **Add proper await** - Ensure all async actions are awaited\n`;
  md += `5. **Mock time-dependent code** - Use fixed dates in tests\n`;

  return md;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const testsDir = process.argv[2] || './src/tests';
  const outputFile = 'flaky-patterns-report.md';

  console.log(`🔍 Searching for test files in: ${testsDir}`);
  const testFiles = findTestFiles(testsDir);

  if (testFiles.length === 0) {
    console.error(`❌ No test files found in: ${testsDir}`);
    process.exit(1);
  }

  console.log(`✅ Found ${testFiles.length} test files`);

  console.log(`📊 Scanning for flaky patterns...`);
  const allMatches: FlakyMatch[] = [];

  for (const file of testFiles) {
    const matches = detectPatternsInFile(file);
    allMatches.push(...matches);
  }

  console.log(`✅ Found ${allMatches.length} potential issues`);

  const report = generateReport(allMatches, testsDir, testFiles.length);
  const markdown = formatMarkdownReport(report);

  fs.writeFileSync(outputFile, markdown);

  console.log(`\n📝 Report generated: ${outputFile}`);

  // Print summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`SUMMARY`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Files Scanned:      ${report.totalFiles}`);
  console.log(`Total Issues:       ${report.totalMatches}`);
  console.log(`🔴 High Severity:   ${report.highSeverity}`);
  console.log(`🟡 Medium Severity: ${report.mediumSeverity}`);
  console.log(`🟢 Low Severity:    ${report.lowSeverity}`);
  console.log(`${'─'.repeat(50)}`);

  // Exit with error if high severity issues found
  if (report.highSeverity > 0) {
    console.log(`\n⚠️  High severity issues found! Review and fix before merging.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { detectPatternsInFile, generateReport, FLAKY_PATTERNS };
