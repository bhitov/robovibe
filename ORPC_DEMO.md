# 🚀 oRPC Contract-First Type Safety Demo

This demo shows **contract-first development** with oRPC - where you define the API contract once and both frontend and backend must conform to it.

## 🎯 What We Built

### Contract Package (`packages/api-contract/`)
- **Contract Definition**: Single source of truth for API procedures
- **Schemas**: Zod validation schemas for inputs/outputs
- **Types**: TypeScript types generated from schemas
- **Procedures**: oRPC procedure definitions with `.input()` and `.handler()`

### Backend (`apps/api/src/routes/orpc.ts`)
- **Implementation**: Actual business logic implementing the contract
- **Validation**: Automatic input validation via Zod schemas
- **Error Handling**: Standardized oRPC error responses
- **Database**: Drizzle ORM integration

### Frontend (`apps/web/src/`)
- **Client**: oRPC client with automatic type inference
- **Type Safety**: Frontend calls are validated against contract
- **Demo Page**: `pages/ORPCDemo.tsx` - Shows contract enforcement

## 🔥 Key Benefits Demonstrated

### 1. **Contract-First Development**
```typescript
// 📝 Contract defined once in @repo/api-contract
export const createUser = os
  .input(CreateUserSchema)  // ✅ Zod validation
  .handler(async ({ input }) => {
    // Implementation provided by server
    return {} as User
  })
```

### 2. **Automatic Type Safety**
```typescript
// 🎯 Frontend gets automatic types from contract
const result = await api.users.create({
  email: "user@example.com",  // ✅ Type-checked
  name: "John Doe",           // ✅ Required by contract
  // age: 25                  // ❌ Would cause TypeScript error
});
```

### 3. **Contract Enforcement**
- **Backend**: Must implement exactly what contract specifies
- **Frontend**: Can only call procedures that exist in contract
- **Changes**: Contract changes break both sides until fixed

## 🧪 How to Test

### 1. Start the servers:
```bash
# From root directory
pnpm dev
```

### 2. Visit the demo:
- **REST Demo**: http://localhost:3000/ (old approach)
- **oRPC Demo**: http://localhost:3000/orpc (contract-first approach)

### 3. Try these actions:
1. **Create users** - Notice contract validation
2. **Delete users** - See type-safe parameters
3. **Check Network tab** - oRPC requests to `/api/orpc`
4. **Modify contract** - Both frontend/backend break until fixed

## 🎯 Contract-First Examples

### ✅ What Works (Contract Enforced)
```typescript
// All these conform to the contract:
api.users.list()                           // → User[]
api.users.get({ id: 123 })                // → User  
api.users.create({ email: "...", name: "..." })  // → User
api.users.delete({ id: 123 })             // → { success: boolean, deletedUser: User }
```

### ❌ What Breaks (Contract Violations)
```typescript
// These would cause TypeScript errors:
api.users.get({ id: "invalid" })          // ❌ string not assignable to number
api.users.create({ name: "John" })        // ❌ email is required by contract
api.users.nonexistent()                   // ❌ Procedure doesn't exist in contract
```

## 🔧 Architecture

```
Contract Package (@repo/api-contract)
├── Procedure Definitions (os.input().handler())
├── Zod Schemas (validation)
├── TypeScript Types (inferred)
└── Router Structure (organization)
           ↓
    ┌─────────────┐        ┌─────────────┐
    │   Backend   │        │  Frontend   │
    │  (Server)   │        │  (Client)   │
    ├─────────────┤        ├─────────────┤
    │ Implements  │        │ Consumes    │
    │ Contract    │   ←→   │ Contract    │
    │ + Business  │        │ + UI Logic  │
    │ Logic       │        │             │
    └─────────────┘        └─────────────┘
```

## 🚀 Next Steps

1. **Add more entities** (Posts, Comments, etc.) to contract
2. **Add authentication** context to procedures  
3. **Add middleware** for logging, rate limiting
4. **Generate OpenAPI docs** from contract (oRPC feature)
5. **Remove REST endpoints** once oRPC is proven

## 💡 Why Contract-First Is Powerful

- **Single Source of Truth**: API contract defined once
- **Impossible to Drift**: Frontend/backend must stay in sync
- **Better Collaboration**: Contract serves as API documentation
- **Refactoring Safety**: Changes break compilation until fixed
- **Faster Development**: No manual type definitions needed

This is **true contract-first development** - the contract governs everything! 🎉
