---
name: Code Quality & Review Workflow
description: Comprehensive code quality analysis, automated review, and best practices enforcement. Use for code review, quality assurance, refactoring guidance, and maintaining code standards across the Miyabi ecosystem.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🔍 Code Quality & Review Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: コード品質保証と自動レビュー

---

## 📋 概要

Miyabiエコシステムの包括的コード品質管理ワークフロー。
自動レビュー、品質メトリクス、リファクタリング支援、コーディング標準の統一を管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| コードレビュー | "review code", "check code quality", "analyze code" |
| 品質チェック | "quality check", "lint code", "check standards" |
| リファクタリング | "refactor", "improve code", "optimize code" |
| セキュリティ監査 | "security audit", "vulnerability scan" |
| パフォーマンス分析 | "performance analysis", "optimize performance" |
| PR レビュー | "pr review", "pull request review", "code review" |

---

## 🔧 P1: 品質管理ツール構成

### プロジェクト別品質ツール

| Project | Language | Linter | Formatter | Type Checker | Security | Coverage |
|---------|----------|--------|-----------|-------------|----------|----------|
| **Miyabi Private** | TypeScript | ESLint | Prettier | TypeScript | SonarJS | Jest |
| **MCP Bundle** | TypeScript | ESLint | Prettier | TypeScript | ESLint Security | Vitest |
| **Gen-Studio** | TypeScript/Rust | ESLint/Clippy | Prettier/rustfmt | TypeScript | cargo-audit | Vitest/cargo-tarpaulin |
| **AI Course SaaS** | TypeScript | ESLint | Prettier | TypeScript | SonarJS | Jest |
| **Rust Crates** | Rust | Clippy | rustfmt | rustc | cargo-audit | cargo-tarpaulin |

### 品質ツールコマンド統一

```bash
# 共通品質チェックコマンド
npm run quality:check      # 全品質チェック実行
npm run quality:lint       # リント実行
npm run quality:format     # フォーマット実行
npm run quality:types      # 型チェック
npm run quality:security   # セキュリティ監査
npm run quality:coverage   # カバレッジ計測

# Rust専用
cargo clippy              # Rustリント
cargo fmt                 # Rustフォーマット
cargo audit               # セキュリティ監査
```

---

## 🚀 P2: 品質チェックパターン

### Pattern 1: 統合品質チェック

```bash
# 完全品質チェックフロー（5-15分）
function quality_full_check() {
    local project_path=${1:-.}

    echo "🔍 Starting full quality check for: $(basename $project_path)"

    cd "$project_path"

    # 1. TypeScript/JavaScript projects
    if [ -f "package.json" ]; then
        echo "📦 Running Node.js quality checks..."

        # 型チェック
        npm run type-check || echo "❌ Type check failed"

        # リント
        npm run lint || echo "❌ Lint failed"

        # フォーマットチェック
        npm run format:check || echo "❌ Format check failed"

        # セキュリティ監査
        npm audit || echo "⚠️ Security vulnerabilities found"

        # テストカバレッジ
        npm run test:coverage || echo "❌ Test coverage failed"
    fi

    # 2. Rust projects
    if [ -f "Cargo.toml" ]; then
        echo "🦀 Running Rust quality checks..."

        # ビルド
        cargo build || echo "❌ Build failed"

        # テスト
        cargo test || echo "❌ Tests failed"

        # Clippy
        cargo clippy -- -D warnings || echo "❌ Clippy warnings found"

        # フォーマット
        cargo fmt --check || echo "❌ Format check failed"

        # セキュリティ監査
        cargo audit || echo "⚠️ Security vulnerabilities found"

        # カバレッジ
        cargo tarpaulin --out Stdout || echo "❌ Coverage failed"
    fi

    echo "✅ Quality check completed"
}
```

### Pattern 2: AI支援コードレビュー

```typescript
// scripts/ai-code-reviewer.ts
export class AICodeReviewer {
  private geminiService: GeminiService

  constructor() {
    this.geminiService = new GeminiService('gemini-2.0-flash-exp')
  }

  async reviewFile(filePath: string): Promise<ReviewResult> {
    const content = await fs.readFile(filePath, 'utf-8')
    const fileExtension = path.extname(filePath)

    const prompt = this.buildReviewPrompt(content, fileExtension)
    const review = await this.geminiService.generateContent(prompt)

    return this.parseReviewResult(review.content, filePath)
  }

  private buildReviewPrompt(code: string, extension: string): string {
    const language = this.getLanguageFromExtension(extension)

    return `
