# Turbo Essentials for Web Development

## Core Commands
```bash
# Run tasks across all packages
turbo run build
turbo run lint test check-types

# Target specific packages
turbo run build --filter="@repo/api"
turbo run dev --filter="./apps/*"

# Parallel execution (ignores dependencies)
turbo run lint --parallel

# Force rebuild (ignore cache)
turbo run build --force

# Watch mode
turbo watch dev
```

## Package Management
```bash
# Add dependencies to specific package
pnpm add react --filter="@repo/web"
pnpm add -D typescript --filter="@repo/api"

# Add to workspace root
pnpm add -D turbo -w

# Create new package
mkdir packages/new-lib
cd packages/new-lib && pnpm init
```

## Key turbo.json Patterns
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],           // Deps build first
      "outputs": ["dist/**", ".next/**"] // Cache these
    },
    "dev": {
      "cache": false,                    // Never cache
      "persistent": true                 // Long-running
    },
    "test": {
      "dependsOn": ["^build"],           // After deps build
      "inputs": ["src/**", "tests/**"]   // Cache key inputs
    },
    "lint": {
      "dependsOn": ["^lint"]             // Topological order
    }
  }
}
```

## Filtering Patterns
```bash
# Package patterns
--filter="@repo/api"              # Specific package
--filter="@repo/*"                # Scope
--filter="./apps/*"               # Directory glob

# Dependency patterns  
--filter="@repo/api..."           # Package + dependents
--filter="...@repo/api"           # Package + dependencies
--filter="@repo/api^..."          # Just dependents

# Git patterns
--filter="[HEAD^1]"               # Changed since last commit
--filter="[main]"                 # Changed vs main branch
```

## Essential Scripts (package.json)
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

## Task Dependencies
- `"dependsOn": ["^build"]` - Wait for deps to build first
- `"dependsOn": ["build"]` - Wait for own build first  
- `"dependsOn": ["^build", "codegen"]` - Multiple dependencies
- No dependsOn = runs immediately

## Caching Rules
- `"cache": false` - Never cache (dev servers, DB operations)
- `"persistent": true` - Long-running tasks (dev, watch)
- `"inputs": ["src/**"]` - Files that affect cache
- `"outputs": ["dist/**"]` - Generated files to cache

## Package Structure
```
packages/
├── ui/           # Shared components
├── utils/        # Shared utilities  
├── config/       # Shared configs
└── types/        # Shared types

apps/
├── web/          # Frontend app
├── api/          # Backend app
└── docs/         # Documentation
```

## Performance Tips
- Use `--parallel` for independent tasks (lint, test)
- Set proper `inputs` to optimize cache hits
- Use `--filter` to run subset of packages
- Configure `outputs` for build artifacts
- Use `workspace:*` for internal dependencies

## Environment Variables & .env Files
```json
// turbo.json
{
  "globalEnv": ["NODE_ENV", "DATABASE_URL"],     // Affects all tasks
  "globalPassThroughEnv": ["SECRET_KEY"],        // Available but no cache impact
  "envMode": "strict",                           // Only explicit vars (recommended)
  "globalDependencies": [".env"],                // Cache invalidation on .env changes
  "tasks": {
    "build": {
      "env": ["API_URL", "MY_API_*"],            // Task-specific env vars
      "passThroughEnv": ["AWS_SECRET"],          // Secret for this task only
      "inputs": [".env.production"]              // Include specific .env in cache
    }
  }
}
```

### .env File Patterns
```bash
# Root level (affects all packages)
.env                              # Shared config
.env.local                        # Local overrides (gitignored)

# Package level  
apps/web/.env.production          # App-specific
packages/config/.env.defaults     # Shared defaults

# Load with dotenv-cli for complex setups
pnpm add -D dotenv-cli -w
"dev": "dotenv -e .env.local -- turbo run dev"
```

### Env Best Practices
- Use `"envMode": "strict"` for security
- Put secrets in `passThroughEnv` (no cache impact)
- Add `.env` to `inputs` for cache invalidation
- Use wildcards: `"MY_API_*"` for grouped vars
- Keep `.env.local` in .gitignore

## Package Discovery
```bash
# List all packages with descriptions
pnpm packages                     # Custom detailed view with descriptions

# Built-in Turbo commands
pnpm turbo ls                     # Basic package list
pnpm turbo ls @repo/api           # Package details, dependencies, tasks
pnpm turbo ls --output json       # JSON format for scripting

# Package manager commands
pnpm list --recursive --depth=0   # All packages with versions
pnpm list --filter="@repo/*"      # Filter by scope
```

## Common Patterns
```bash
# Development workflow
turbo run dev                     # Start all dev servers
turbo run build --filter="[HEAD^1]"  # Build only changed

# CI/CD workflow  
turbo run lint test build         # Full validation
turbo run test --filter="[main]"  # Test only changed

# Package maintenance
turbo run clean                   # Clean all packages
turbo run build --filter="@repo/ui..."  # Build lib + consumers
```
