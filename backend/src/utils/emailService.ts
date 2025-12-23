import nodemailer, { Transporter } from 'nodemailer';
import { envVars } from '../config/env';
import { AnnouncementType, IAnnouncementDetails } from '../models';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
}

export interface AnnouncementEmailData {
    title: string;
    type: AnnouncementType;
    message: string;
    courseName: string;
    senderName: string;
    details?: IAnnouncementDetails;
}

// Create transporter
let transporter: Transporter;

const createTransporter = (): Transporter => {
    if (transporter) return transporter;

    const emailConfig = {
        host: envVars.EMAIL_HOST,
        port: parseInt(envVars.EMAIL_PORT),
        secure: envVars.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: envVars.EMAIL_USER,
            pass: envVars.EMAIL_PASSWORD,
        },
    };

    transporter = nodemailer.createTransport(emailConfig);
    return transporter;
};

/**
 * Send a single email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        const mailer = createTransporter();
        
        const mailOptions = {
            from: `"CR Portal" <${envVars.EMAIL_FROM}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text.replace(/\n/g, '<br>'),
        };

        await mailer.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${options.to}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

/**
 * Send announcement emails to multiple recipients
 */
export const sendAnnouncementEmails = async (
    recipients: string[],
    announcementData: AnnouncementEmailData
): Promise<{ sent: number; failed: number; recipients: string[] }> => {
    const { title, type, message, courseName, senderName, details } = announcementData;

    // Generate email content
    const emailText = generateAnnouncementText(announcementData);
    const emailHtml = generateAnnouncementHtml(announcementData);

    const subject = `[${type.toUpperCase()}] ${title} - ${courseName}`;

    let sent = 0;
    let failed = 0;
    const successRecipients: string[] = [];

    // Send emails in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const promises = batch.map(async (email) => {
            const success = await sendEmail({
                to: email,
                subject,
                text: emailText,
                html: emailHtml,
            });

            if (success) {
                sent++;
                successRecipients.push(email);
            } else {
                failed++;
            }
        });

        await Promise.all(promises);
    }

    console.log(`📧 Announcement emails sent: ${sent} succeeded, ${failed} failed`);
    
    return { sent, failed, recipients: successRecipients };
};

/**
 * Generate plain text version of announcement with emojis
 */
export const generateAnnouncementText = (data: AnnouncementEmailData): string => {
    const { title, type, message, courseName, senderName, details } = data;

    // Type-specific emoji
    const typeEmojis: Record<AnnouncementType, string> = {
        'quiz-1': '📢',
        'quiz-2': '📢',
        'quiz-3': '📢',
        'quiz-4': '📢',
        presentation: '🎤',
        midterm: '📝',
        final: '📝',
        assignment: '📋',
        class_cancel: '🚫',
        class_reschedule: '🔄',
    };

    const emoji = typeEmojis[type] || '📢';

    let text = `${emoji} ${title}\n\n`;
    text += `📘 Course: ${courseName}\n`;

    if (details) {
        if (details.time) text += `🗓 Time: ${formatDateTime(details.time)}\n`;
        if (details.room) text += `🏫 Room: ${details.room}\n`;
        if (details.topic) text += `📝 Topic: ${details.topic}\n`;
        if (details.slideLink) text += `🔗 Slides: ${details.slideLink}\n`;
    }

    // Optional message
    if (message && message.trim()) {
        text += `\n💬 Message:\n${message}\n`;
    }

    text += `\n---\n`;
    text += `👤 Sent by: ${senderName}`;

    return text;
};

/**
 * Generate HTML version of announcement
 */
