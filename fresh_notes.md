### ubiquitous-octo-pancake is...

# The front-end code of NeWO

## Fresh.js Framework Guide

### Basic Routing

- Files in `/routes` directory automatically become pages/endpoints
- Example: `/routes/about.tsx` → `https://beamcampus.com/about`

### Dynamic Routes

- Use `[brackets]` for dynamic parameters
- Single parameter: `/routes/greet/[name].tsx` →
  `https://beamcampus.com/greet/john`
- Multiple parameters: `/routes/greet/[firstName]/[lastName].tsx`

### Layout System

#### Global vs Local Layouts

1. `_app.tsx` - Global layout that wraps EVERY page
2. `_layout.tsx` - Local layout that only affects pages in its folder

#### Directory Structure Example

```
routes/
├── _app.tsx                 (Global layout - affects ALL pages)
├── index.tsx               
├── about.tsx
└── blog/
    ├── _layout.tsx         (Local layout - only affects blog pages)
    ├── index.tsx           (Blog home)
    └── post/
        └── [id].tsx        (Individual blog posts)
```

#### Layout Nesting

For regular pages (like `/about`):

```
_app.tsx
   └── about.tsx
```

For blog pages (like `/blog/post/123`):

```
_app.tsx
   └── blog/_layout.tsx
          └── post/[id].tsx
```

#### Benefits of Local Layouts

- Different navigation menus for different sections
- Section-specific styling
- Shared components within specific areas
- Consistent look within sections while maintaining global structure

### Special Files (prefixed with `_`)

1. `_app.tsx` - Global layout wrapper
2. `_layout.tsx` - Local layout for specific folders
3. `_404.tsx` - Custom "not found" page
4. `_500.tsx` - Custom error page
5. `_middleware.ts` - Request/response middleware
6. `_island.tsx` - Client-side interactive components

### API Routes

- Create endpoints in `routes/api/`
- Example: `/routes/api/joke.ts` → `https://beamcampus.com/api/joke`
- Can return:
  - Plain text
  - JSON data
  - HTML content
- Accessible via:
  - Direct browser visit
  - Fetch API
  - curl or other HTTP clients

### URL Pattern Examples

- `/` → `routes/index.tsx`
- `/about` → `routes/about.tsx`
- `/blog` → `routes/blog/index.tsx`
- `/blog/post/123` → `routes/blog/post/[id].tsx`
- `/api/data` → `routes/api/data.ts`

### Advanced Route Patterns

1. Catch-all routes: `[...path].tsx`
2. Optional parameters: `[[name]].tsx`
3. Nested combinations: `/[category]/[...path].tsx`

#### Optional Parameters Detail (`[[name]].tsx`)

The double bracket syntax makes parameters optional. Here's how they differ:

1. Regular Parameters (`[name].tsx`):
   ```
   ✅ /user/john      - Works
   ❌ /user          - 404 Error (name is required)
   ```

2. Optional Parameters (`[[name]].tsx`):
   ```
   ✅ /profile/john   - Shows "Profile: john"
   ✅ /profile        - Shows "Profile: Guest"
   ```

Example Implementation:

### Middleware System (_middleware.ts)

Middleware files allow request/response modification at different levels:

```
routes/
├── _middleware.ts         (Global middleware)
├── admin/
│   ├── _middleware.ts    (Admin-specific middleware)
│   └── index.tsx
└── api/
    ├── _middleware.ts    (API-specific middleware)
    └── protected.ts
```

#### Middleware Features

1. Pre-request handling
   - Logging
   - Authentication
   - Request validation
2. Post-response handling
   - Headers modification
   - Caching controls
   - Response transformation

#### Example Usage

```typescript
// Basic auth middleware
export async function handler(req: Request, ctx: FreshContext) {
  // Pre-request
  if (req.url.includes("/admin")) {
    const token = req.headers.get("authorization");
    if (!token) return new Response("Unauthorized", { status: 401 });
  }

  // Handle route
  const resp = await ctx.next();

  // Post-response
  resp.headers.set("cache-control", "public, max-age=60");
  return resp;
}
```

### Authentication Options

#### 1. Supabase Auth (Recommended)

- Built-in Fresh integration
- Easy setup
- Features:
  - Session management
  - Social auth
  - Magic links
  - JWT tokens
- Generous free tier

#### 2. Auth.js

- Multiple social providers
- Session handling
- Good documentation

#### 3. Firebase Auth

- Google integration
- Real-time features
- Comprehensive SDK

#### 4. Custom JWT (with jose)

- Lightweight solution
- Full control
- Good for simple auth needs

#### Example: Supabase Auth Setup

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY",
);

// In middleware:
export async function handler(req: Request, ctx: FreshContext) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && req.url.includes("/protected")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return ctx.next();
}
```
