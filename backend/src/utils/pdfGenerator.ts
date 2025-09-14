import { jsPDF } from 'jspdf';
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

  try {
    // Validate required data before processing
    if (!record || !record.sectionId || !record.courseId || !record.attendees) {
      throw new Error('Invalid or incomplete attendance record data');
    }

    return await generateAttendancePDFWithJsPDF(record);
  } catch (error) {
    console.error('[PDF GENERATOR] PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const generateAttendancePDFWithJsPDF = async (record: PopulatedAttendanceRecord): Promise<Buffer> => {
  console.log('[PDF GENERATOR] Using jsPDF for PDF generation...');

  try {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Safely extract data with fallbacks
    const sectionName = record.sectionId?.name || 'Unknown Section';
    const courseName = record.courseId?.name || 'Unknown Course';
    const date = new Date(record.date).toLocaleDateString('en-US');

    console.log('[PDF GENERATOR] Processing record for:', { sectionName, courseName, date });

    // Validate attendees data
    if (!Array.isArray(record.attendees) || record.attendees.length === 0) {
      throw new Error('No attendees data found in the record');
    }

    // Sort attendees by student ID
    const sortedAttendees = [...record.attendees].sort((a, b) => {
      const idA = a.studentId?.studentId || '';
      const idB = b.studentId?.studentId || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });

    console.log('[PDF GENERATOR] Processing', sortedAttendees.length, 'attendees');

    const addWatermark = () => {
      try {
        // Simple watermark without graphics state manipulation that might fail
        doc.setTextColor(200, 200, 200); // Light gray
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(60);

        // Calculate center position and add rotated text
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        // Add watermark text
        doc.text(sectionName, centerX, centerY, {
          angle: -45,
          align: 'center'
        });

        // Reset text color
        doc.setTextColor(0, 0, 0);
      } catch (error) {
        console.warn('[PDF GENERATOR] Watermark failed, continuing without it:', error);
        // Continue without watermark if it fails
      }
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

    try {
      // Get PDF as array buffer and convert to Buffer
      const arrayBuffer = doc.output('arraybuffer');
      const buffer = Buffer.from(arrayBuffer);

      if (!buffer || buffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      console.log('[PDF GENERATOR] PDF buffer size:', buffer.length, 'bytes');
      return buffer;
    } catch (error) {
      console.error('[PDF GENERATOR] Failed to generate PDF buffer:', error);
      throw new Error(`Failed to generate PDF buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('[PDF GENERATOR] PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};