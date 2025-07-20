# 🔬 tRPC Internals: How Type Safety Actually Works

## 1. **Procedure Definition → Type Extraction**

```typescript
// Backend procedure
export const getById = publicProcedure
  .input(z.object({ id: z.number() }))     // Input schema
  .query(async ({ input }) => {            // Implementation
    const user = await db.select()...
    return user[0];                        // Return type inferred
  });

// TypeScript sees this as:
type GetByIdProcedure = {
  input: { id: number };          // From Zod schema
  output: User;                   // From return type
  type: 'query';                  // From .query() method
}
```

## 2. **Router Assembly**

```typescript
// tRPC builds a type map:
type AppRouter = {
  users: {
    getAll: {
      input: void;
      output: User[];
      type: 'query';
    };
    getById: {
      input: { id: number };
      output: User;
      type: 'query';
    };
    create: {
      input: { email: string; name: string };
      output: User;
      type: 'mutation';
    };
  };
};
```

## 3. **Frontend Client Generation**

```typescript
// createTRPCReact<AppRouter>() generates:
const trpc = {
  users: {
    getAll: {
      useQuery: () => UseQueryResult<User[], Error>,
      useSuspenseQuery: () => UseSuspenseQueryResult<User[], Error>,
    },
    getById: {
      useQuery: (input: { id: number }) => UseQueryResult<User, Error>,
    },
    create: {
      useMutation: () => UseMutationResult<User, Error, { email: string; name: string }>,
    },
  },
};
```

## 4. **Runtime Request Transformation**

```typescript
// Your code:
trpc.users.getById.useQuery({ id: 123 })

// Transforms to:
fetch('/api/trpc/users.getById', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "0": {
      "json": { id: 123 }
    }
  })
})
```

## 5. **Server Request Processing**

```typescript
// Express middleware receives:
req.body = {
  "0": {
    "json": { id: 123 }
  }
}

// tRPC:
// 1. Routes to users.getById procedure
// 2. Validates input with Zod schema
// 3. Calls your procedure function
// 4. Returns JSON response
```

## 🎯 **Key Insights**

### **Compile Time**
- TypeScript extracts procedure signatures
- Generates type-safe client interfaces
- No code generation needed!

### **Runtime** 
- JSON-RPC over HTTP (batched requests)
- Zod validation on inputs
- Standard Express middleware

### **The "Magic"**
- It's just TypeScript generics and type inference
- The router type becomes a "schema" for the frontend
- Changes to backend immediately break frontend compilation

## 🔧 **What Makes This Possible**

1. **Monorepo**: Frontend can import backend types
2. **TypeScript**: Advanced type system with inference
3. **Zod**: Runtime validation that creates compile-time types
4. **JSON-RPC**: Simple protocol over HTTP

## 🚫 **What tRPC Is NOT**

- ❌ Not GraphQL (no query language)
- ❌ Not gRPC (no binary protocol)
- ❌ Not REST replacement (it IS REST under the hood)
- ❌ Not magic (just clever TypeScript)

## 💡 **Why It's Brilliant**

- Zero overhead: Types are erased at runtime
- Framework agnostic: Works with any HTTP setup
- Incremental adoption: Can coexist with REST
- Developer experience: Feels like calling local functions
