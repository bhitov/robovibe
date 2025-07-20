# Development Guide for Uber Template

This file contains information for developers and AI assistants working on this monorepo.

## 🛠️ Build & Development Commands

### Common Commands
```bash
# Development (starts all apps)
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test -- --run

# Type checking
pnpm check-types

# Linting
pnpm lint
pnpm lint:fix

# Database operations (API only)
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

### Package-specific Commands
```bash
# API (apps/api)
cd apps/api && pnpm dev          # Start API server on :3001
cd apps/api && pnpm test         # Run API tests
cd apps/api && pnpm build        # Build API

# Web (apps/web)
cd apps/web && pnpm dev          # Start web server on :3000
cd apps/web && pnpm test         # Run web tests
cd apps/web && pnpm build        # Build web app
```

## 📁 Project Structure

### Monorepo Layout
- `apps/api/` - Express.js backend with Drizzle ORM
- `apps/web/` - React frontend with Tailwind CSS 4
- `packages/eslint-config/` - Shared ESLint configurations
- `packages/typescript-config/` - Shared TypeScript configurations

### Key Files
- `turbo.json` - Turborepo configuration
- `pnpm-workspace.yaml` - pnpm workspaces configuration
- `apps/api/drizzle.config.ts` - Database configuration
- `apps/web/vite.config.ts` - Vite configuration

## 🗄️ Database (API)

### Schema Location
- Schema: `apps/api/src/db/schema.ts`
- Migrations: `apps/api/drizzle/`

### Workflow
1. Edit schema in `schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`

### Test Database
Tests automatically set up a fresh database with migrations in `apps/api/tests/setup.ts`.

## 🎨 Frontend Styling

### Tailwind CSS 4
- Config in `apps/web/src/style.css` using `@theme` directive
- Uses OKLCH color space
- Design tokens defined in CSS variables

### shadcn/ui Components
- Located in `apps/web/src/components/ui/`
- Use `cn()` utility for className merging
- Follow shadcn/ui patterns

## 🧪 Testing

### Backend Tests
- Use Vitest with Node environment
- Database setup in `tests/setup.ts`
- API testing with supertest

### Frontend Tests
- Use Vitest with jsdom environment
- React Testing Library for component tests
- Mock fetch calls for API interactions

## 📋 Code Standards

### ESLint Configurations
- `@repo/eslint-config/base` - Core TypeScript rules with type checking
- `@repo/eslint-config/node` - Backend rules with strict type checking
- `@repo/eslint-config/react-internal` - Frontend rules with type checking

All configurations use TypeScript ESLint with:
- Recommended type-checked rules
- Strict type-checked rules  
- Stylistic type-checked rules
- Project-aware parsing with tsconfig.json

### TypeScript
- Strict mode enabled
- Explicit function return types required (backend)
- Path aliases: `@/*` maps to `src/*` (frontend)

## 🚀 Adding New Features

### New API Endpoint
1. Create route in `apps/api/src/routes/`
2. Add to `apps/api/src/index.ts`
3. Add tests in `apps/api/tests/`

### New Frontend Component
1. Create in `apps/web/src/components/`
2. Add tests in `apps/web/tests/components/`
3. Export from appropriate index file

### New Package
1. Create in `apps/` or `packages/`
2. Add `package.json` with workspace dependencies
3. Configure in `turbo.json` if needed

## 🔧 Troubleshooting

### Common Issues
1. **better-sqlite3 build fails**: Run `pnpm rebuild better-sqlite3`
2. **Type errors**: Run `pnpm check-types` to identify issues
3. **Lint errors**: Run `pnpm lint:fix` to auto-fix issues
4. **Tests failing**: Check database setup in API tests

### Dependencies
- Use `workspace:*` for internal package dependencies
- Keep versions synchronized across packages
- Run `pnpm install` after adding dependencies

## 📦 Package Management

### Workspace Dependencies
```json
{
  "dependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  }
}
```

### Adding Dependencies
```bash
# Add to specific package
pnpm add <package> --filter @repo/api
pnpm add <package> --filter @repo/web

# Add to root (dev dependencies)
pnpm add -D <package> -w
```

This file should be updated as the project evolves to maintain accurate development information.
