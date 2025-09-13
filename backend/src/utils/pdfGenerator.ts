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
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; color: #6b7280; text-align: right; width: 100%; margin: 0 20px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '1cm',
        bottom: '1.5cm',
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const sectionName = record.sectionId.name || 'Unknown Section';
  const courseName = record.courseId.name || 'Unknown Course';
  const date = new Date(record.date).toLocaleDateString('en-US');

  // Sort attendees by student ID
  const sortedAttendees = [...record.attendees].sort((a, b) => {
    const idA = a.studentId.studentId || '';
    const idB = b.studentId.studentId || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  const addWatermark = () => {
    doc.saveGraphicsState();
    // Make watermark more visible with higher opacity
    const gState = { opacity: 0.25 };
    (doc as any).setGState(gState);
    doc.setTextColor(150, 150, 150); // Darker gray for better visibility
    doc.setFont('helvetica', 'bold'); // Make it bold
    doc.setFontSize(80); // Larger font size

    // Calculate center position and rotate text
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    doc.text(sectionName, centerX, centerY, {
      angle: -45,
      align: 'center'
    });

    doc.restoreGraphicsState();
  };

  const addDisclaimer = () => {
    const disclaimerText = `Disclaimer: CR Attendance portal is not affiliated with university. It was created to help Class Representatives quickly prepare notebook attendance when needed. This record is intended for Section ${sectionName}.`;

    // Create a styled box for disclaimer
    const boxMargin = 15;
    const boxHeight = 35;
    const boxY = pageHeight - boxHeight - 10;

    // Draw light blue disclaimer box
    doc.setFillColor(219, 234, 254); // Light blue background
    doc.rect(boxMargin, boxY, pageWidth - 2 * boxMargin, boxHeight, 'F');

    // Draw blue border
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.setLineWidth(1);
    doc.rect(boxMargin, boxY, pageWidth - 2 * boxMargin, boxHeight, 'S');

    // Add disclaimer text
    doc.setTextColor(30, 64, 175); // Dark blue text
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);

    const textY = boxY + 8;
    doc.text(disclaimerText, pageWidth / 2, textY, {
      align: 'center',
      maxWidth: pageWidth - 40
    });

  };

  const addPageNumber = (currentPage: number, totalPages: number) => {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, pageHeight - 25, {
      align: 'right'
    });
  };

  // Calculate total pages needed
  const rowsPerPage = 12; // Adjust based on table size
  const totalPages = Math.ceil(sortedAttendees.length / rowsPerPage) || 1;
  let currentPage = 1;

  // First page header
  addWatermark();

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Attendance Report – ${courseName}`, pageWidth / 2, 25, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Section: ${sectionName} | Date: ${date}`, pageWidth / 2, 35, { align: 'center' });

  // Statistics
  const presentCount = record.attendees.filter(a => a.status === 'present').length;
  const absentCount = record.attendees.filter(a => a.status === 'absent').length;
  const lateCount = record.attendees.filter(a => a.status === 'late').length;
  const excusedCount = record.attendees.filter(a => a.status === 'excused').length;
  const totalStudents = record.attendees.length;

  doc.setFontSize(10);
  const statsY = 50;
  doc.text(`Total: ${totalStudents} | Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount} | Excused: ${excusedCount}`,
    pageWidth / 2, statsY, { align: 'center' });

  // Table header
  const tableStartY = 65;
  let currentY = tableStartY;

  const drawTableHeader = (y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(37, 99, 235); // Blue background
    doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');

    doc.text('Student ID', margin + 5, y + 7);
    doc.text('Name', margin + 50, y + 7);
    doc.text('Status', margin + 130, y + 7);

    return y + 10;
  };

  currentY = drawTableHeader(currentY);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  let rowIndex = 0;

  sortedAttendees.forEach((attendee, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      // Add footer to current page (but not disclaimer - only on last page)
      addPageNumber(currentPage, totalPages);

      // Start new page
      doc.addPage();
      currentPage++;
      addWatermark();
      currentY = margin;
      currentY = drawTableHeader(currentY);
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251); // Light gray
      doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
    }

    // Student data
    const studentId = attendee.studentId.studentId || 'N/A';
    const studentName = attendee.studentId.name || 'Unknown Student';
    const status = attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1);

    doc.setFontSize(9);
    doc.text(studentId, margin + 5, currentY + 6);
    doc.text(studentName.substring(0, 35), margin + 50, currentY + 6); // Increased name length

    // Color-coded status
    switch (attendee.status) {
      case 'present':
        doc.setTextColor(6, 95, 70); // Green
        break;
      case 'absent':
        doc.setTextColor(153, 27, 27); // Red
        break;
      case 'late':
        doc.setTextColor(146, 64, 14); // Orange
        break;
      case 'excused':
        doc.setTextColor(55, 48, 163); // Purple
        break;
      default:
        doc.setTextColor(0, 0, 0);
    }

    doc.text(status, margin + 130, currentY + 6);
    doc.setTextColor(0, 0, 0); // Reset color

    currentY += 8;
  });

  // Add footer to last page
  addPageNumber(currentPage, totalPages);
  addDisclaimer();

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
        
        .disclaimer {
          margin-top: 30px;
          padding: 20px;
          background-color: #dbeafe; /* Light blue background */
          border: 2px solid #3b82f6; /* Blue border */
          border-radius: 10px;
          text-align: center;
          color: #1e40af; /* Dark blue text */
          font-size: 11px;
          font-style: italic;
          line-height: 1.5;
          max-width: 650px;
          margin-left: auto;
          margin-right: auto;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 96px; /* Larger font size */
          color: rgba(120, 120, 120, 0.25); /* More visible with higher opacity */
          font-weight: 900; /* Extra bold */
          font-family: 'Arial Black', Arial, sans-serif; /* Bolder font family */
          z-index: -1;
          pointer-events: none;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); /* Subtle shadow for better visibility */
        }
        
        .page-number {
          position: fixed;
          bottom: 30px;
          right: 20px;
          color: #6b7280;
          font-size: 10px;
          z-index: 1000;
        }
        
        .main-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .sub-title {
          font-size: 16px;
          color: #374151;
          margin-bottom: 20px;
          text-align: center;
        }
        
        @media print {
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { 
            page-break-inside: avoid; 
            page-break-after: avoid;
          }
          .info-grid {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .stats-container {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .attendance-table { 
            page-break-inside: auto; 
            border-collapse: collapse;
          }
          .attendance-table thead {
            display: table-header-group;
          }
          .attendance-table tbody {
            display: table-row-group;
          }
          .attendance-table tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          .attendance-table thead tr {
            page-break-after: avoid;
          }
          /* Ensure table header repeats on each page */
          .attendance-table thead th {
            position: sticky;
            top: 0;
            background: #2563eb !important;
            color: white !important;
          }
          .signature-section {
            page-break-inside: avoid;
            margin-top: 2cm;
          }
          .disclaimer { 
            page-break-inside: avoid;
            margin-top: 20px;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            z-index: -1;
            font-size: 96px !important; /* Ensure larger size in print */
            color: rgba(120, 120, 120, 0.25) !important; /* More visible */
            font-weight: 900 !important; /* Extra bold */
            font-family: 'Arial Black', Arial, sans-serif !important;
          }
          .page-number {
            position: fixed;
            bottom: 30px;
            right: 20px;
          }
          /* CSS Page Rules for better pagination */
          @page {
            margin: 1cm;
            size: A4;
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10px;
              color: #6b7280;
            }
          }
          /* Prevent orphaned rows */
          .attendance-table tr {
            orphans: 2;
            widows: 2;
          }
          /* Force page break before signature if needed */
          .footer {
            page-break-before: auto;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="watermark">${record.sectionId.name}</div>
      
      <div class="header">
        <div class="main-title">Attendance Report – ${record.courseId.name}</div>
        <div class="sub-title">Section: ${record.sectionId.name} | Date: ${date}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Section Code</div>
          <div class="info-value">${record.sectionId.code || 'N/A'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Course Code</div>
          <div class="info-value">${record.courseId.code || 'N/A'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Time Taken</div>
          <div class="info-value">${time}</div>
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
            <th>Student ID</th>
            <th>Name</th>
            <th>Attendance Status</th>
          </tr>
        </thead>
        <tbody>
          ${sortedAttendees.map((attendee, index) => `
            <tr>
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
      
      <div class="disclaimer">
        Disclaimer: CR Attendance portal is not affiliated with university. It was created to help Class Representatives quickly prepare notebook attendance when needed. This record is intended for Section ${record.sectionId.name}.
      </div>
    </body>
    </html>
  `;
};