# 🚀 Quick Start Guide - QR Code Attendance System

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or Atlas)
- Camera-enabled device for testing QR scanner

---

## Step 1: Backend Setup

### 1.1 Navigate to backend folder
```bash
cd backend
```

### 1.2 Install dependencies (if not already installed)
```bash
npm install
```

### 1.3 Configure Environment Variables
Create or update your `.env` file:
```env
# Add this line to your existing .env file
QR_ENCRYPTION_KEY=dev-qr-encryption-key-32chars

# Make sure you also have these:
MONGO_URI=mongodb://localhost:27017/cr-attendance-portal
JWT_SECRET=your-jwt-secret
PORT=4000
```

### 1.4 Start Backend Server
```bash
npm run dev
```

✅ Backend should be running on `http://localhost:4000`

---

## Step 2: Frontend Setup

### 2.1 Open new terminal and navigate to frontend
```bash
cd frontend
```

### 2.2 Install dependencies (if not already installed)
```bash
npm install
```

### 2.3 Start Frontend Dev Server
```bash
npm run dev
```

✅ Frontend should be running on `http://localhost:5173`

---

## Step 3: Testing QR Attendance

### 3.1 Login as CR User
1. Open browser: `http://localhost:5173`
2. Login with CR credentials
3. You should see the CR Dashboard

### 3.2 Generate QR Code
1. Click on **"QR Attendance"** tab in the header
2. Select a course from dropdown
3. Configure settings (optional):
   - **Duration**: 15 minutes (default)
   - **Allowed Radius**: 100 meters (default)
   - **Anti-Cheat Enabled**: ON (recommended)
   - **Use Location Verification**: ON (recommended)
4. Click **"Generate QR Code"** button
5. ✅ QR code should appear on screen

### 3.3 Monitor Live Stats
Once QR is generated, you'll see:
- QR Code displayed prominently
- Live attendance count (updates every 5 seconds)
- Session expiration countdown
- "Close Session" button

### 3.4 Scan QR Code (As Student)
**Option A: Using the QRScanner component directly**
1. Open `QRScanner` component (you can integrate it in student view)
2. Allow camera and location permissions
3. Point camera at the QR code on screen
4. ✅ Attendance should be marked instantly

**Option B: Using any QR scanner app**
1. Use your phone's camera or QR scanner app
2. Scan the QR code from your screen
3. You'll see the encrypted QR data
4. Use Postman/curl to call the scan API with this data

### 3.5 Close Session
1. Click **"Close Session"** button on CR's screen
2. Session closes and creates attendance record
3. ✅ You can now view the attendance in Reports section

---

## Step 4: Verify Attendance Record

### 4.1 View in Reports
1. Click **"Reports"** tab in CR Dashboard
2. Find the course you just took attendance for
3. You should see the attendance record created from QR session

### 4.2 Check Database (Optional)
```javascript
// In MongoDB shell or Compass
use cr-attendance-portal

// View attendance sessions
db.attendancesessions.find().pretty()

// View attendance records
db.attendancerecords.find().pretty()
```

---

## 🎯 Testing Scenarios

### Scenario 1: Normal Attendance
✅ **Expected**: Student scans QR, attendance marked successfully

### Scenario 2: Duplicate Scan (Anti-Cheat)
1. Student scans QR code
2. Same student tries to scan again
❌ **Expected**: "You have already marked attendance for this session"

### Scenario 3: Expired Session
1. Wait for session to expire (or set duration to 1 minute)
2. Try to scan expired QR
❌ **Expected**: "Session has expired"

### Scenario 4: Wrong Location (Geofencing)
1. Scan QR from a location far from session center
❌ **Expected**: "You are outside the allowed area"

### Scenario 5: GPS Spoofing Detection
1. Use fake GPS location with low accuracy
❌ **Expected**: "Location spoofing detected"

---

## 📱 Testing with Mobile Device

### Option 1: Same Network
1. Get your computer's local IP address
2. Update frontend's API base URL to use IP instead of localhost
3. Access from mobile: `http://YOUR_IP:5173`

### Option 2: ngrok (Recommended for testing)
```bash
# Install ngrok
npm install -g ngrok

# Expose backend
ngrok http 4000

# Update frontend API URL to ngrok URL
# Then test from any device
```

---

## 🔧 Troubleshooting

### Issue: QR Code not generating
**Solution**: 
- Check backend console for errors
- Verify `QR_ENCRYPTION_KEY` is set in `.env`
- Ensure MongoDB is running
- Check if CR user is authenticated