Please review the following ${language} code for:

1. **Code Quality Issues:**
   - Naming conventions
   - Function/class structure
   - Code complexity
   - Readability and maintainability

2. **Security Issues:**
   - Potential vulnerabilities
   - Input validation
   - Authentication/authorization
   - Data exposure

3. **Performance Issues:**
   - Inefficient algorithms
   - Memory leaks
   - Unnecessary computations
   - Database query optimization

4. **Best Practices:**
   - Language-specific idioms
   - Error handling
   - Documentation
   - Testing considerations

5. **Refactoring Suggestions:**
   - Code duplication
   - Single responsibility principle
   - Design patterns application

Code to review:
\`\`\`${language}
${code}
\`\`\`

Please provide specific, actionable feedback with:
- Issue location (line numbers)
- Severity level (low/medium/high)
- Detailed explanation
- Suggested improvements
- Code examples where helpful

Format your response as structured feedback.
    `
  }

  private parseReviewResult(aiResponse: string, filePath: string): ReviewResult {
    // AI応答を構造化データに変換
    const issues: CodeIssue[] = []

    // 基本的なパースロジック（実装詳細は省略）
    const lines = aiResponse.split('\n')
    let currentIssue: Partial<CodeIssue> = {}

    lines.forEach((line, index) => {
      if (line.includes('Line')) {
        currentIssue.line = this.extractLineNumber(line)
      } else if (line.includes('Severity:')) {
        currentIssue.severity = this.extractSeverity(line) as 'low' | 'medium' | 'high'
      } else if (line.includes('Issue:')) {
        currentIssue.description = line.replace('Issue:', '').trim()
      } else if (line.includes('Suggestion:')) {
        currentIssue.suggestion = line.replace('Suggestion:', '').trim()

        if (currentIssue.line && currentIssue.severity && currentIssue.description) {
          issues.push({
            file: filePath,
            line: currentIssue.line,
            severity: currentIssue.severity,
            category: 'code_quality',
            description: currentIssue.description,
            suggestion: currentIssue.suggestion
          })
          currentIssue = {}
        }
      }
    })

    return {
      file: filePath,
      issues,
      overallScore: this.calculateScore(issues),
      summary: this.generateSummary(issues)
    }
  }

  private calculateScore(issues: CodeIssue[]): number {
    let score = 100

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 10
          break
        case 'medium':
          score -= 5
          break
        case 'low':
          score -= 2
          break
      }
    })

    return Math.max(0, score)
  }
}
```

### Pattern 3: 自動リファクタリング

```typescript
// scripts/auto-refactoring.ts
export class AutoRefactoring {
  async refactorFile(filePath: string): Promise<RefactoringResult> {
    const content = await fs.readFile(filePath, 'utf-8')
    const ast = this.parseAST(content, filePath)

    const refactorings: Refactoring[] = []

    // 1. 長い関数の分割
    refactorings.push(...this.splitLongFunctions(ast))

    // 2. 重複コードの抽出
    refactorings.push(...this.extractDuplicateCode(ast))

    // 3. 複雑な条件式の簡素化
    refactorings.push(...this.simplifyComplexConditions(ast))

    // 4. 名前の改善
    refactorings.push(...this.improveNaming(ast))

    // 5. 型安全性の向上
    refactorings.push(...this.improveTypeSafety(ast))

    return {
      originalFile: filePath,
      refactorings,
      estimatedImpact: this.calculateImpact(refactorings),
      preview: this.generatePreview(content, refactorings)
    }
  }

  private splitLongFunctions(ast: any): Refactoring[] {
    const refactorings: Refactoring[] = []

    // 長すぎる関数を特定
    const longFunctions = this.findLongFunctions(ast, 50) // 50行以上

    longFunctions.forEach(func => {
      const suggestions = this.suggestFunctionSplit(func)

      refactorings.push({
        type: 'split_function',
        target: func.name,
        line: func.line,
        description: `Function '${func.name}' is ${func.length} lines long. Consider splitting into smaller functions.`,
        suggestions: suggestions.map(s => ({
          action: 'create_function',
          name: s.name,
          parameters: s.parameters,
          body: s.body
        }))
      })
    })

    return refactorings
  }

