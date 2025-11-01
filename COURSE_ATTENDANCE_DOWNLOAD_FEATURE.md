# Course Attendance Download Feature

## Overview
এই feature টি ব্যবহার করে আপনি যেকোনো course এর জন্য সব attendance records একসাথে download করতে পারবেন ZIP file হিসেবে।

## Features

### Backend API
- **Endpoint**: `GET /api/attendance/course/:courseId/download-zip`
- **Query Parameters**: 
  - `sectionId` (optional): নির্দিষ্ট section এর attendance filter করতে
- **Response**: ZIP file containing all attendance PDFs for the course

### Authentication & Authorization
- Admin এবং CR উভয়েই এই feature ব্যবহার করতে পারবে
- CR শুধুমাত্র তাদের নিজস্ব section এর attendance download করতে পারবে
- Admin যেকোনো section এর attendance download করতে পারবে

### Frontend UI

#### Admin Dashboard
Admin Dashboard এর **Courses Management** section এ প্রতিটি course এর জন্য একটি download button (📥) যোগ করা হয়েছে:

- Desktop View: Table এর Actions column এ download button
- Mobile View: Course card এ download button
- Loading state: Download করার সময় spinner দেখায়

#### CR Dashboard
CR Dashboard এ একটি নতুন **"Download Course Attendance"** section যোগ করা হয়েছে:

- Stats cards এর নিচে একটি dedicated section
- প্রতিটি course এর জন্য আলাদা card with download button
- Beautiful gradient design
- Real-time download progress indicator

## How It Works

### Backend Process
1. Course ID দিয়ে সব attendance records fetch করে
2. প্রতিটি attendance record থেকে PDF generate করে
3. সব PDFs একটি ZIP archive এ pack করে
4. ZIP file client এ send করে

### PDF Naming Convention
- Format: `Attendance_[SectionName]_[Date].pdf`
- Example: `Attendance_Section-A_2025-11-01.pdf`

### ZIP Filename Convention
- Format: `Attendance_[CourseName]_[CourseCode]_[Date].zip`
- Example: `Attendance_Advanced-Mathematics_MATH301_2025-11-01.zip`
- With Section: `Attendance_Advanced-Mathematics_MATH301_Section-A_2025-11-01.zip`

## Installation

### Dependencies Added
```bash
# Backend
npm install archiver
npm install --save-dev @types/archiver
```

## Usage

### For Admin
1. Navigate to **Courses Management** tab
2. Select a section
3. Click the download button (blue icon) next to any course
4. ZIP file will automatically download

### For CR
1. Login to CR Dashboard
2. Scroll to **"Download Course Attendance"** section below stats cards
3. Click **"Download All"** button for any course
4. ZIP file will automatically download with all attendance records for that course

## Error Handling

The system handles various error scenarios:
- No attendance records found (404)
- Permission denied (403)
- PDF generation failure
- Empty ZIP file error

Users receive appropriate toast notifications for all scenarios.

## Technical Details

### Files Modified/Created

#### Backend
- `src/controllers/attendanceController.ts` - Added `downloadCourseAttendanceZip` function
- `src/routes/attendanceRoutes.ts` - Added new route
- `package.json` - Added archiver dependency

#### Frontend
- `src/lib/apiSlice.ts` - Added `downloadCourseAttendanceZip` mutation
- `src/pages/AdminDashboard.tsx` - Added download button in Courses Management
- `src/pages/CRDashboard.tsx` - Added download section in CR Dashboard

## API Response Example

### Success Response
```
Content-Type: application/zip
Content-Disposition: attachment; filename="Attendance_Math_MATH301_2025-11-01.zip"
[ZIP Binary Data]
```

### Error Response
```json
{
  "success": false,
  "message": "No attendance records found for this course"
}
```

## Testing

To test the feature:

1. **Create some attendance records** for a course
2. **As Admin**:
   - Go to Courses Management
   - Select a section with courses
   - Click download button on any course
   
3. **As CR**:
   - Login to CR Dashboard
   - Find "Download Course Attendance" section
   - Click "Download All" for any course
   
4. **Verify**:
   - ZIP file downloads successfully
   - ZIP contains all attendance PDFs
   - Each PDF opens correctly
   - Filenames are properly formatted

## Future Enhancements

Potential improvements:
- Add date range filter for downloads
- Include attendance statistics in ZIP
- Email ZIP file option
- Bulk download for multiple courses
- Progress bar for large downloads
- Download history tracking
