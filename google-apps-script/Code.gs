// ============================================================
// MaritimeEdge — Google Apps Script
// Handles newsletter subscriptions, RFQ submissions,
// and bulk email sending.
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com and create a new project
// 2. Paste this entire file into Code.gs
// 3. Create a Google Sheet with two tabs: "Subscribers" and "RFQ Submissions"
// 4. Update SHEET_ID below with your Google Sheet ID
// 5. Deploy → New Deployment → Web App → Execute as "Me" → Access "Anyone"
// 6. Copy the Web App URL and paste it into js/script.js as GOOGLE_SCRIPT_URL
// ============================================================

// ─── CONFIGURATION ──────────────────────────────────────────
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your Google Sheet ID
const NOTIFICATION_EMAILS = ['mailabhilashganji@gmail.com', 'esrikanth.sri@gmail.com'];
const SUBSCRIBER_SHEET_NAME = 'Subscribers';
const RFQ_SHEET_NAME = 'RFQ Submissions';

// ─── WEB APP ENTRY POINT ────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'subscriber') {
      return handleSubscriber(data);
    } else if (data.type === 'rfq') {
      return handleRFQ(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown type' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow GET requests for testing
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'MaritimeEdge API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── NEWSLETTER SUBSCRIBER ──────────────────────────────────
function handleSubscriber(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SUBSCRIBER_SHEET_NAME);

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SUBSCRIBER_SHEET_NAME);
    sheet.appendRow(['Email', 'Timestamp', 'Source Page']);
  }

  // Check for duplicate email
  const emails = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().flat();
  if (emails.includes(data.email)) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'duplicate', message: 'Already subscribed' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Add new subscriber
  sheet.appendRow([
    data.email,
    data.timestamp || new Date().toISOString(),
    data.source || 'unknown'
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'Subscribed' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── RFQ SUBMISSION ─────────────────────────────────────────
function handleRFQ(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(RFQ_SHEET_NAME);

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(RFQ_SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Full Name', 'Email', 'Phone', 'Company',
      'Origin Port', 'Destination', 'Shipment Type', 'Cargo Weight',
      'Commodity', 'Incoterm', 'Ready Date', 'Message'
    ]);
  }

  // Add RFQ row
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.fullName || '',
    data.email || '',
    data.phone || '',
    data.company || '',
    data.origin || '',
    data.destination || '',
    data.shipmentType || '',
    data.cargoWeight || '',
    data.commodity || '',
    data.incoterm || '',
    data.readyDate || '',
    data.message || ''
  ]);

  // Send email notification
  sendRFQNotification(data);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'RFQ submitted' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── RFQ EMAIL NOTIFICATION ─────────────────────────────────
