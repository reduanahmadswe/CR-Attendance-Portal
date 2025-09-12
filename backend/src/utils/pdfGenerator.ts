import puppeteer from 'puppeteer';
import { IAttendanceRecord } from '../models/AttendanceRecord';
import { ICourse } from '../models/Course';
import { ISection } from '../models/Section';
import { IStudent } from '../models/Student';
import { IUser } from '../models/User';

interface PopulatedAttendanceRecord extends Omit<IAttendanceRecord, 'sectionId' | 'courseId' | 'takenBy' | 'attendees'> {
  sectionId: ISection;
  courseId: ICourse;
  takenBy: IUser;
  attendees: Array<{
    studentId: IStudent;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
  }>;
}

export const generateAttendancePDF = async (record: PopulatedAttendanceRecord): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    const html = generateAttendanceHTML(record);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

const generateAttendanceHTML = (record: PopulatedAttendanceRecord): string => {
  const date = new Date(record.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const time = new Date(record.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const presentCount = record.attendees.filter(a => a.status === 'present').length;
  const absentCount = record.attendees.filter(a => a.status === 'absent').length;
  const lateCount = record.attendees.filter(a => a.status === 'late').length;
  const excusedCount = record.attendees.filter(a => a.status === 'excused').length;
  const totalStudents = record.attendees.length;

  // Sort attendees by student ID (smallest to biggest)
  const sortedAttendees = [...record.attendees].sort((a, b) => {
    const idA = a.studentId.studentId || '';
    const idB = b.studentId.studentId || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attendance Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .institution-name {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .report-title {
          font-size: 20px;
          color: #374151;
          margin-bottom: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-box {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        
        .info-value {
          color: #6b7280;
        }
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .stat-box {
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          color: white;
        }
        
        .stat-present { background: #10b981; }
        .stat-absent { background: #ef4444; }
        .stat-late { background: #f59e0b; }
        .stat-excused { background: #6366f1; }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .attendance-table th {
          background: #2563eb;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .attendance-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .attendance-table tr:last-child td {
          border-bottom: none;
        }
        
        .attendance-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-present {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-absent {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .status-late {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-excused {
          background: #e0e7ff;
          color: #3730a3;
        }
        
        .footer {
          margin-top: 40px;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #374151;
          margin-bottom: 8px;
          height: 40px;
        }
        
        .signature-label {
          color: #6b7280;
          font-size: 14px;
        }
        
        .signature-label strong {
          color: #374151;
          display: block;
          margin-top: 4px;
        }
        
        .generated-info {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 20px;
        }
        
        @media print {
          body { margin: 0; }
          .header { page-break-inside: avoid; }
          .attendance-table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="institution-name">CR Attendance Portal</div>
        <div class="report-title">Class Attendance Report</div>
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Section</div>
          <div class="info-value">${record.sectionId.name} (${record.sectionId.code || 'N/A'})</div>
        </div>
        <div class="info-box">
          <div class="info-label">Course</div>
          <div class="info-value">${record.courseId.name} (${record.courseId.code || 'N/A'})</div>
        </div>
        <div class="info-box">
          <div class="info-label">Date</div>
          <div class="info-value">${date}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Taken By</div>
          <div class="info-value">${record.takenBy.name}</div>
        </div>
      </div>
      
      <div class="stats-container">
        <div class="stat-box stat-present">
          <div class="stat-number">${presentCount}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-box stat-absent">
          <div class="stat-number">${absentCount}</div>
          <div class="stat-label">Absent</div>
        </div>
        <div class="stat-box stat-late">
          <div class="stat-number">${lateCount}</div>
          <div class="stat-label">Late</div>
        </div>
        <div class="stat-box stat-excused">
          <div class="stat-number">${excusedCount}</div>
          <div class="stat-label">Excused</div>
        </div>
      </div>
      
      <table class="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${sortedAttendees.map((attendee, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${attendee.studentId.studentId}</td>
              <td>${attendee.studentId.name}</td>
              <td>
                <span class="status-badge status-${attendee.status}">
                  ${attendee.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Class Representative Signature<br/><strong>${record.takenBy.name}</strong></div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Instructor Signature</div>
          </div>
        </div>
        
        <div class="generated-info">
          Generated on ${new Date().toLocaleString()} | Total Students: ${totalStudents}
        </div>
      </div>
    </body>
    </html>
  `;
};