  private extractDuplicateCode(ast: any): Refactoring[] {
    const refactorings: Refactoring[] = []
    const duplicates = this.findCodeDuplication(ast, 5) // 5行以上の重複

    duplicates.forEach(duplicate => {
      refactorings.push({
        type: 'extract_function',
        target: 'duplicate_code',
        line: duplicate.locations[0].line,
        description: `Found duplicate code in ${duplicate.locations.length} locations`,
        suggestions: [{
          action: 'create_function',
          name: `extracted_${duplicate.hash.substring(0, 8)}`,
          parameters: duplicate.commonParameters,
          body: duplicate.code,
          replaceLocations: duplicate.locations
        }]
      })
    })

    return refactorings
  }
}
```

### Pattern 4: セキュリティ監査

```bash
# セキュリティ監査フロー
function security_audit() {
    local project_path=${1:-.}

    echo "🔒 Starting security audit for: $(basename $project_path)"

    cd "$project_path"

    # 1. 依存関係の脆弱性チェック
    if [ -f "package.json" ]; then
        echo "📦 Checking npm vulnerabilities..."
        npm audit --audit-level moderate

        # 高度な脆弱性スキャン
        npx retire --path .

        # OWASP dependency check
        npx @cyclonedx/bom
    fi

    # 2. Rust依存関係チェック
    if [ -f "Cargo.toml" ]; then
        echo "🦀 Checking Rust vulnerabilities..."
        cargo audit
    fi

    # 3. シークレットスキャン
    echo "🔍 Scanning for exposed secrets..."
    git log --all --grep="password\|secret\|key" --oneline || echo "No suspicious commits found"

    # 高度なシークレットスキャン
    if command -v truffleHog &> /dev/null; then
        truffleHog --regex .
    fi

    # 4. 静的解析
    if [ -f "package.json" ]; then
        echo "🔬 Static analysis..."
        npx eslint . --ext .ts,.tsx,.js,.jsx --config .eslintrc.security.js 2>/dev/null || echo "No security ESLint config found"
    fi

    # 5. Docker セキュリティ (if applicable)
    if [ -f "Dockerfile" ]; then
        echo "🐳 Docker security check..."
        if command -v hadolint &> /dev/null; then
            hadolint Dockerfile
        fi
    fi

    echo "✅ Security audit completed"
}
```

### Pattern 5: 品質メトリクス収集

```typescript
// scripts/quality-metrics.ts
export class QualityMetricsCollector {
  async collectMetrics(projectPath: string): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      codebase: await this.analyzeCodebase(projectPath),
      complexity: await this.calculateComplexity(projectPath),
      coverage: await this.getCoverage(projectPath),
      dependencies: await this.analyzeDependencies(projectPath),
      security: await this.getSecurityScore(projectPath),
      performance: await this.getPerformanceMetrics(projectPath),
      maintainability: await this.getMaintainabilityIndex(projectPath)
    }

    return metrics
  }

  private async analyzeCodebase(projectPath: string) {
    const files = await glob('**/*.{ts,tsx,js,jsx,rs}', { cwd: projectPath })

    let totalLines = 0
    let codeLines = 0
    let commentLines = 0

    for (const file of files) {
      const content = await fs.readFile(path.join(projectPath, file), 'utf-8')
      const analysis = this.analyzeFile(content)

      totalLines += analysis.totalLines
      codeLines += analysis.codeLines
      commentLines += analysis.commentLines
    }

    return {
      files: files.length,
      totalLines,
      codeLines,
      commentLines,
      commentRatio: commentLines / codeLines,
      languages: this.detectLanguages(files)
    }
  }

  private async calculateComplexity(projectPath: string) {
    const tsFiles = await glob('**/*.{ts,tsx}', { cwd: projectPath })
    const complexities: number[] = []

    for (const file of tsFiles) {
      const filePath = path.join(projectPath, file)
      const complexity = await this.getCyclomaticComplexity(filePath)
      complexities.push(complexity)
    }

    return {
      average: complexities.reduce((a, b) => a + b, 0) / complexities.length,
      max: Math.max(...complexities),
      distribution: this.createDistribution(complexities)
    }
  }

  private async getCoverage(projectPath: string) {
    try {
      // Jest/Vitest カバレッジデータ読み込み
      const coveragePath = path.join(projectPath, 'coverage/coverage-summary.json')
      const coverageData = await fs.readJSON(coveragePath)

      return {
        lines: coverageData.total.lines.pct,
        branches: coverageData.total.branches.pct,
        functions: coverageData.total.functions.pct,
        statements: coverageData.total.statements.pct
      }
    } catch {
      return null
    }
  }

  private async getMaintainabilityIndex(projectPath: string): Promise<number> {
    // Maintainability Index = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
    // V: Halstead Volume, G: Cyclomatic Complexity, LOC: Lines of Code

    const files = await glob('**/*.{ts,tsx}', { cwd: projectPath })
    const indices: number[] = []

    for (const file of files) {
      const filePath = path.join(projectPath, file)
      const volume = await this.getHalsteadVolume(filePath)
      const complexity = await this.getCyclomaticComplexity(filePath)
      const loc = await this.getLinesOfCode(filePath)

      if (volume > 0 && complexity > 0 && loc > 0) {
        const mi = 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(loc)
        indices.push(Math.max(0, mi))
      }
    }

    return indices.reduce((a, b) => a + b, 0) / indices.length
  }
}
```

---

## ⚡ P3: 高度な品質管理

### 品質ゲート設定

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate
on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Quality Gate Checks
        run: |
          # 1. 型チェック (Required)
          npm run type-check || exit 1

          # 2. リント (Required)
          npm run lint || exit 1

          # 3. テスト (Required)
          npm run test || exit 1

          # 4. カバレッジ閾値チェック (Required: >80%)
          npm run test:coverage
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "Coverage $coverage% below threshold 80%"
            exit 1
          fi

          # 5. セキュリティ監査 (Warning)
          npm audit --audit-level high || echo "Security warnings found"

          # 6. 複雑度チェック (Warning)
          npm run complexity:check || echo "Complexity warnings found"

      - name: Code Quality Report
        run: npm run quality:report

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('quality-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### 品質ダッシュボード

```typescript
// scripts/quality-dashboard.ts
export class QualityDashboard {
  async generateDashboard(projects: string[]): Promise<string> {
    const dashboardData = await this.collectAllMetrics(projects)

    return this.renderDashboard(dashboardData)
  }

