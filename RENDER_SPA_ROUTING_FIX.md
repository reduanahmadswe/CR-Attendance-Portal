# Render Static Site Configuration

## Redirect/Rewrite Rules for SPA

To fix the "Not Found" issue when navigating to routes after logout, you need to add redirect rules in Render Dashboard.

### Option 1: Automatic (via Blueprint - render.yaml)

The `render.yaml` file already contains the rewrite rule:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This should automatically apply when you deploy using the Blueprint.

### Option 2: Manual Configuration in Render Dashboard

If the automatic configuration doesn't work, follow these steps:

1. **Go to Render Dashboard** → Select your frontend service
2. **Click on "Redirects/Rewrites"** tab
3. **Add a new Rewrite Rule:**
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`

4. **Save** and wait for automatic redeploy

### Option 3: Using _redirects file (Already Added)

The `public/_redirects` file is already in place:

```
/*    /index.html   200
```

This file is automatically copied to the `dist` folder during build and should be picked up by Render.

### Verification

After deployment:
1. Visit your frontend URL
2. Login as any user
3. Click logout button
4. You should see the **login page** instead of "Not Found"
5. Navigate directly to `/login` or `/dashboard` - should work

### Troubleshooting

If still seeing "Not Found":

1. **Check Build Logs:** Ensure `_redirects` file is in the `dist` folder
2. **Check Service Type:** Should be `static` site, not `web` service
3. **Manual Override:** Add redirect rule manually in Render Dashboard (Option 2)
4. **Cache Issue:** Try clearing browser cache or incognito mode

### Why This Happens

- React Router handles routes on the **client-side**
- When you refresh or navigate directly to `/login`, the **server** looks for a `/login` file
- Server returns **404** because there's no `/login` file
- The rewrite rule tells the server to serve `index.html` for all routes
- Then React Router takes over and displays the correct page

### Current Status

✅ `_redirects` file created in `public/` folder  
✅ Rewrite rule added to `render.yaml`  
✅ File automatically copied to `dist/` during build  

If still having issues, use **Option 2** (Manual Configuration) as a guaranteed fix.