function sendRFQNotification(data) {
  const subject = `New Sea Freight RFQ: ${data.origin} → ${data.destination} (${data.shipmentType})`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0052CC; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">⚓ MaritimeEdge — New Quote Request</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <h2 style="color: #0052CC; margin-top: 0;">Shipment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; width: 40%;">Name:</td><td>${data.fullName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td><a href="mailto:${data.email}">${data.email || 'N/A'}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${data.phone || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.company || 'N/A'}</td></tr>
          <tr style="background: #e8f4fd;"><td style="padding: 8px; font-weight: bold;">Origin Port:</td><td style="padding: 8px;">${data.origin || 'N/A'}</td></tr>
          <tr style="background: #e8f4fd;"><td style="padding: 8px; font-weight: bold;">Destination:</td><td style="padding: 8px;">${data.destination || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Shipment Type:</td><td>${data.shipmentType || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Cargo Weight:</td><td>${data.cargoWeight || 'N/A'} kg</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Commodity:</td><td>${data.commodity || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Incoterm:</td><td>${data.incoterm || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Cargo Ready:</td><td>${data.readyDate || 'N/A'}</td></tr>
        </table>
        ${data.message ? `<div style="margin-top: 16px; padding: 12px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;"><strong>Additional Notes:</strong><br>${data.message}</div>` : ''}
      </div>
      <div style="padding: 16px; background: #1a1a2e; color: #aaa; border-radius: 0 0 8px 8px; font-size: 12px; text-align: center;">
        MaritimeEdge — A Vasera Global Initiative | Submitted: ${data.timestamp || new Date().toISOString()}
      </div>
    </div>
  `;

  NOTIFICATION_EMAILS.forEach(email => {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  });
}

// ============================================================
// BULK EMAIL FUNCTION
// Run this manually from the Apps Script editor to send
// newsletters to all subscribers.
//
// Usage:
//   1. Open this script in the Apps Script editor
//   2. Select sendBulkEmail from the function dropdown
//   3. Click Run
//   4. Or call: sendBulkEmail('Your Subject', '<h1>HTML content</h1>')
// ============================================================

function sendBulkEmail(subject, htmlBody) {
  // Default content if called without arguments (for manual trigger)
  if (!subject) {
    subject = 'MaritimeEdge Weekly — Indian Shipping Intelligence';
  }
  if (!htmlBody) {
    htmlBody = getDefaultNewsletterTemplate();
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SUBSCRIBER_SHEET_NAME);

  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('No subscribers found.');
    return;
  }

  // Get all emails (skip header row)
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const emails = data.map(row => row[0]).filter(email => email && email.includes('@'));

  Logger.log('Sending newsletter to ' + emails.length + ' subscribers...');

  let sent = 0;
  let failed = 0;

  emails.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: wrapNewsletterTemplate(htmlBody, email)
      });
      sent++;
    } catch (error) {
      Logger.log('Failed to send to ' + email + ': ' + error.toString());
      failed++;
    }
  });

  Logger.log('Newsletter sent! Success: ' + sent + ', Failed: ' + failed);

  // Notify admins about the send
  NOTIFICATION_EMAILS.forEach(adminEmail => {
    MailApp.sendEmail({
      to: adminEmail,
      subject: '[MaritimeEdge] Newsletter Sent — ' + sent + ' recipients',
      htmlBody: '<p>Newsletter "<strong>' + subject + '</strong>" was sent to <strong>' + sent + '</strong> subscribers. Failed: ' + failed + '.</p>'
    });
  });
}

// ─── Newsletter Email Template Wrapper ───────────────────────
function wrapNewsletterTemplate(bodyContent, recipientEmail) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0052CC; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">⚓ MaritimeEdge</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">Indian Shipping Intelligence — Weekly</p>
      </div>
      <div style="padding: 24px;">
        ${bodyContent}
      </div>
      <div style="padding: 20px; background: #1a1a2e; color: #999; text-align: center; font-size: 12px;">
        <p style="margin: 0;">MaritimeEdge — A <a href="https://vaseraglobal.com" style="color: #00B8D9;">Vasera Global</a> Initiative</p>
        <p style="margin: 8px 0 0;">You received this because ${recipientEmail} is subscribed to MaritimeEdge updates.</p>
      </div>
    </div>
  `;
}

// ─── Default Newsletter Template ─────────────────────────────
function getDefaultNewsletterTemplate() {
  return `
    <h2 style="color: #0052CC;">This Week in Indian Shipping</h2>
    <p>Here are the top stories from Indian ports and sea freight this week:</p>

    <div style="border-left: 3px solid #0052CC; padding-left: 16px; margin: 16px 0;">
      <h3 style="margin: 0;">📰 Top Headlines</h3>
      <ul style="color: #555;">
        <li>JNPT implements new container tracking system</li>
        <li>Mundra port expansion phase 2 begins</li>
        <li>DGFT issues new Foreign Trade Policy amendment</li>
      </ul>
    </div>

    <div style="border-left: 3px solid #00875A; padding-left: 16px; margin: 16px 0;">
      <h3 style="margin: 0;">📊 Rate Watch</h3>
      <ul style="color: #555;">
        <li>India–Europe rates: $2,800–$3,200/TEU</li>
        <li>India–US East Coast: $3,200–$3,600/TEU</li>
        <li>India–Middle East: $800–$1,100/TEU</li>
      </ul>
    </div>

    <p style="text-align: center; margin-top: 24px;">
      <a href="https://maritimeedge.com/news.html" style="background: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Read Full News →</a>
    </p>
  `;
}
