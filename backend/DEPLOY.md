# Render Deployment Configuration f6. Use above build and start commands

7. Add environment variables
8. Deploy!

## Alternative: Using render.yaml (Automatic)

I've created a `render.yaml` file in the root directory that will automatically configure everything. Just:

1. Push the `render.yaml` file to your GitHub repo
2. In Render, select "Deploy from YAML"
3. It will automatically use the correct settings

## Manual Configuration Steps:

If render.yaml doesn't work, manually configure:

1. **Repository**: `https://github.com/reduanahmadswe/CR-Attendance-Portal`
2. **Root Directory**: `backend` ← This is the KEY fix!
3. **Build Command**: `npm ci --include=dev && npm run build`
4. **Start Command**: `npm start`
5. **Auto-Deploy**: Yes (optional)

## Environment Variables to Set Manually:

Go to Environment tab and add these:

```
MONGO_URI=mongodb+srv://admin:admin123@cluster0.mongodb.net/cr-attendance-portal?retryWrites=true&w=majority
JWT_SECRET=prod-super-secret-jwt-key-for-access-tokens-2025
JWT_REFRESH_SECRET=prod-super-secret-refresh-key-for-refresh-tokens-2025
```

Your API will be available at: https://your-app-name.onrender.comnorepo

## IMPORTANT: Monorepo Setup Required

Since this is a monorepo with `backend/` and `frontend/` folders, you need to configure Render properly:

## Auto Deploy Settings:

- **Root Directory**: `backend` (VERY IMPORTANT!)
- **Build Command**: `npm install && npm run build`
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
4. Connect your GitHub repository: `CR-Attendance-Portal`
5. **CRITICAL**: Set Root Directory to `backend`
6. Use above build and start commands
7. Add environment variables
8. Deploy!

Your API will be available at: https://your-app-name.onrender.com