### Issue: Camera not working in QRScanner
**Solution**:
- Grant camera permissions in browser
- Use HTTPS or localhost (required for getUserMedia)
- Check browser console for errors
- Try different browser (Chrome recommended)

### Issue: Location not detected
**Solution**:
- Grant location permissions in browser
- Use HTTPS or localhost
- Wait a few seconds for GPS to initialize
- Check if Geolocation API is supported

### Issue: "Session not found" error
**Solution**:
- Ensure session hasn't expired
- Verify sectionId and courseId are correct
- Check backend logs for session creation

### Issue: "You are outside the allowed area"
**Solution**:
- Increase allowed radius in session settings
- Disable location verification for testing
- Check if location accuracy is good (< 100m)

---

## 🎨 UI Preview

### QR Generator (CR View):
```
┌─────────────────────────────────────┐
│  Generate QR Attendance             │
├─────────────────────────────────────┤
│  Course: [Select Course ▼]         │
│  Duration: [15] minutes             │
│  Radius: [100] meters               │
│  [✓] Anti-Cheat                     │
│  [✓] Location Verification          │
│                                     │
│  [Generate QR Code]                 │
└─────────────────────────────────────┘

After generation:
┌─────────────────────────────────────┐
│  Active QR Session                  │
├─────────────────────────────────────┤
│       ███████████████               │
│       ██ ▄▄▄▄▄ █▀▄██               │
│       ██ █   █ █▄ ██               │
│       ██ █▄▄▄█ █▀▀██               │
│       ███████████████               │
│                                     │
│  👥 Students: 15/45                 │
│  ⏱️ Time Left: 12:34                │
│  📍 Radius: 100m                    │
│                                     │
│  [Close Session]                    │
└─────────────────────────────────────┘
```

### QR Scanner (Student View):
```
┌─────────────────────────────────────┐
│  Scan QR Code                       │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │       📷 Camera View          │  │
│  │                               │  │
│  │   [QR Code Scanning Area]     │  │
│  │                               │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Start Scanning]                   │
└─────────────────────────────────────┘

After successful scan:
┌─────────────────────────────────────┐
│  ✅ Attendance Marked!               │
├─────────────────────────────────────┤
│  Your attendance has been           │
│  successfully recorded.             │
│                                     │
│  Course: CSE 101                    │
│  Time: 10:30 AM                     │
│  Location: Verified ✓               │
└─────────────────────────────────────┘
```

---

## 📊 API Testing with Postman

### 1. Generate QR Session
```http
POST http://localhost:4000/api/qr-attendance/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sectionId": "section123",
  "courseId": "course456",
  "duration": 15,
  "location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "accuracy": 10
  },
  "allowedRadius": 100,
  "antiCheatEnabled": true
}
```

### 2. Scan QR Code
```http
POST http://localhost:4000/api/qr-attendance/scan
Content-Type: application/json

{
  "qrCodeData": "ENCRYPTED_QR_DATA_FROM_GENERATION",
  "studentId": "student789",
  "location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "accuracy": 15
  },
  "deviceInfo": "Mozilla/5.0..."
}
```

### 3. Get Active Session
```http
GET http://localhost:4000/api/qr-attendance/active/section123/course456
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Get Session Stats
```http
GET http://localhost:4000/api/qr-attendance/stats/SESSION_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Close Session
```http
PUT http://localhost:4000/api/qr-attendance/close/SESSION_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "generateAttendanceRecord": true
}
```

---

## ✅ Success Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected successfully
- [ ] QR_ENCRYPTION_KEY configured
- [ ] Logged in as CR user
- [ ] Can navigate to QR Attendance tab
- [ ] Can select course and generate QR
- [ ] QR code displays correctly
- [ ] Can scan QR code (camera permissions granted)
- [ ] Attendance marked successfully
- [ ] Live stats updating every 5 seconds
- [ ] Can close session
- [ ] Attendance record created in database

---

## 🎓 Ready to Use!

Your QR Code Attendance System is now fully operational! 

**For production deployment**, remember to:
1. Change `QR_ENCRYPTION_KEY` to a secure 32-character key
2. Use HTTPS for both frontend and backend
3. Configure proper CORS settings
4. Set up production MongoDB Atlas cluster
5. Enable rate limiting on API endpoints

**Happy attendance tracking! 📱✨**
