# Render Deployment Configuration

## Auto Deploy Settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18
- **Environment**: Node.js

## Environment Variables to Add in Render:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://admin:admin123@cluster0.mongodb.net/cr-attendance-portal?retryWrites=true&w=majority
JWT_SECRET=prod-super-secret-jwt-key-for-access-tokens-2025
JWT_REFRESH_SECRET=prod-super-secret-refresh-key-for-refresh-tokens-2025
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=https://diucrportal.vercel.app
PORT=10000
```

## Steps to Deploy:

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your GitHub repository
5. Use above settings
6. Add environment variables
7. Deploy!

Your API will be available at: https://your-app-name.onrender.com
