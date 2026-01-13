# Environment Variables Setup

## Frontend Environment Variables

**IMPORTANT**: React Scripts has native `.env` file support. No additional packages needed!

Create a `.env` file in the `palm-cafe-ui` directory (same level as `package.json`) with the following variables:

```env
# API Configuration
# Set this to your backend API URL
# For local development: http://localhost:5000
# For production: https://api.cafe.nevyaa.com
REACT_APP_API_URL=http://localhost:5000

# WebSocket Configuration (optional)
# If not set, will be derived from REACT_APP_API_URL (http -> ws, https -> wss)
# For local development: ws://localhost:5000
# For production: wss://api.cafe.nevyaa.com
REACT_APP_WS_URL=

# Environment
# Set to 'development' or 'production'
REACT_APP_ENV=development
```

## Backend Environment Variables

Update your `.env` file in the `palm-cafe-api` directory:

```env
# Frontend URLs (for CORS)
# Add your frontend URL here - this will be used for CORS configuration
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Production frontend URL (optional, for production deployments)
# FRONTEND_URL=https://app.cafe.nevyaa.com
```

## Quick Setup

1. **Frontend**: Create `palm-cafe-ui/.env` file with the variables above
2. **Backend**: Update `FRONTEND_URL` in `palm-cafe-api/.env` to match your frontend URL
3. **Restart**: After creating/updating `.env`, restart your dev server or rebuild

## Critical Requirements

✅ **Variable names MUST start with `REACT_APP_`** - This is required by React Scripts  
✅ **`.env` file MUST be in the root of `palm-cafe-ui`** (same directory as `package.json`)  
✅ **No spaces around `=` sign**: `REACT_APP_API_URL=http://localhost:5000`  
✅ **Variable names are case-sensitive**  
✅ **After changing `.env`, you MUST restart the dev server or rebuild**

## How It Works

React Scripts 5.0.1 automatically:
- Reads `.env` file from the project root
- Makes variables starting with `REACT_APP_` available via `process.env`
- Embeds them into the build at build time
- No additional packages needed!

## Troubleshooting Build Issues

If `npm run build` is not picking up environment variables:

1. **Verify `.env` file location**: Must be `palm-cafe-ui/.env` (not in `src/` or `public/`)
2. **Check variable prefix**: Must be `REACT_APP_` (e.g., `REACT_APP_API_URL`)
3. **Verify file format**: No spaces around `=`, no quotes needed
4. **Clear cache and rebuild**:
   ```bash
   rm -rf build node_modules/.cache
   npm run build
   ```
5. **Check for typos**: Variable names are case-sensitive
6. **Verify file exists**: Make sure `.env` file is actually in `palm-cafe-ui/` directory

## Testing Environment Variables

To verify variables are loaded:

1. Add temporary console.log: `console.log('API URL:', process.env.REACT_APP_API_URL)`
2. Check browser console (dev) or build output (production)
3. If `undefined`, the variable is not being loaded

## Production Build

For production, update `.env` before building:

```env
REACT_APP_API_URL=https://api.cafe.nevyaa.com
REACT_APP_WS_URL=wss://api.cafe.nevyaa.com
REACT_APP_ENV=production
```

Then run: `npm run build`

**Note**: Environment variables are embedded at build time. Changes to `.env` after building won't affect the build until you rebuild.
