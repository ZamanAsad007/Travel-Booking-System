import nodemailer from 'nodemailer';
import { config } from './env.js';

const transportOptions = {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  ignoreTLS: true,
};

if (config.smtp.user && config.smtp.pass) {
  transportOptions.auth = {
    user: config.smtp.user,
    pass: config.smtp.pass,
  };
}

export const transporter = nodemailer.createTransport(transportOptions);

export async function verifySmtp() {
  try {
    await transporter.verify();
    console.log(
      `[notification-service] SMTP server connected successfully at ${config.smtp.host}:${config.smtp.port}`
    );
    return true;
  } catch (err) {
    console.warn(
      `[notification-service] SMTP verification failed (${err.message}). Emails will be logged locally as fallback.`
    );
    return false;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html,
    });
    console.log(
      `[notification-service] Email sent to ${to}: ${subject} (messageId: ${info.messageId})`
    );
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[notification-service] Error sending email to ${to}:`, err.message);
    // Print fallback log
    console.log(
      `[notification-service:fallback-log]\nTO: ${to}\nSUBJECT: ${subject}\nBODY:\n${text}`
    );
    return { success: false, error: err.message };
  }
}