  private renderDashboard(data: DashboardData): string {
    return `
# 🎯 Miyabi Code Quality Dashboard

**Generated**: ${new Date().toISOString()}
**Projects**: ${data.projects.length}

## 📊 Overall Metrics

| Metric | Score | Target | Status |
|--------|-------|--------|---------|
| **Overall Quality** | ${data.overallScore}% | >85% | ${data.overallScore > 85 ? '✅' : '❌'} |
| **Test Coverage** | ${data.coverage}% | >80% | ${data.coverage > 80 ? '✅' : '❌'} |
| **Security Score** | ${data.securityScore}% | >90% | ${data.securityScore > 90 ? '✅' : '❌'} |
| **Maintainability** | ${data.maintainability}% | >75% | ${data.maintainability > 75 ? '✅' : '❌'} |

## 📈 Trend Analysis

${this.renderTrends(data.trends)}

## 🚨 Top Issues

${this.renderTopIssues(data.issues)}

## 📁 Project Breakdown

${data.projects.map(p => this.renderProjectSummary(p)).join('\n')}

---
*Dashboard generated by Miyabi Quality System*
    `
  }

  private renderProjectSummary(project: ProjectMetrics): string {
    return `
### ${project.name}

| Metric | Value | Status |
|--------|--------|---------|
| Lines of Code | ${project.loc.toLocaleString()} | - |
| Complexity | ${project.complexity} | ${project.complexity < 10 ? '✅' : '⚠️'} |
| Coverage | ${project.coverage}% | ${project.coverage > 80 ? '✅' : '❌'} |
| Security Issues | ${project.securityIssues} | ${project.securityIssues === 0 ? '✅' : '⚠️'} |
| Last Updated | ${project.lastUpdated} | - |
    `
  }
}
```

---

## 🛡️ 継続的品質改善

### 品質トラッキング

```bash
# scripts/quality-tracking.sh
function track_quality_metrics() {
    local timestamp=$(date +%s)
    local project=$(basename $(pwd))

    echo "📊 Tracking quality metrics for: $project"

    # メトリクス収集
    local metrics_file=".quality/metrics-$timestamp.json"
    mkdir -p .quality

    # 基本メトリクス
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"project\": \"$project\","
        echo "  \"commit\": \"$(git rev-parse HEAD)\","
        echo "  \"branch\": \"$(git branch --show-current)\","

        # コード行数
        local loc=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1 | awk '{print $1}')
        echo "  \"loc\": $loc,"

        # テストカバレッジ
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
            echo "  \"coverage\": $coverage,"
        fi

        # ESLint警告数
        local lint_warnings=$(npm run lint 2>&1 | grep -c "warning" || echo 0)
        echo "  \"lintWarnings\": $lint_warnings,"

        # TypeScript errors
        local ts_errors=$(npm run type-check 2>&1 | grep -c "error TS" || echo 0)
        echo "  \"typeErrors\": $ts_errors,"

        # 依存関係の脆弱性
        local vulnerabilities=$(npm audit --json 2>/dev/null | jq '.vulnerabilities | length' 2>/dev/null || echo 0)
        echo "  \"vulnerabilities\": $vulnerabilities"

        echo "}"
    } > "$metrics_file"

    # 履歴グラフ生成
    if command -v gnuplot &> /dev/null; then
        generate_quality_graphs
    fi

    echo "✅ Metrics tracked: $metrics_file"
}

