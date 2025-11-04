# Render Deployment Guide - CR Attendance Portal

## 🚀 Backend Deployment (Web Service)

### Configuration:
- **Name:** cr-portal-backend
- **Root Directory:** `backend`
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Free

### Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crportal
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.onrender.com
```

### Health Check:
- **Path:** `/api/health`

---

## 🎨 Frontend Deployment (Static Site)

### Configuration:
- **Name:** cr-portal-frontend
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `frontend/dist`

### Environment Variables:
```
VITE_API_URL=https://cr-portal-backend.onrender.com/api
```

### Redirects/Rewrites:
Add this in Render dashboard (Settings → Redirects/Rewrites):
```
Source: /*
Destination: /index.html
Action: Rewrite
```

---

## 📋 Step-by-Step Process

### 1. Deploy Backend First:

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select `CR-Attendance-Portal` repo
5. Configure:
   ```
   Name: cr-portal-backend
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
6. Add all environment variables (see above)
7. Click "Create Web Service"
8. Wait for deployment (~5 minutes)
9. Note down the URL: `https://cr-portal-backend.onrender.com`

### 2. Deploy Frontend:

1. Click "New +" → "Static Site"
2. Select same repository
3. Configure:
   ```
   Name: cr-portal-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: frontend/dist
   ```
4. Add environment variable:
   ```
   VITE_API_URL=https://cr-portal-backend.onrender.com/api
   ```
5. Click "Create Static Site"
6. After deploy, add Redirect rule:
   - Settings → Redirects/Rewrites
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

---

## ✅ Verify Deployment

### Backend:
```
https://cr-portal-backend.onrender.com/
```

Should return:
```json
{
  "success": true,
  "message": "CR Attendance Portal API is running successfully",
  "database": "connected"
}
```

### Frontend:
```
https://cr-portal-frontend.onrender.com
```

Should show login page!

---

## 🔧 Important Notes:

### Render Free Tier:
- Backend spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading to paid tier for production

### CORS:
Backend already configured to allow all `.onrender.com` domains:
```typescript
origin.endsWith('.onrender.com')
```

### MongoDB Atlas:
Make sure MongoDB Atlas allows connections from anywhere:
- Network Access → Add IP: `0.0.0.0/0`

---

## 🐛 Troubleshooting

### Backend won't start:
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Check MongoDB connection string

### Frontend 404 errors:
1. Make sure redirect rule is added
2. Check `VITE_API_URL` is correct
3. Clear browser cache

### CORS errors:
1. Verify `FRONTEND_URL` in backend env
2. Check backend logs
3. Make sure both services are on Render

---

## 🎯 Complete URLs:

After deployment, you'll have:
- **Backend API:** `https://cr-portal-backend.onrender.com`
- **Frontend App:** `https://cr-portal-frontend.onrender.com`

Update backend `FRONTEND_URL` to match your frontend URL!

---

## 📚 Benefits of Render over Vercel:

✅ Better for traditional Node.js apps (not serverless)  
✅ Persistent WebSocket connections  
✅ Background jobs support  
✅ PostgreSQL database included (if needed)  
✅ No cold starts on paid tier  
✅ SSH access for debugging  

---

**Ready to deploy? Start with Backend first, then Frontend!** 🚀
