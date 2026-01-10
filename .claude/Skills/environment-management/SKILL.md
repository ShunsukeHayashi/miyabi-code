---
name: Environment Management Workflow
description: Comprehensive environment variable and configuration management across development, staging, and production environments. Use when setting up environments, managing secrets, or configuring deployment environments.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🌍 Environment Management Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: 環境変数と設定の統合管理

---

## 📋 概要

Miyabiエコシステムの環境管理ワークフロー。
開発・ステージング・本番環境の設定統一、シークレット管理、環境別設定を効率化します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| 環境設定 | "setup environment", "configure env vars" |
| 環境切り替え | "switch to production", "development mode" |
| シークレット管理 | "api keys", "secrets management", "credentials" |
| 設定ファイル | "config file", ".env setup", "environment config" |
| 環境エラー | "env error", "missing environment variable" |
| デプロイ設定 | "deployment config", "production setup" |

---

## 🔧 P1: 環境アーキテクチャ

### Miyabi Environment Structure

```
Environments/
├── development/             # ローカル開発環境
│   ├── .env.local
│   ├── .env.development
│   └── docker-compose.dev.yml
├── staging/                 # ステージング環境
│   ├── .env.staging
│   └── docker-compose.staging.yml
├── production/              # 本番環境
│   ├── .env.production
│   └── docker-compose.prod.yml
└── shared/                  # 共通設定
    ├── .env.example
    └── env-templates/
```

### プロジェクト別環境変数

| Project | Environment | Key Variables | Secrets |
|---------|-------------|---------------|---------|
| **Miyabi Private** | dev/staging/prod | DATABASE_URL, NEXTAUTH_URL | NEXTAUTH_SECRET, GITHUB_TOKEN |
| **MCP Bundle** | dev | GITHUB_TOKEN, MCP_PORT | GITHUB_PERSONAL_TOKEN |
| **Gen-Studio** | dev/prod | GEMINI_API_KEY, TAURI_PORT | TAURI_PRIVATE_KEY |
| **AI Course SaaS** | dev/staging/prod | DATABASE_URL, STRIPE_KEY | STRIPE_SECRET, SENTRY_DSN |
| **CCG** | dev/prod | GEMINI_API_KEY, ELECTRON_APP_ID | - |

### 環境テンプレート管理

```bash
# .env.example (マスターテンプレート)
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/miyabi_dev"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# AI Services
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX"
OPENAI_API_KEY="sk-XXXXXXXXXXXXXXXXXXXXXXXX"

# External Services
STRIPE_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXX"
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXXX"
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Development
NODE_ENV="development"
DEBUG="miyabi:*"
LOG_LEVEL="debug"
```

---

## 🚀 P2: 環境管理パターン

### Pattern 1: 開発環境セットアップ

```bash
# 開発環境初期化（2-5分）
function setup_dev_environment() {
    local project=$1

    echo "🌱 Setting up development environment for: $project"

    # 1. 環境変数テンプレート作成
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        echo "Created .env.local from template"
    fi

    # 2. プロジェクト固有設定
    case $project in
        "miyabi-private")
            echo "DATABASE_URL=postgresql://localhost:5432/miyabi_dev" >> .env.local
            echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
            ;;
        "gen-studio")
            echo "GEMINI_API_KEY=${GEMINI_API_KEY}" >> .env.local
            echo "TAURI_DEV_SERVER=http://localhost:5173" >> .env.local
            ;;
        "course-generator")
            echo "GEMINI_API_KEY=${GEMINI_API_KEY}" >> .env.local
            echo "ELECTRON_DEV_MODE=true" >> .env.local
            ;;
    esac

    # 3. 必須変数チェック
    npm run env:validate

    echo "✅ Development environment ready"
}
```

### Pattern 2: 環境変数バリデーション

