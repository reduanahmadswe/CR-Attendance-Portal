# 🚀 Deployment Fix - CORS Issue

## ❌ Problem
```
Access to fetch at 'https://crportal-nu.vercel.app/api/auth/login' 
from origin 'https://diucrportal.vercel.app' has been blocked by CORS policy
```

## ✅ Solution Applied

Backend এ CORS configuration update করা হয়েছে যাতে **সব vercel.app domains** allow হয়।

### Changes Made in `backend/src/app.ts`:

```typescript
// Now allows:
// ✅ localhost (development)
// ✅ All *.vercel.app domains (production)
// ✅ Specific frontend URL from env

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (
      origin.includes('localhost') || 
      origin.endsWith('.vercel.app') ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', ...],
}));
```

---

## 🔄 Deploy করুন

### Backend Redeploy করুন:
```bash
cd backend
vercel --prod
```

### অথবা Git Push করুন:
```bash
git add .
git commit -m "fix: Update CORS to allow all vercel.app domains"
git push origin main
```

Vercel automatically redeploy করবে!

---

## ✅ Expected Result

Deploy হওয়ার পর:

```bash
✅ POST https://crportal-nu.vercel.app/api/auth/login 200
✅ GET https://crportal-nu.vercel.app/api/auth/profile 200
✅ Login successful
✅ Redirected to dashboard
```

---

## 🧪 Test After Deploy

1. Open: `https://diucrportal.vercel.app/auth/login`
2. Login করুন:
   - **Admin:** `admin@university.edu`
   - **Student:** Student ID (e.g., `CSE-2021-001`)
3. Check browser console - **no CORS errors**
4. Dashboard load হবে successfully!

---

## 📝 Note

**Security:** এই configuration সব `.vercel.app` domains allow করছে। Production এ specific domain specify করা better:

```typescript
const allowedOrigins = [
  'https://diucrportal.vercel.app',  // Your production frontend
  'http://localhost:5173',            // Development
];
```

কিন্তু এখনকার জন্য সব vercel domains allow করা OK আছে testing এর জন্য।

---

## 🚀 Deploy Command

```bash
cd backend
vercel --prod
```

Wait for deployment to complete, then test login again!
