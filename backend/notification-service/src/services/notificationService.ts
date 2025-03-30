import twilio from 'twilio';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Twilio client setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);



const orderStatusTemplatesPath = path.join(__dirname, '../data/orderStatusTemplates.json');

// Send order status notifications (SMS and Email)
export const sendOrderStatusNotification = async (
  status: string,
  phoneNumber: string,
  email: string,
  orderId: string
): Promise<void> => {
  try {
    // Read the order status templates
    const rawData = fs.readFileSync(orderStatusTemplatesPath, 'utf-8');
    const templates = JSON.parse(rawData);

    // Check if the requested status template exists
    const template = templates[status];
    if (!template) {
      throw new Error(`No template found for status: ${status}`);
    }

    // Customize the template with the order ID
    const smsMessage = `📦 Order (#${orderId}) Update: ${template.text}`;
    const emailSubject = `🚚 Order Status Update - Your Order (#${orderId}) is ${status}`;
    const emailText = `Your order (#${orderId}) status has been updated to: ${status}.\n\n${template.text}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745; text-align: center;">🚚 Order Status Update</h1>
        <p style="font-size: 18px; text-align: center;">Your order (#<strong>${orderId}</strong>) status has been updated to:</p>
        <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007bff;">${status}</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="font-size: 16px;">${template.text}</p>
        </div>
        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
          Thank you for choosing us! ❤️
        </p>
      </div>
    `;

    // Send SMS notification
    await sendSMS(phoneNumber, smsMessage);

    // Send email notification
    await sendEmail(email, emailSubject, emailText, emailHtml);

    console.log(`Order status notification sent for status: ${status}`);
  } catch (error) {
    console.error('Error sending order status notification:', error);
    throw error;
  }
};
// Nodemailer transporter setup
const emailTransporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send SMS notification
export const sendSMS = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    throw error;
  }
};

// Send email notification to a single recipient
export const sendEmail = async (
  email: string,
  subject: string,
  text: string,
  html?: string // Optional HTML content
): Promise<void> => {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text, // Plain text fallback
      html, // Optional HTML content
    });
    console.log(`Email sent to ${email}: ${subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw error;
  }
};

// Broadcast email to multiple recipients
export const broadcastEmails = async (
  filePath: string,
  subject: string,
  text: string,
  html?: string // Optional HTML content
): Promise<void> => {
  try {
    // Read the JSON file containing email addresses
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const { recipients }: { recipients: string[] } = JSON.parse(rawData);

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('No recipients found in the JSON file.');
    }

    // Send emails to all recipients
    for (const email of recipients) {
      await sendEmail(email, subject, text, html);
    }

    console.log(`Broadcasted emails to ${recipients.length} recipients.`);
  } catch (error) {
    console.error('Error broadcasting emails:', error);
    throw error;
  }
};


// Send customized emails to multiple recipients
export const sendCustomEmails = async (
  emails: { email: string; subject: string; text: string; html?: string }[]
): Promise<void> => {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('No emails provided.');
    }

    // Send emails to all recipients with their custom content
    for (const emailObj of emails) {
      const { email, subject, text, html } = emailObj;
      await sendEmail(email, subject, text, html);
    }

    console.log(`Sent custom emails to ${emails.length} recipients.`);
  } catch (error) {
    console.error('Error sending custom emails:', error);
    throw error;
  }
};

export const sendEmailsFromTemplate = async (
  template: { subject: string; text: string; html?: string },
  recipients: string[]
): Promise<void> => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('No recipients provided.');
    }

    // Send emails to all recipients with the same template
    for (const email of recipients) {
      await sendEmail(email, template.subject, template.text, template.html);
    }

    console.log(`Sent emails to ${recipients.length} recipients using the template.`);
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
};