export const generateAnnouncementHtml = (data: AnnouncementEmailData): string => {
    const { title, type, message, courseName, senderName, details } = data;

    const typeColors: Record<AnnouncementType, string> = {
        'quiz-1': '#3b82f6',
        'quiz-2': '#3b82f6',
        'quiz-3': '#3b82f6',
        'quiz-4': '#3b82f6',
        presentation: '#8b5cf6',
        midterm: '#ef4444',
        final: '#dc2626',
        assignment: '#f59e0b',
        class_cancel: '#64748b',
        class_reschedule: '#0ea5e9',
    };

    const typeBackgrounds: Record<AnnouncementType, string> = {
        'quiz-1': '#eff6ff',
        'quiz-2': '#eff6ff',
        'quiz-3': '#eff6ff',
        'quiz-4': '#eff6ff',
        presentation: '#f5f3ff',
        midterm: '#fef2f2',
        final: '#fef2f2',
        assignment: '#fff7ed',
        class_cancel: '#f8fafc',
        class_reschedule: '#f0f9ff',
    };

    const typeEmojis: Record<AnnouncementType, string> = {
        'quiz-1': '📝',
        'quiz-2': '📝',
        'quiz-3': '📝',
        'quiz-4': '📝',
        presentation: '🎤',
        midterm: '📚',
        final: '🎓',
        assignment: '📋',
        class_cancel: '🚫',
        class_reschedule: '🔄',
    };

    const color = typeColors[type] || '#6b7280';
    const bgColor = typeBackgrounds[type] || '#f9fafb';
    const emoji = typeEmojis[type] || '📢';

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>${title}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-padding { padding: 12px !important; }
            .mobile-text { font-size: 14px !important; }
            .mobile-title { font-size: 20px !important; }
            .mobile-subtitle { font-size: 13px !important; }
            .mobile-icon { width: 44px !important; height: 44px !important; line-height: 44px !important; font-size: 22px !important; margin-bottom: 10px !important; }
            .mobile-badge { font-size: 12px !important; padding: 6px 14px !important; }
            .mobile-label { font-size: 10px !important; padding: 3px 6px !important; }
            .mobile-detail-text { font-size: 14px !important; }
            .mobile-button { padding: 10px 20px !important; font-size: 13px !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
            .mobile-header { padding: 20px 16px 18px 16px !important; }
            .mobile-decorative { display: none !important; }
        }
        
        @media only screen and (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1f2937 !important; }
            .dark-mode-text { color: #f9fafb !important; }
            .dark-mode-card { background-color: #374151 !important; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; min-width: 100%; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Preview Text -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        ${formatAnnouncementType(type)} announcement for ${courseName}${details?.topic ? ': ' + details.topic : ''}
    </div>
    
    <!-- Preheader Spacer -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        ‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;
    </div>

    <!-- Main Wrapper -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: #f3f4f6; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 20px;" class="mobile-padding">
                
                <!-- Main Container -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                    
                    <!-- Gradient Header with Pattern -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${color} 0%, ${color}ee 50%, ${color}dd 100%); padding: 28px 20px 24px 20px; text-align: center; position: relative;" class="mobile-header">
                            <!-- Decorative circles (hidden on mobile) -->
                            <div class="mobile-decorative" style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
                            <div class="mobile-decorative" style="position: absolute; bottom: -25px; left: -25px; width: 100px; height: 100px; background: rgba(255,255,255,0.06); border-radius: 50%;"></div>
                            
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; position: relative; z-index: 1;">
                                <tr>
                                    <td style="text-align: center;">
                                        <!-- Icon Badge with Animation-ready styling -->
                                        <div style="display: inline-block; background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border-radius: 50%; width: 56px; height: 56px; line-height: 56px; margin-bottom: 14px; box-shadow: 0 6px 12px rgba(0,0,0,0.1); border: 2px solid rgba(255,255,255,0.3);" class="mobile-icon">
                                            <span style="font-size: 28px; display: inline-block;">${emoji}</span>
                                        </div>
                                        
                                        <!-- Title with Letter Spacing -->
                                        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); line-height: 1.2;" class="mobile-title">
                                            ${title}
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Course Badge with Shadow -->
                    <tr>
                        <td style="padding: 20px 24px 0 24px;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="display: inline-block; background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); border: 2px solid ${color}; border-radius: 10px; padding: 10px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);" class="mobile-badge">
                                            <p style="margin: 0; color: ${color}; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center;">
                                                <span style="font-size: 16px; margin-right: 6px;">📚</span>
                                                ${courseName}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