```typescript
// scripts/validate-env.ts
interface EnvironmentSchema {
  [key: string]: {
    required: boolean
    type: 'string' | 'number' | 'boolean' | 'url'
    pattern?: RegExp
    description: string
  }
}

const ENVIRONMENT_SCHEMAS: Record<string, EnvironmentSchema> = {
  'miyabi-private': {
    DATABASE_URL: {
      required: true,
      type: 'url',
      pattern: /^postgresql:\/\//,
      description: 'PostgreSQL connection URL'
    },
    NEXTAUTH_SECRET: {
      required: true,
      type: 'string',
      pattern: /.{32,}/,
      description: 'NextAuth secret key (min 32 chars)'
    },
    GEMINI_API_KEY: {
      required: false,
      type: 'string',
      pattern: /^AIzaSy/,
      description: 'Gemini API key'
    }
  },
  'gen-studio': {
    GEMINI_API_KEY: {
      required: true,
      type: 'string',
      pattern: /^AIzaSy/,
      description: 'Gemini API key for content generation'
    },
    TAURI_PRIVATE_KEY: {
      required: false,
      type: 'string',
      description: 'Tauri code signing private key'
    }
  }
}

export class EnvironmentValidator {
  validate(projectName: string): ValidationResult {
    const schema = ENVIRONMENT_SCHEMAS[projectName]
    if (!schema) {
      throw new Error(`No schema found for project: ${projectName}`)
    }

    const errors: string[] = []
    const warnings: string[] = []

    for (const [key, config] of Object.entries(schema)) {
      const value = process.env[key]

      // 必須チェック
      if (config.required && !value) {
        errors.push(`Missing required environment variable: ${key}`)
        continue
      }

      // パターンチェック
      if (value && config.pattern && !config.pattern.test(value)) {
        errors.push(`Invalid format for ${key}: ${config.description}`)
        continue
      }

      // 型チェック
      if (value && !this.validateType(value, config.type)) {
        warnings.push(`Type mismatch for ${key}: expected ${config.type}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private validateType(value: string, type: string): boolean {
    switch (type) {
      case 'number':
        return !isNaN(Number(value))
      case 'boolean':
        return ['true', 'false', '1', '0'].includes(value.toLowerCase())
      case 'url':
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      default:
        return true
    }
  }
}
```

### Pattern 3: 環境別設定管理

```typescript
// src/config/environment.ts
export interface EnvironmentConfig {
  database: {
    url: string
    pool: { min: number; max: number }
    ssl: boolean
  }
  api: {
    baseUrl: string
    timeout: number
    rateLimit: number
  }
  auth: {
    provider: string
    secret: string
    sessionMaxAge: number
  }
  ai: {
    provider: 'gemini' | 'openai'
    apiKey: string
    model: string
  }
}

class ConfigManager {
  private config: EnvironmentConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): EnvironmentConfig {
    const env = process.env.NODE_ENV || 'development'

    const baseConfig: EnvironmentConfig = {
      database: {
        url: process.env.DATABASE_URL!,
        pool: { min: 2, max: 10 },
        ssl: env === 'production'
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.API_TIMEOUT || '10000'),
        rateLimit: parseInt(process.env.RATE_LIMIT || '100')
      },
      auth: {
        provider: process.env.AUTH_PROVIDER || 'github',
        secret: process.env.NEXTAUTH_SECRET!,
        sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400')
      },
      ai: {
        provider: (process.env.AI_PROVIDER as any) || 'gemini',
        apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY!,
        model: process.env.AI_MODEL || 'gemini-pro'
      }
    }

    // 環境別オーバーライド
    return this.applyEnvironmentOverrides(baseConfig, env)
  }

  private applyEnvironmentOverrides(
    config: EnvironmentConfig,
    env: string
  ): EnvironmentConfig {
    switch (env) {
      case 'production':
        return {
          ...config,
          database: {
            ...config.database,
            pool: { min: 5, max: 50 },
            ssl: true
          },
          api: {
            ...config.api,
            rateLimit: 1000
          }
        }
      case 'staging':
        return {
          ...config,
          database: {
            ...config.database,
            pool: { min: 3, max: 20 }
          }
        }
      default:
        return config
    }
  }
}

export const config = new ConfigManager()
```

### Pattern 4: シークレット管理

```bash
# scripts/secrets-manager.sh
#!/bin/bash

