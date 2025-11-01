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
    status: 'present' | 'absent';
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
    // Initialize jsPDF with modern settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Safely extract data with fallbacks
    const sectionName = record.sectionId?.name || 'Unknown Section';
    const courseName = record.courseId?.name || 'Unknown Course';
    const date = new Date(record.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const takenByName = record.takenBy?.name || 'Unknown';

    console.log('[PDF GENERATOR] Processing record for:', { sectionName, courseName, date });

    // Validate attendees data
    if (!Array.isArray(record.attendees) || record.attendees.length === 0) {
      throw new Error('No attendees data found in the record');
    }

    // Filter out attendees with null student data and sort by student ID
    const validAttendees = record.attendees.filter(a => a.studentId !== null && a.studentId !== undefined);
    
    if (validAttendees.length === 0) {
      throw new Error('No valid student data found in attendance record');
    }
    
    const sortedAttendees = [...validAttendees].sort((a, b) => {
      const idA = a.studentId?.studentId || '';
      const idB = b.studentId?.studentId || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });

    const skippedCount = record.attendees.length - validAttendees.length;
    if (skippedCount > 0) {
      console.warn(`[PDF GENERATOR] Skipped ${skippedCount} attendee(s) with null student data`);
    }

    console.log('[PDF GENERATOR] Processing', sortedAttendees.length, 'attendees');

    // Define colors for the modern design
    const colors = {
      primary: '#3B82F6',
      secondary: '#64748B',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#8B5CF6',
      light: '#F8FAFC',
      dark: '#1E293B',
      border: '#E2E8F0'
    };


    const addDisclaimer = () => {
      const disclaimerText = `Disclaimer: CR Attendance portal is not affiliated with any university. It was created to help Class Representatives quickly prepare notebook attendance when needed. This record is intended for Section ${sectionName}.`;

      // Create a styled box for disclaimer
      const boxMargin = 15;
      const boxHeight = 35;
      const boxY = pageHeight - boxHeight - 10;

      // Draw light blue disclaimer box
      doc.setFillColor(219, 234, 254); // Light blue background
      doc.roundedRect(boxMargin, boxY, pageWidth - 2 * boxMargin, boxHeight, 3, 3, 'F');

      // Draw blue border
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(0.5);
      doc.roundedRect(boxMargin, boxY, pageWidth - 2 * boxMargin, boxHeight, 3, 3, 'S');

      // Add disclaimer text
      doc.setTextColor(30, 64, 175); // Dark blue text
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);

      const splitText = doc.splitTextToSize(disclaimerText, pageWidth - 40);
      const textY = boxY + 10;
      doc.text(splitText, pageWidth / 2, textY, {
        align: 'center'
      });
    };

    const addPageNumber = (currentPage: number, totalPages: number) => {
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, pageHeight - 5, {
        align: 'right'
      });
    };

    const addFooter = () => {
      const footerY = pageHeight - 15;

      // Footer line
      doc.setDrawColor(colors.border);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      // Generated info
      doc.setTextColor(colors.secondary);
      doc.setFontSize(9);
      doc.text(`Generated by: ${takenByName}`, margin, footerY + 5);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY + 5, { align: 'right' });
    };

    // Calculate total pages needed
    const rowsPerPage = 15; // Increased rows per page with compact design
    const totalPages = Math.ceil(sortedAttendees.length / rowsPerPage) || 1;
    let currentPage = 1;

    // Course and section info - moved to top
    doc.setFontSize(14);
    doc.setTextColor(colors.primary);
    doc.text(courseName, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(colors.secondary);
    doc.text(`Section: ${sectionName}`, pageWidth / 2, 27, { align: 'center' });
    doc.text(`Date: ${date}`, pageWidth / 2, 34, { align: 'center' });

    // Statistics with modern cards design
    const presentCount = record.attendees.filter(a => a.status === 'present').length;
    const absentCount = record.attendees.filter(a => a.status === 'absent').length;
    const totalStudents = record.attendees.length;

    const statsY = 45;
    const statWidth = (contentWidth - 10) / 3; // 3 stats with spacing

    const drawStatCard = (x: number, y: number, width: number, title: string, value: number, color: string) => {
      // Card background
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, y, width, 20, 3, 3, 'F');

      // Border
      doc.setDrawColor(color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, width, 20, 3, 3, 'S');

      // Title
      doc.setTextColor(colors.secondary);
      doc.setFontSize(9);
      doc.text(title, x + width / 2, y + 7, { align: 'center' });

      // Value
      doc.setTextColor(color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(value.toString(), x + width / 2, y + 15, { align: 'center' });
    };

    // Draw stat cards (only Total, Present, Absent)
    drawStatCard(margin, statsY, statWidth, 'Total', totalStudents, colors.primary);
    drawStatCard(margin + statWidth + 5, statsY, statWidth, 'Present', presentCount, colors.success);
    drawStatCard(margin + (statWidth + 5) * 2, statsY, statWidth, 'Absent', absentCount, colors.danger);

    // Table header
    const tableStartY = statsY + 30;
    let currentY = tableStartY;

    const drawTableHeader = (y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(colors.primary);
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');

      // Column headers (removed Note column)
      doc.text('#', margin + 5, y + 5.5);
      doc.text('Student ID', margin + 20, y + 5.5);
      doc.text('Name', margin + 70, y + 5.5);
      doc.text('Status', margin + 140, y + 5.5);

      return y + 8;
    };

    currentY = drawTableHeader(currentY);

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.dark);
    let rowIndex = 0;

    sortedAttendees.forEach((attendee, index) => {
      // Skip if student data is null (student might be deleted)
      if (!attendee.studentId) {
        console.warn(`[PDF GENERATOR] Skipping attendee at index ${index} - student data is null`);
        return;
      }

      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        // Add footer to current page
        addFooter();
        addPageNumber(currentPage, totalPages);

        // Start new page
        doc.addPage();
        currentPage++;
        currentY = margin + 20;
        currentY = drawTableHeader(currentY);
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251); // Light gray
        doc.rect(margin, currentY, contentWidth, 7, 'F');
      }

      // Student data with null safety
      const studentId = attendee.studentId?.studentId || 'N/A';
      const studentName = attendee.studentId?.name || 'Deleted Student';
      const status = attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1);

      doc.setFontSize(9);

      // Row number
      doc.setTextColor(colors.secondary);
      doc.text((index + 1).toString(), margin + 5, currentY + 4.5);

      // Student ID
      doc.setTextColor(colors.dark);
      doc.text(studentId, margin + 20, currentY + 4.5);

      // Name
      doc.text(studentName, margin + 70, currentY + 4.5);

      // Status with color coding (only Present/Absent)
      let displayStatus = 'Absent';
      let statusColor = colors.danger;

      if (attendee.status !== 'absent') {
        displayStatus = 'Present';
        statusColor = colors.success;
      }

      doc.setTextColor(statusColor);
      doc.text(displayStatus, margin + 140, currentY + 4.5);

      currentY += 7;
      rowIndex++;
    });

    // Add footer to last page
    addFooter();
    addPageNumber(currentPage, totalPages);

    // Only add disclaimer to the last page
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