# 🎯 Unified Code Quality Standards Framework

## 📋 Overview

This document defines the unified code quality standards for all repositories in the Miyabi ecosystem, ensuring consistency, maintainability, and professional excellence across all projects.

## 🚀 Quick Standards Summary

### Essential Tools
- **ESLint**: TypeScript/JavaScript linting with strict rules
- **Prettier**: Code formatting (integrated via ESLint)
- **TypeScript**: Strict mode with comprehensive type checking
- **Vitest**: Testing framework with coverage reporting
- **Conventional Commits**: Standardized commit message format

### Quality Gates
- ✅ ESLint passing (0 errors, warnings acceptable)
- ✅ TypeScript compilation successful
- ✅ Test coverage ≥80%
- ✅ Conventional commit format
- ✅ No security vulnerabilities

---

## 📐 ESLint Configuration Standard

### Core ESLint Rules
All repositories MUST use the following base configuration:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn"
  }
}
```

### Naming Conventions
- **Variables**: `camelCase`, `UPPER_CASE` (constants), `PascalCase` (constructors)
- **Functions**: `camelCase`, `PascalCase` (constructors)
- **Types/Interfaces**: `PascalCase` (no `I` prefix)
- **Files**: `kebab-case.ts`, `PascalCase.tsx` (components)
- **Directories**: `kebab-case`

### Code Complexity Limits
- **Max line length**: 120 characters
- **Max function length**: 150 lines
- **Max file length**: 500 lines
- **Max function parameters**: 5
- **Max cognitive complexity**: 15

---

## 🎨 Code Style Standards

### TypeScript Strict Mode
All projects MUST use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Import/Export Style
- **Prefer**: `import type { Type } from './module'`
- **Use**: Consistent import ordering (external → internal → relative)
- **Avoid**: Default exports (prefer named exports)

### Error Handling
- **Required**: Explicit error handling for async operations
- **Pattern**: Use Result types or proper try/catch
- **Forbidden**: Silent error swallowing

---

## 📝 Commit Message Standards

### Conventional Commits Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth2 integration` |
| `fix` | Bug fix | `fix(api): resolve memory leak in processor` |
| `docs` | Documentation | `docs: update API reference` |
| `style` | Code style | `style: fix ESLint warnings` |
| `refactor` | Code refactoring | `refactor(core): simplify event handling` |
| `test` | Add/fix tests | `test(utils): add validation tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Performance | `perf(db): optimize query execution` |
| `ci` | CI/CD changes | `ci: add automated testing` |

### Scope Guidelines
- **auth**: Authentication/authorization
- **api**: API-related changes
- **core**: Core functionality
- **ui**: User interface
- **docs**: Documentation
- **test**: Testing
- **ci**: CI/CD pipeline

---

## 🧪 Testing Standards

### Coverage Requirements
- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 95% coverage

### Test Structure
```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle normal case', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle edge cases', () => {
    // Edge case testing
  });

  it('should handle error conditions', () => {
    // Error handling testing
  });
});
```

### Test File Naming
- Unit tests: `filename.test.ts`
- Integration tests: `filename.integration.test.ts`
- E2E tests: `filename.e2e.test.ts`

---

## 📦 Package.json Scripts Standard

Every repository MUST include these scripts:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "verify": "npm run lint && npm run typecheck && npm run test",
    "clean": "rm -rf dist node_modules/.cache"
  }
}
```

---

## 📁 Project Structure Standard

### TypeScript Projects
```
project/
├── src/
│   ├── components/     # React components (PascalCase.tsx)
│   ├── hooks/          # Custom hooks (useCamelCase.ts)
│   ├── utils/          # Utilities (kebab-case.ts)
│   ├── types/          # Type definitions (PascalCase.ts)
│   ├── constants/      # Constants (SCREAMING_SNAKE.ts)
│   └── index.ts        # Main entry point
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
├── docs/              # Documentation
├── .github/           # GitHub workflows
├── .eslintrc.json     # ESLint config
├── tsconfig.json      # TypeScript config
├── vitest.config.ts   # Test config
└── package.json       # Package configuration
```

### File Naming Conventions
- **TypeScript**: `kebab-case.ts`
- **React Components**: `PascalCase.tsx`
- **Test files**: `filename.test.ts`
- **Type definitions**: `PascalCase.types.ts`
- **Constants**: `SCREAMING_SNAKE_CASE.ts`

---

## 🔒 Security Standards

### Required Security Checks
- **Dependency scanning**: `npm audit`
- **Secret scanning**: No hardcoded secrets
- **Type safety**: Strict TypeScript mode
- **Input validation**: All external inputs validated

### Forbidden Patterns
- `eval()` usage
- `innerHTML` without sanitization
- Hardcoded credentials
- `any` type (use `unknown` instead)

---

## 📊 Quality Metrics & CI/CD

### Required CI/CD Checks
1. **Lint Check**: `npm run lint`
2. **Type Check**: `npm run typecheck`
3. **Test Suite**: `npm run test`
4. **Coverage**: Minimum 80%
5. **Build**: `npm run build`
6. **Security**: `npm audit`

### GitHub Actions Workflow Template
```yaml
name: Quality Gate
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run verify
      - run: npm run test:coverage
```

---

## 🎯 Implementation Checklist

### For All Repositories
- [ ] ESLint configuration applied
- [ ] TypeScript strict mode enabled
- [ ] Package.json scripts standardized
- [ ] Testing framework configured
- [ ] CI/CD pipeline implemented
- [ ] Security checks enabled
- [ ] Documentation updated

### Quality Gates
- [ ] All tests passing
- [ ] 80%+ test coverage
- [ ] 0 ESLint errors
- [ ] TypeScript compilation successful
- [ ] No security vulnerabilities
- [ ] Conventional commit format

---

## 🔄 Adoption Strategy

### Phase 1: Core Projects (Week 1)
- ✅ Miyabi Framework (Already implemented)
- 🔄 Miyabi_AI_Agent (In progress)

### Phase 2: Supporting Projects (Week 2)
- miyabi-mcp-bundle
- a2a protocol
- PPAL

### Phase 3: All Repositories (Week 3)
- Apply standards to remaining repositories
- Create automated tooling for compliance

---

## 📚 References

- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

---

**Quality is not an act, it is a habit.** *- Aristotle*

*Generated by Miyabi Code Quality Standards Framework*