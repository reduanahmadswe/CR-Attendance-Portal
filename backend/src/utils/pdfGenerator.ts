import { jsPDF } from 'jspdf';
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
  console.log('[PDF GENERATOR] Starting PDF generation for record:', record._id);

  // Try Puppeteer first, fallback to jsPDF if it fails
  try {
    return await generateAttendancePDFWithPuppeteer(record);
  } catch (puppeteerError) {
    console.warn('[PDF GENERATOR] Puppeteer failed, trying jsPDF fallback:', puppeteerError);
    try {
      return await generateAttendancePDFWithJsPDF(record);
    } catch (jsPDFError) {
      console.error('[PDF GENERATOR] Both Puppeteer and jsPDF failed');
      throw new Error(`PDF generation failed: ${puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error'}`);
    }
  }
};

const generateAttendancePDFWithPuppeteer = async (record: PopulatedAttendanceRecord): Promise<Buffer> => {
  console.log('[PDF GENERATOR] Starting PDF generation for record:', record._id);

  let browser;
  try {
    console.log('[PDF GENERATOR] Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true, // Use headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
      ],
      timeout: 30000, // 30 second timeout
    });

    console.log('[PDF GENERATOR] Browser launched successfully');
    const page = await browser.newPage();

    // Set a timeout for the page
    page.setDefaultTimeout(30000);

    console.log('[PDF GENERATOR] Generating HTML content...');
    const html = generateAttendanceHTML(record);
    console.log('[PDF GENERATOR] HTML content generated, length:', html.length);

    await page.setContent(html, {
      waitUntil: 'domcontentloaded', // Changed from networkidle0 to domcontentloaded for faster loading
      timeout: 20000
    });
    console.log('[PDF GENERATOR] HTML content set in page');

    console.log('[PDF GENERATOR] Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm',
      },
      timeout: 20000, // Add timeout for PDF generation
    });

    console.log('[PDF GENERATOR] PDF generated successfully, size:', pdf.length, 'bytes');
    return Buffer.from(pdf);
  } catch (error) {
    console.error('[PDF GENERATOR] Error during PDF generation:', error);
    // More specific error message based on error type
    if (error instanceof Error) {
      if (error.message.includes('Target closed') || error.message.includes('Protocol error')) {
        throw new Error('PDF generation failed: Browser process crashed. Please try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('PDF generation failed: Operation timed out. Please try again.');
      } else {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
    } else {
      throw new Error('PDF generation failed: Unknown error occurred');
    }
  } finally {
    if (browser) {
      try {
        console.log('[PDF GENERATOR] Closing browser...');
        await browser.close();
        console.log('[PDF GENERATOR] Browser closed successfully');
      } catch (closeError) {
        console.error('[PDF GENERATOR] Error closing browser:', closeError);
        // Don't throw here, just log the error
      }
    }
  }
};

const generateAttendancePDFWithJsPDF = async (record: PopulatedAttendanceRecord): Promise<Buffer> => {
  console.log('[PDF GENERATOR] Using jsPDF fallback...');

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Attendance Report', 20, 20);

  // Add basic information
  doc.setFontSize(12);
  const date = new Date(record.date).toLocaleDateString('en-US');
  const sectionName = record.sectionId.name || 'Unknown Section';
  const courseName = record.courseId.name || 'Unknown Course';
  const takenBy = record.takenBy.name || 'Unknown User';

  doc.text(`Date: ${date}`, 20, 35);
  doc.text(`Section: ${sectionName}`, 20, 45);
  doc.text(`Course: ${courseName}`, 20, 55);
  doc.text(`Taken By: ${takenBy}`, 20, 65);

  // Add attendance summary
  const presentCount = record.attendees.filter(a => a.status === 'present').length;
  const absentCount = record.attendees.filter(a => a.status === 'absent').length;
  const totalStudents = record.attendees.length;

  doc.text(`Total Students: ${totalStudents}`, 20, 80);
  doc.text(`Present: ${presentCount}`, 20, 90);
  doc.text(`Absent: ${absentCount}`, 20, 100);

  // Add attendance list
  doc.text('Attendance List:', 20, 115);

  let yPosition = 125;
  record.attendees.forEach((attendee, index) => {
    if (yPosition > 270) { // Start new page if needed
      doc.addPage();
      yPosition = 20;
    }

    const studentName = attendee.studentId.name || 'Unknown Student';
    const studentId = attendee.studentId.studentId || 'Unknown ID';
    const status = attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1);

    doc.text(`${index + 1}. ${studentName} (${studentId}) - ${status}`, 20, yPosition);
    yPosition += 10;
  });

  console.log('[PDF GENERATOR] jsPDF PDF generated successfully');
  return Buffer.from(doc.output('arraybuffer'));
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