`;

    // Enhanced Details Section
    if (details && (details.topic || details.time || details.room || details.slideLink)) {
        html += `
                    <!-- Details Section with Cards -->
                    <tr>
                        <td style="padding: 20px;" class="mobile-padding">
                            <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}80 100%); border-left: 4px solid ${color}; border-radius: 12px; padding: 18px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);">
                                
                                <!-- Section Header -->
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 12px;">
                                    <tr>
                                        <td>
                                            <h2 style="margin: 0; color: #111827; font-size: 17px; font-weight: 700; display: flex; align-items: center;">
                                                <span style="font-size: 19px; margin-right: 6px;">📋</span>
                                                Details
                                            </h2>
                                        </td>
                                    </tr>
                                </table>
                                
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
`;
        if (details.topic) {
            html += `
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <div style="background: #ffffff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid ${color}18;">
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                                    <tr>
                                                        <td style="width: 85px; vertical-align: top;" class="mobile-stack">
                                                            <span style="display: inline-block; background: ${color}; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;" class="mobile-label">✏️ Topic</span>
                                                        </td>
                                                        <td style="padding-left: 10px; color: #1f2937; font-size: 15px; font-weight: 600; line-height: 1.4;" class="mobile-detail-text mobile-stack">
                                                            ${details.topic}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
`;
        }
        if (details.time) {
            html += `
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <div style="background: #ffffff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid ${color}18;">
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                                    <tr>
                                                        <td style="width: 85px; vertical-align: top;" class="mobile-stack">
                                                            <span style="display: inline-block; background: ${color}; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;" class="mobile-label">⏰ Time</span>
                                                        </td>
                                                        <td style="padding-left: 10px; color: #1f2937; font-size: 15px; font-weight: 600; line-height: 1.4;" class="mobile-detail-text mobile-stack">
                                                            ${formatDateTime(details.time)}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
`;
        }
        if (details.room) {
            html += `
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <div style="background: #ffffff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid ${color}18;">
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                                    <tr>
                                                        <td style="width: 85px; vertical-align: top;" class="mobile-stack">
                                                            <span style="display: inline-block; background: ${color}; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;" class="mobile-label">🚪 Room</span>
                                                        </td>
                                                        <td style="padding-left: 10px; color: #1f2937; font-size: 15px; font-weight: 600; line-height: 1.4;" class="mobile-detail-text mobile-stack">
                                                            ${details.room}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
`;
        }
        if (details.slideLink) {
            html += `
                                    <tr>
                                        <td style="padding: 12px 0 0 0;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                                <tr>
                                                    <td style="text-align: center; padding-top: 8px;">
                                                        <a href="${details.slideLink}" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); letter-spacing: 0.3px; transition: all 0.2s; border: 2px solid ${color};" class="mobile-button">
                                                            <span style="font-size: 18px; margin-right: 6px;">🔗</span>
                                                            View Presentation List Sheet
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
`;
        }
        html += `
                                </table>
                            </div>
                        </td>
                    </tr>
`;
    }

    // Enhanced Message Section
    if (message && message.trim()) {
        html += `
                    <!-- Message Section with Quote Style -->
                    <tr>
                        <td style="padding: 0 24px 24px 24px;" class="mobile-padding">
                            <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 24px; border: 2px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                    <tr>
                                        <td>
                                            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                                                <span style="font-size: 20px; margin-right: 8px;">💬</span>
                                                Message
                                            </h2>
                                            <div style="border-left: 4px solid ${color}; padding-left: 16px; margin-top: 12px;">
                                                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.7; white-space: pre-wrap; font-weight: 500;" class="mobile-text">${message}</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