function generate_quality_graphs() {
    local data_files=(.quality/metrics-*.json)

    # データ抽出
    {
        echo "# timestamp coverage lintWarnings typeErrors vulnerabilities"
        for file in "${data_files[@]}"; do
            local timestamp=$(jq -r '.timestamp' "$file")
            local coverage=$(jq -r '.coverage // 0' "$file")
            local warnings=$(jq -r '.lintWarnings // 0' "$file")
            local errors=$(jq -r '.typeErrors // 0' "$file")
            local vulns=$(jq -r '.vulnerabilities // 0' "$file")

            echo "$timestamp $coverage $warnings $errors $vulns"
        done
    } > .quality/metrics.dat

    # グラフ生成
    gnuplot << 'EOF'
set terminal png
set output '.quality/quality-trend.png'
set title 'Code Quality Trends'
set xlabel 'Time'
set ylabel 'Percentage / Count'
set xdata time
set timefmt "%Y-%m-%d"
plot '.quality/metrics.dat' using 1:2 with lines title 'Coverage %', \
     '.quality/metrics.dat' using 1:3 with lines title 'Lint Warnings', \
     '.quality/metrics.dat' using 1:4 with lines title 'Type Errors', \
     '.quality/metrics.dat' using 1:5 with lines title 'Vulnerabilities'
EOF
}
```

---

## ✅ 成功基準

| チェック項目 | 目標値 | 必須値 |
|-------------|--------|--------|
| **全体品質スコア** | >85% | >75% |
| **テストカバレッジ** | >80% | >70% |
| **セキュリティスコア** | >90% | >80% |
| **コード複雑度** | <10 | <15 |
| **維持可能性指数** | >75% | >60% |

### 出力フォーマット

```
🔍 Code Quality & Review Results

✅ Quality Score: XX% (target: >85%)
✅ Test Coverage: XX% (target: >80%)
✅ Security Score: XX% (target: >90%)
✅ Complexity: X.X (target: <10)
✅ Maintainability: XX% (target: >75%)
✅ Issues Found: XX (High: X, Medium: X, Low: X)

Code quality ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `.eslintrc.js` | ESLint設定 |
| `tsconfig.json` | TypeScript設定 |
| `quality-report.md` | 品質レポート |

---

## 📝 関連Skills

- **Testing Framework**: テスト品質管理
- **Security Audit**: セキュリティ監査統合
- **Git Workflow**: レビュー自動化
- **CI/CD Pipeline**: 品質ゲート統合
- **Performance Analysis**: パフォーマンス品質