function manage_secrets() {
    local action=$1
    local environment=${2:-development}

    case $action in
        "encrypt")
            encrypt_secrets $environment
            ;;
        "decrypt")
            decrypt_secrets $environment
            ;;
        "rotate")
            rotate_secrets $environment
            ;;
        "sync")
            sync_secrets $environment
            ;;
    esac
}

function encrypt_secrets() {
    local env=$1
    local secrets_file=".env.$env"

    if [ -f "$secrets_file" ]; then
        gpg --symmetric --cipher-algo AES256 "$secrets_file"
        rm "$secrets_file"
        echo "✅ Secrets encrypted: $secrets_file.gpg"
    fi
}

function decrypt_secrets() {
    local env=$1
    local encrypted_file=".env.$env.gpg"

    if [ -f "$encrypted_file" ]; then
        gpg --decrypt "$encrypted_file" > ".env.$env"
        echo "✅ Secrets decrypted: .env.$env"
    fi
}

function rotate_secrets() {
    local env=$1
    echo "🔄 Rotating secrets for: $env"

    # API Key rotation
    case $env in
        "production")
            echo "Rotating production API keys..."
            # Production rotation logic
            ;;
        "staging")
            echo "Rotating staging API keys..."
            # Staging rotation logic
            ;;
    esac
}
```

### Pattern 5: Docker環境統合

```yaml
# docker-compose.override.yml (development)
version: '3.8'
services:
  miyabi-private:
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/miyabi_dev
      - NEXTAUTH_URL=http://localhost:3000
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=miyabi_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

```yaml
# docker-compose.prod.yml (production)
version: '3.8'
services:
  miyabi-private:
    image: miyabi/private:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## ⚡ P3: 高度な環境管理

### 環境変数の動的読み込み

```typescript
// src/utils/dynamicEnv.ts
export class DynamicEnvironment {
  private cache = new Map<string, any>()
  private watchers = new Map<string, FileSystemWatcher>()

  async loadEnvironment(projectPath: string) {
    const envFiles = await this.discoverEnvFiles(projectPath)

    for (const envFile of envFiles) {
      await this.loadEnvFile(envFile)
      this.watchEnvFile(envFile)
    }
  }

  private async discoverEnvFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      '.env.local',
      '.env.development',
      '.env.staging',
      '.env.production',
      '.env'
    ]

    const files: string[] = []
    for (const pattern of patterns) {
      const filePath = path.join(projectPath, pattern)
      if (await fs.pathExists(filePath)) {
        files.push(filePath)
      }
    }

    return files
  }

  private async loadEnvFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = dotenv.parse(content)

    // Validation
    this.validateEnvironmentVars(parsed)

    // Cache
    this.cache.set(filePath, parsed)

    // Apply to process.env
    Object.assign(process.env, parsed)
  }

  private watchEnvFile(filePath: string) {
    const watcher = fs.watch(filePath, async () => {
      console.log(`Environment file changed: ${filePath}`)
      await this.loadEnvFile(filePath)
      this.notifyChange(filePath)
    })

    this.watchers.set(filePath, watcher)
  }
}
```

### 環境同期ツール

```bash
# scripts/env-sync.sh
function sync_environments() {
    local source_env=$1
    local target_env=$2

    echo "🔄 Syncing environment: $source_env → $target_env"

    # 1. バックアップ作成
    if [ -f ".env.$target_env" ]; then
        cp ".env.$target_env" ".env.$target_env.backup.$(date +%s)"
    fi

    # 2. ベース環境から設定取得
    local base_vars=$(cat ".env.$source_env" | grep -v "^#" | grep "=" | cut -d'=' -f1)

    # 3. ターゲット環境固有の値を保持
    local target_overrides=()
    case $target_env in
        "production")
            target_overrides=("NODE_ENV" "DATABASE_URL" "NEXTAUTH_URL")
            ;;
        "staging")
            target_overrides=("NODE_ENV" "DATABASE_URL")
            ;;
    esac

    # 4. 同期実行
    {
        echo "# Auto-generated environment file"
        echo "# Source: $source_env"
        echo "# Generated: $(date)"
        echo ""

        # 基本設定をコピー
        cat ".env.$source_env" | while read line; do
            if [[ $line =~ ^[A-Z_].*= ]]; then
                var_name=$(echo "$line" | cut -d'=' -f1)
                if [[ ! " ${target_overrides[@]} " =~ " ${var_name} " ]]; then
                    echo "$line"
                fi
            else
                echo "$line"
            fi
        done

        # 環境固有の設定を追加
        echo ""
        echo "# Environment-specific overrides"
        for override in "${target_overrides[@]}"; do
            echo "${override}=# TODO: Set ${override} for ${target_env}"
        done
    } > ".env.$target_env.new"

    mv ".env.$target_env.new" ".env.$target_env"

    echo "✅ Environment synced successfully"
    echo "⚠️  Please review and update environment-specific values"
}
```

---

## 🛡️ セキュリティ管理

### シークレット検出

```typescript
// scripts/secret-scanner.ts
export class SecretScanner {
  private patterns = [
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'high'
    },
    {
      name: 'Generic API Key',
      pattern: /(?:api[_-]?key|secret[_-]?key)[\s]*[:=][\s]*['"][a-zA-Z0-9]{20,}['"]/gi,
      severity: 'high'
    },
    {
      name: 'JWT Token',
      pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
      severity: 'medium'
    },
    {
      name: 'Database URL',
      pattern: /(?:postgresql|mysql|mongodb):\/\/[^\s]+/gi,
      severity: 'high'
    }
  ]

