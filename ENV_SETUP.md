# Environment Variables Setup

## Frontend Environment Variables

Create a `.env` file in the `palm-cafe-ui` directory with the following variables:

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

1. **Frontend**: Copy the example above to `palm-cafe-ui/.env`
2. **Backend**: Update `FRONTEND_URL` in `palm-cafe-api/.env` to match your frontend URL

## Notes

- Frontend environment variables must start with `REACT_APP_` to be accessible in React
- Backend CORS will automatically allow the URL specified in `FRONTEND_URL`
- WebSocket URL is automatically derived from API URL if not explicitly set