`;
    }

    html += `
                    <!-- Modern Footer with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%); padding: 28px 24px; border-top: 2px solid #e5e7eb;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center;">
                                        <!-- Sender Info with Avatar Style -->
                                        <div style="display: inline-block; background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}80 100%); border-radius: 100px; padding: 10px 20px; margin-bottom: 16px; border: 2px solid ${color}33;">
                                            <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                                                <span style="font-size: 16px; margin-right: 6px;">👤</span>
                                                <strong style="color: ${color};">Sent by:</strong> ${senderName}
                                            </p>
                                        </div>
                                        
                                        <!-- Divider -->
                                        <div style="margin: 20px auto; height: 2px; max-width: 100px; background: linear-gradient(to right, transparent, ${color}44, transparent);"></div>
                                        
                                        <!-- Branding -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-top: 16px;">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                                        📧 Automated notification from
                                                    </p>
                                                    <div style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 8px 20px; border-radius: 8px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                        CR Portal
                                                    </div>
                                                    <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 12px; font-weight: 500;">
                                                        CR Attendance & Announcement System
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                
                <!-- Bottom Copyright with Year -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: center; padding: 16px;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${new Date().getFullYear()} <strong style="color: ${color};">CR Portal</strong>. All rights reserved.
                            </p>
                            <p style="margin: 6px 0 0 0; color: #d1d5db; font-size: 11px;">
                                Powered by BornoSoft
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
`;

    return html;
};

/**
 * Format announcement type for display
 */
const formatAnnouncementType = (type: AnnouncementType): string => {
    const typeMap: Record<AnnouncementType, string> = {
        'quiz-1': 'Quiz-1',
        'quiz-2': 'Quiz-2',
        'quiz-3': 'Quiz-3',
        'quiz-4': 'Quiz-4',
        presentation: 'Presentation',
        midterm: 'Midterm Exam',
        final: 'Final Exam',
        assignment: 'Assignment',
        class_cancel: 'Class Cancelled',
        class_reschedule: 'Class Rescheduled',
    };
    return typeMap[type] || type;
};

/**
 * Format date and time for display
 */
const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
    try {
        const mailer = createTransporter();
        await mailer.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server verification failed:', error);
        return false;
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string,
    userName: string
): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const expiryTime = '1 hour';

    const subject = 'Password Reset Request - CR Attendance Portal';

    const text = `
Hello ${userName},

You requested to reset your password for your CR Attendance Portal account.

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiryTime}.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
CR Attendance Portal Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    You requested to reset your password for your CR Attendance Portal account.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                    This link will expire in <strong>${expiryTime}</strong>.
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                    If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If the button doesn't work, copy and paste this link:<br>
                    <a href="${resetLink}" style="color: #6366f1; word-break: break-all;">${resetLink}</a>
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} CR Attendance Portal. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    return sendEmail({ to: email, subject, text, html });
};

/**
 * Send password changed confirmation email
 */
export const sendPasswordChangedEmail = async (
    email: string,
    userName: string
): Promise<boolean> => {
    const subject = 'Password Changed Successfully - CR Attendance Portal';

    const text = `
Hello ${userName},

Your password for CR Attendance Portal has been changed successfully.

If you did not make this change, please contact support immediately.

Best regards,
CR Attendance Portal Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Password Changed</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Your password for CR Attendance Portal has been changed successfully.
                </p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0;">
                        <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact support immediately.
                    </p>
                </div>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} CR Attendance Portal. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    return sendEmail({ to: email, subject, text, html });
};

/**
 * Send 2FA enabled confirmation email
 */
export const send2FAEnabledEmail = async (
    email: string,
    userName: string
): Promise<boolean> => {
    const subject = '2FA Enabled - CR Attendance Portal';

    const text = `
Hello ${userName},

Two-Factor Authentication (2FA) has been enabled on your CR Attendance Portal account.

Your account is now more secure. You will need to enter a code from your authenticator app each time you log in.

Make sure to save your backup codes in a safe place!

If you did not enable 2FA, please contact support immediately.

Best regards,
CR Attendance Portal Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔒 2FA Enabled</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Two-Factor Authentication (2FA) has been enabled on your CR Attendance Portal account.
                </p>
                
                <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #065f46; font-size: 14px; margin: 0;">
                        <strong>🛡️ Your account is now more secure!</strong><br>
                        You will need to enter a code from your authenticator app each time you log in.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>Important:</strong> Make sure to save your backup codes in a safe place!
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} CR Attendance Portal. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    return sendEmail({ to: email, subject, text, html });
};