  async scanDirectory(dirPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []
    const files = await this.getFilesToScan(dirPath)

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const fileIssues = this.scanContent(content, file)
      issues.push(...fileIssues)
    }

    return issues
  }

  private scanContent(content: string, filePath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = content.split('\n')

    lines.forEach((line, lineNumber) => {
      this.patterns.forEach(pattern => {
        const matches = line.match(pattern.pattern)
        if (matches) {
          issues.push({
            file: filePath,
            line: lineNumber + 1,
            type: pattern.name,
            severity: pattern.severity,
            content: line.trim(),
            recommendation: `Move ${pattern.name} to environment variables`
          })
        }
      })
    })

    return issues
  }
}
```

### アクセス制御

```bash
# scripts/env-access-control.sh
function setup_env_permissions() {
    local environment=$1

    echo "🔒 Setting up access control for: $environment"

    # 1. ファイル権限設定
    case $environment in
        "production")
            chmod 600 .env.production*
            chown root:deploy .env.production*
            ;;
        "staging")
            chmod 640 .env.staging*
            chown root:developers .env.staging*
            ;;
        "development")
            chmod 644 .env.local .env.development
            ;;
    esac

    # 2. Git ignore確認
    if ! grep -q "\.env\.production" .gitignore; then
        echo ".env.production*" >> .gitignore
        echo ".env.staging*" >> .gitignore
        echo ".env.local" >> .gitignore
    fi

    # 3. pre-commit hook設定
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# 環境変数ファイルのコミット防止
if git diff --cached --name-only | grep -q "\.env\.\(production\|staging\)"; then
    echo "❌ Production/staging environment files cannot be committed"
    exit 1
fi

# シークレットスキャン
npm run security:scan-secrets
EOF

    chmod +x .git/hooks/pre-commit

    echo "✅ Access control configured"
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **環境変数バリデーション** | 全必須変数存在 |
| **シークレット管理** | 機密情報の適切な保護 |
| **環境同期** | 開発/ステージング/本番の一貫性 |
| **アクセス制御** | 適切な権限設定 |
| **セキュリティスキャン** | シークレット流出ゼロ |

### 出力フォーマット

```
🌍 Environment Management Results

✅ Environment: development ✓
✅ Required Variables: XX/XX present
✅ Validation: All checks passed
✅ Security: No secrets detected in code
✅ Permissions: Correctly configured
✅ Sync Status: All environments aligned

Environment ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `.env.example` | 環境変数テンプレート |
| `docs/deployment/` | 環境別デプロイ手順 |
| `scripts/env-*.sh` | 環境管理スクリプト |

---

## 📝 関連Skills

- **Multi-Project Workspace**: 横断的環境管理
- **Database Management**: DB接続設定
- **AI/LLM Integration**: API設定管理
- **Mobile Development**: モバイル環境設定
- **CI/CD Pipeline**: デプロイ環境統合