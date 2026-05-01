// ============================================================
// MaritimeEdge — Google Apps Script (Full Marketplace Backend)
// Handles: Newsletter, RFQ, Quotes, Payments, Notifications
//
// SETUP INSTRUCTIONS:
// 1. Create a new Google Apps Script project at https://script.google.com
// 2. Paste this file as Code.gs
// 3. Create admin panel HTML files (AdminLogin.html, AdminDashboard.html, AdminStyles.html)
// 4. Create a Google Sheet with tabs: Subscribers, RFQ Submissions, Logistics Partners, Quotes, Payments, Deals
// 5. Set Script Properties (File → Project settings → Script properties):
//    - SHEET_ID: your Google Sheet ID
//    - ADMIN_PASSWORD: your admin password
//    - TELEGRAM_BOT_TOKEN: from @BotFather
//    - TELEGRAM_ADMIN_CHAT_ID: your admin group chat ID
//    - RAZORPAY_KEY_ID: from Razorpay dashboard
//    - RAZORPAY_KEY_SECRET: from Razorpay dashboard
//    - RAZORPAY_WEBHOOK_SECRET: from Razorpay webhook settings
//    - COMMISSION_PERCENT: e.g., 1 (for 1%)
//    - QUOTE_TOKEN_SECRET: any random string for token generation
//    - SITE_URL: https://maritimeedge.in (or your GitHub Pages URL)
// 6. Deploy → New Deployment → Web App → Execute as "Me" → Access "Anyone"
// 7. Copy the Web App URL to js/script.js as GOOGLE_SCRIPT_URL
// ============================================================

// ─── CONFIGURATION (from Script Properties — NEVER hardcode secrets) ──
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    SHEET_ID: props.getProperty('SHEET_ID'),
    ADMIN_PASSWORD: props.getProperty('ADMIN_PASSWORD'),
    TELEGRAM_BOT_TOKEN: props.getProperty('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_ADMIN_CHAT_ID: props.getProperty('TELEGRAM_ADMIN_CHAT_ID'),
    RAZORPAY_KEY_ID: props.getProperty('RAZORPAY_KEY_ID'),
    RAZORPAY_KEY_SECRET: props.getProperty('RAZORPAY_KEY_SECRET'),
    RAZORPAY_WEBHOOK_SECRET: props.getProperty('RAZORPAY_WEBHOOK_SECRET'),
    COMMISSION_PERCENT: parseFloat(props.getProperty('COMMISSION_PERCENT') || '1'),
    QUOTE_TOKEN_SECRET: props.getProperty('QUOTE_TOKEN_SECRET') || 'default-secret-change-me',
    SITE_URL: props.getProperty('SITE_URL') || 'https://maritimeedge.in'
  };
}

// Admin notification emails (used only for critical fallback, not routine notifications)
var NOTIFICATION_EMAILS = ['mailabhilashganji@gmail.com', 'esrikanth.sri@gmail.com'];

// Sheet tab names
var TABS = {
  SUBSCRIBERS: 'Subscribers',
  RFQ: 'RFQ Submissions',
  PARTNERS: 'Logistics Partners',
  QUOTES: 'Quotes',
  PAYMENTS: 'Payments',
  DEALS: 'Deals'
};

// ─── WEB APP ENTRY POINTS ────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    switch (data.type) {
      case 'subscriber':
        return handleSubscriber(data);
      case 'rfq':
        return handleRFQ(data);
      case 'quote':
        return handleQuote(data);
      default:
        return jsonResponse({ status: 'error', message: 'Unknown type: ' + data.type });
    }
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'login';

  if (page === 'api-status') {
    return jsonResponse({ status: 'ok', message: 'MaritimeEdge Marketplace API running' });
  }

  // DEBUG: List all HTML files in this project
  try {
    var output = HtmlService.createHtmlOutputFromFile('AdminLogin');
    output.setTitle('MaritimeEdge Admin');
    return output;
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.toString() + '\n\nThis means the file "AdminLogin.html" does not exist in this GAS project. Check the filename in the sidebar.');
  }
}

// ─── HELPERS ─────────────────────────────────────────────────

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(tabName) {
  var config = getConfig();
  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  return ss.getSheetByName(tabName);
}

function getOrCreateSheet(tabName, headers) {
  var config = getConfig();
  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    if (headers && headers.length) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  return sheet;
}

function generateId(prefix, sheet) {
  var lastRow = sheet.getLastRow();
  return prefix + String(lastRow).padStart(3, '0');
}

function generateToken(partnerId, rfqId) {
  var config = getConfig();
  var raw = partnerId + '-' + rfqId + '-' + config.QUOTE_TOKEN_SECRET;
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return hash.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('').substring(0, 16);
}

function validateToken(partnerId, rfqId, token) {
  return generateToken(partnerId, rfqId) === token;
}

function formatINR(amount) {
  return '\u20B9' + Number(amount).toLocaleString('en-IN');
}

// Convert Date objects in a sheet row to ISO strings for safe google.script.run serialization
function safeRow(row) {
  return row.map(function(val) {
    if (val instanceof Date) return val.toISOString();
    if (val === null || val === undefined) return '';
    return val;
  });
}

function findRowByColumn(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][colIndex - 1] === value) return data[i];
  }
  return null;
}

function findRowNumberByColumn(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === value) return i + 2;
  }
  return -1;
}

function getPartnerName(partnerId) {
  var sheet = getSheet(TABS.PARTNERS);
  if (!sheet) return 'Unknown';
  var row = findRowByColumn(sheet, 1, partnerId);
  return row ? row[1] : 'Unknown';
}

function updateRFQStatus(rfqId, status) {
  var sheet = getSheet(TABS.RFQ);
  if (!sheet) return;
  var rowNum = findRowNumberByColumn(sheet, 1, rfqId);
  if (rowNum > 0) sheet.getRange(rowNum, 2).setValue(status);
}

// ─── 1. NEWSLETTER SUBSCRIBER ────────────────────────────────

function handleSubscriber(data) {
  var sheet = getOrCreateSheet(TABS.SUBSCRIBERS, ['Email', 'Timestamp', 'Source Page']);

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var emails = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    if (emails.indexOf(data.email) !== -1) {
      return jsonResponse({ status: 'duplicate', message: 'Already subscribed' });
    }
  }

  sheet.appendRow([data.email, data.timestamp || new Date().toISOString(), data.source || 'unknown']);
  sendSubscriberAcknowledgment(data.email);
  return jsonResponse({ status: 'success', message: 'Subscribed' });
}

function sendSubscriberAcknowledgment(email) {
  var config = getConfig();
  var siteUrl = config.SITE_URL;

  MailApp.sendEmail({
    to: email,
    subject: 'Welcome to MaritimeEdge \u2014 Indian Shipping Intelligence',
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
      '<div style="background:#0A2463;color:#fff;padding:24px;text-align:center;">' +
      '<h1 style="margin:0;font-size:22px;">\u2693 MaritimeEdge</h1>' +
      '<p style="margin:4px 0 0;opacity:0.8;font-size:13px;">Indian Shipping Intelligence</p></div>' +
      '<div style="padding:32px 24px;">' +
      '<h2 style="color:#0A2463;margin-top:0;">You\'re subscribed!</h2>' +
      '<p style="color:#333;line-height:1.6;">Thank you for subscribing to <strong>MaritimeEdge</strong>.</p>' +
      '<div style="text-align:center;margin:24px 0;">' +
      '<a href="' + siteUrl + '/news.html" style="background:#0A2463;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:4px;">Latest News</a>' +
      '<a href="' + siteUrl + '/tools.html" style="background:#10B981;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:4px;">EXIM Tools</a>' +
      '<a href="' + siteUrl + '/contact.html" style="background:#F59E0B;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:4px;">Get Quote</a></div></div>' +
      '<div style="padding:20px;background:#0F172A;color:#999;text-align:center;font-size:12px;">' +
      '<p style="margin:0;">MaritimeEdge \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</p></div></div>',
    name: 'MaritimeEdge'
  });
}

// ─── 2. RFQ SUBMISSION ──────────────────────────────────────

function handleRFQ(data) {
  var headers = [
    'RFQ ID', 'Status', 'Timestamp', 'Full Name', 'Email', 'Phone', 'Company',
    'Origin', 'Destination', 'Shipment Type', 'Cargo Weight', 'Commodity',
    'Shipment Value (INR)', 'Container Count', 'Incoterm', 'Ready Date',
    'Delivery Date', 'Message', 'Assigned Partners', 'Approved By', 'Approved At', 'Notes'
  ];
  var sheet = getOrCreateSheet(TABS.RFQ, headers);
  var rfqId = generateId('ME-RFQ-', sheet);

  sheet.appendRow([
    rfqId, 'Pending', data.timestamp || new Date().toISOString(),
    data.fullName || '', data.email || '', data.phone || '', data.company || '',
    data.origin || '', data.destination || '', data.shipmentType || '',
    data.cargoWeight || '', data.commodity || '', data.shipmentValue || '',
    data.containerCount || '', data.incoterm || '', data.readyDate || '',
    data.deliveryDate || '', data.message || '', '', '', '', ''
  ]);

  // Confirmation email to manufacturer
  sendRFQConfirmation(data, rfqId);

  // Notify admins via Telegram (primary) + email fallback
  sendTelegramToAdmin(
    '\uD83D\uDCE6 *New RFQ Received*\n\n' +
    '*ID:* ' + rfqId + '\n' +
    '*Route:* ' + (data.origin || 'N/A') + ' \u2192 ' + (data.destination || 'N/A') + '\n' +
    '*Type:* ' + (data.shipmentType || 'N/A') + '\n' +
    '*Cargo:* ' + (data.commodity || 'N/A') + '\n' +
    '*Value:* ' + formatINR(data.shipmentValue || 0) + '\n' +
    '*Company:* ' + (data.company || 'N/A') + '\n' +
    '*Contact:* ' + (data.fullName || 'N/A') + '\n\n' +
    '\uD83D\uDC49 Open Admin Panel to approve/reject.'
  );

  // Email fallback to admins (ensures notification even if Telegram fails)
  sendRFQNotificationEmail(data, rfqId);

  return jsonResponse({ status: 'success', message: 'RFQ submitted', rfqId: rfqId });
}

function sendRFQConfirmation(data, rfqId) {
  MailApp.sendEmail({
    to: data.email,
    subject: 'RFQ ' + rfqId + ' Received \u2014 MaritimeEdge',
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
      '<div style="background:#0A2463;color:#fff;padding:20px;text-align:center;">' +
      '<h1 style="margin:0;font-size:20px;">\u2693 MaritimeEdge \u2014 Quote Request Received</h1></div>' +
      '<div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">' +
      '<h2 style="color:#0A2463;margin-top:0;">Your RFQ has been submitted!</h2>' +
      '<p style="color:#333;line-height:1.6;">Thank you, <strong>' + (data.fullName || '') + '</strong>. Your quote request reference:</p>' +
      '<div style="text-align:center;margin:20px 0;padding:16px;background:#EEF2FF;border-radius:8px;">' +
      '<span style="font-size:1.5rem;font-weight:800;color:#0A2463;">' + rfqId + '</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">' +
      '<tr><td style="padding:8px 0;font-weight:bold;width:40%;">Route:</td><td>' + (data.origin || 'N/A') + ' \u2192 ' + (data.destination || 'N/A') + '</td></tr>' +
      '<tr><td style="padding:8px 0;font-weight:bold;">Shipment:</td><td>' + (data.shipmentType || 'N/A') + '</td></tr>' +
      '<tr><td style="padding:8px 0;font-weight:bold;">Cargo:</td><td>' + (data.commodity || 'N/A') + '</td></tr></table>' +
      '<p style="color:#555;line-height:1.6;margin-top:16px;">Our team will review your request and share it with verified logistics providers. You will receive competitive quotes within 24\u201348 business hours.</p></div>' +
      '<div style="padding:16px;background:#0F172A;color:#aaa;text-align:center;font-size:12px;">' +
      'MaritimeEdge \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</div></div>',
    name: 'MaritimeEdge'
  });
}

function sendRFQNotificationEmail(data, rfqId) {
  var subject = 'New RFQ: ' + rfqId + ' | ' + (data.origin || 'N/A') + ' \u2192 ' + (data.destination || 'N/A');
  var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
    '<div style="background:#0A2463;color:#fff;padding:20px;text-align:center;">' +
    '<h1 style="margin:0;font-size:20px;">\u2693 MaritimeEdge \u2014 New RFQ</h1></div>' +
    '<div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">' +
    '<h2 style="color:#0A2463;margin-top:0;">' + rfqId + '</h2>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr><td style="padding:8px 0;font-weight:bold;width:40%;">Name:</td><td>' + (data.fullName || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td><a href="mailto:' + (data.email || '') + '">' + (data.email || 'N/A') + '</a></td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Phone:</td><td>' + (data.phone || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Company:</td><td>' + (data.company || 'N/A') + '</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:8px;font-weight:bold;">Origin:</td><td style="padding:8px;">' + (data.origin || 'N/A') + '</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:8px;font-weight:bold;">Destination:</td><td style="padding:8px;">' + (data.destination || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Shipment Type:</td><td>' + (data.shipmentType || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Cargo Weight:</td><td>' + (data.cargoWeight || 'N/A') + ' kg</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Commodity:</td><td>' + (data.commodity || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Shipment Value:</td><td>' + formatINR(data.shipmentValue || 0) + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Container Count:</td><td>' + (data.containerCount || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Incoterm:</td><td>' + (data.incoterm || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Cargo Ready:</td><td>' + (data.readyDate || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:8px 0;font-weight:bold;">Delivery Date:</td><td>' + (data.deliveryDate || 'N/A') + '</td></tr>' +
    '</table>' +
    (data.message ? '<div style="margin-top:16px;padding:12px;background:#fff;border-radius:4px;border:1px solid #e5e7eb;"><strong>Notes:</strong><br>' + data.message + '</div>' : '') +
    '</div></div>';

  NOTIFICATION_EMAILS.forEach(function(email) {
    try {
      MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody, name: 'MaritimeEdge' });
    } catch (err) {
      Logger.log('Admin email failed for ' + email + ': ' + err.toString());
    }
  });
}

// ─── 3. QUOTE SUBMISSION ────────────────────────────────────

function handleQuote(data) {
  if (!validateToken(data.partnerId, data.rfqId, data.token)) {
    return jsonResponse({ status: 'error', message: 'Invalid token' });
  }

  var rfqSheet = getSheet(TABS.RFQ);
  if (!rfqSheet) return jsonResponse({ status: 'error', message: 'RFQ sheet not found' });

  var rfqData = findRowByColumn(rfqSheet, 1, data.rfqId);
  if (!rfqData) return jsonResponse({ status: 'error', message: 'RFQ not found' });

  var rfqStatus = rfqData[1];
  if (rfqStatus !== 'Approved' && rfqStatus !== 'Quoted') {
    return jsonResponse({ status: 'error', message: 'RFQ is not accepting quotes' });
  }

  var quotesHeaders = [
    'Quote ID', 'RFQ ID', 'Partner ID', 'Company Name', 'Quoted Price (INR)',
    'Transit Time (Days)', 'Validity (Days)', 'Breakdown', 'Notes',
    'Submitted At', 'Status', 'Rank'
  ];
  var quotesSheet = getOrCreateSheet(TABS.QUOTES, quotesHeaders);

  if (hasDuplicateQuote(quotesSheet, data.rfqId, data.partnerId)) {
    return jsonResponse({ status: 'error', message: 'You have already submitted a quote for this RFQ' });
  }

  var partnerName = getPartnerName(data.partnerId);
  var quoteId = generateId('QT-', quotesSheet);

  quotesSheet.appendRow([
    quoteId, data.rfqId, data.partnerId, partnerName,
    data.quotedPrice || '', data.transitTime || '', data.validity || '7',
    data.breakdown || '', data.notes || '',
    data.timestamp || new Date().toISOString(), 'Submitted', ''
  ]);

  updateRFQStatus(data.rfqId, 'Quoted');

  sendTelegramToAdmin(
    '\uD83D\uDCB0 *New Quote Received*\n\n' +
    '*RFQ:* ' + data.rfqId + '\n' +
    '*From:* ' + partnerName + ' (' + data.partnerId + ')\n' +
    '*Price:* ' + formatINR(data.quotedPrice) + '\n' +
    '*Transit:* ' + data.transitTime + ' days\n' +
    '*Valid:* ' + data.validity + ' days\n\n' +
    '\uD83D\uDC49 Open Admin Panel to review quotes.'
  );

  return jsonResponse({ status: 'success', message: 'Quote submitted', quoteId: quoteId });
}

function hasDuplicateQuote(sheet, rfqId, partnerId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === rfqId && data[i][1] === partnerId) return true;
  }
  return false;
}

// ─── 4. TELEGRAM NOTIFICATIONS ──────────────────────────────

function sendTelegramToAdmin(message) {
  var config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_ADMIN_CHAT_ID) {
    Logger.log('Telegram not configured. Message: ' + message);
    return;
  }
  sendTelegram(config.TELEGRAM_ADMIN_CHAT_ID, message);
}

function sendTelegram(chatId, message) {
  var config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN) return;

  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + config.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('Telegram send failed: ' + err.toString());
  }
}

function sendTelegramToPartner(partnerId, message) {
  var sheet = getSheet(TABS.PARTNERS);
  if (!sheet) return;
  var row = findRowByColumn(sheet, 1, partnerId);
  if (!row) return;
  var chatId = row[6]; // Column G = Telegram Chat ID
  if (chatId) sendTelegram(chatId, message);
}

// ─── 5. ADMIN PANEL FUNCTIONS (called via google.script.run) ─

function adminLogin(password) {
  var config = getConfig();
  if (password === config.ADMIN_PASSWORD) {
    var token = Utilities.getUuid();
    PropertiesService.getUserProperties().setProperty('admin_session', token);
    PropertiesService.getUserProperties().setProperty('admin_session_time', new Date().getTime().toString());
    return { success: true, token: token };
  }
  return { success: false };
}

function isAdminAuthenticated() {
  var session = PropertiesService.getUserProperties().getProperty('admin_session');
  var time = PropertiesService.getUserProperties().getProperty('admin_session_time');
  if (!session || !time) return false;
  var elapsed = new Date().getTime() - parseInt(time);
  return elapsed < 24 * 60 * 60 * 1000;
}

function adminLogout() {
  PropertiesService.getUserProperties().deleteProperty('admin_session');
  PropertiesService.getUserProperties().deleteProperty('admin_session_time');
  return { success: true };
}

function getDashboardStats() {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };

  var stats = { pendingRFQs: 0, approvedRFQs: 0, totalQuotes: 0, pendingPayments: 0, completedDeals: 0, totalRevenue: 0 };

  var rfqSheet = getSheet(TABS.RFQ);
  if (rfqSheet && rfqSheet.getLastRow() > 1) {
    var statuses = rfqSheet.getRange(2, 2, rfqSheet.getLastRow() - 1, 1).getValues().flat();
    stats.pendingRFQs = statuses.filter(function(s) { return s === 'Pending'; }).length;
    stats.approvedRFQs = statuses.filter(function(s) { return s === 'Approved' || s === 'Quoted'; }).length;
  }

  var quotesSheet = getSheet(TABS.QUOTES);
  if (quotesSheet && quotesSheet.getLastRow() > 1) stats.totalQuotes = quotesSheet.getLastRow() - 1;

  var paymentsSheet = getSheet(TABS.PAYMENTS);
  if (paymentsSheet && paymentsSheet.getLastRow() > 1) {
    var payStatuses = paymentsSheet.getRange(2, 9, paymentsSheet.getLastRow() - 1, 1).getValues().flat();
    stats.pendingPayments = payStatuses.filter(function(s) { return s === 'Pending'; }).length;
  }

  var dealsSheet = getSheet(TABS.DEALS);
  if (dealsSheet && dealsSheet.getLastRow() > 1) {
    stats.completedDeals = dealsSheet.getLastRow() - 1;
    var revenue = dealsSheet.getRange(2, 8, dealsSheet.getLastRow() - 1, 1).getValues().flat();
    stats.totalRevenue = revenue.reduce(function(sum, val) { return sum + (parseFloat(val) || 0); }, 0);
  }

  return stats;
}

function getRFQList() {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.RFQ);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(function(row) {
    var r = safeRow(row);
    return {
      rfqId: r[0], status: r[1], timestamp: r[2], fullName: r[3],
      email: r[4], phone: r[5], company: r[6], origin: r[7],
      destination: r[8], shipmentType: r[9], cargoWeight: r[10],
      commodity: r[11], shipmentValue: r[12], containerCount: r[13],
      incoterm: r[14], readyDate: r[15], deliveryDate: r[16],
      message: r[17], assignedPartners: r[18], approvedBy: r[19],
      approvedAt: r[20], notes: r[21]
    };
  }).reverse();
}

function getPartnersList() {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.PARTNERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function(row) {
    var r = safeRow(row);
    return {
      partnerId: r[0], companyName: r[1], contactPerson: r[2],
      email: r[3], phone: r[4], whatsapp: r[5], telegramChatId: r[6],
      categories: r[7], portsCovered: r[8], rating: r[9], status: r[10]
    };
  });
}

function approveRFQ(rfqId, partnerIds, approvedBy) {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };

  var config = getConfig();
  var sheet = getSheet(TABS.RFQ);
  if (!sheet) return { error: 'RFQ sheet not found' };

  var rowNum = findRowNumberByColumn(sheet, 1, rfqId);
  if (rowNum < 0) return { error: 'RFQ not found' };

  sheet.getRange(rowNum, 2).setValue('Approved');
  sheet.getRange(rowNum, 19).setValue(partnerIds.join(', '));
  sheet.getRange(rowNum, 20).setValue(approvedBy || 'Admin');
  sheet.getRange(rowNum, 21).setValue(new Date().toISOString());

  var rfqRow = safeRow(sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0]);
  var rfqData = {
    rfqId: rfqRow[0], origin: rfqRow[7], destination: rfqRow[8],
    shipmentType: rfqRow[9], cargoWeight: rfqRow[10], commodity: rfqRow[11],
    containerCount: rfqRow[13], incoterm: rfqRow[14], deliveryDate: rfqRow[16]
  };

  var sentCount = 0;
  var whatsappLinks = [];
  partnerIds.forEach(function(partnerId) {
    var result = sendAnonymizedRFQToPartner(partnerId, rfqData);
    if (result.sent) sentCount++;
    if (result.whatsappLink) whatsappLinks.push({ partnerId: partnerId, link: result.whatsappLink, name: result.partnerName });
  });

  sendTelegramToAdmin(
    '\u2705 *RFQ Approved*\n\n*ID:* ' + rfqId + '\n*Sent to:* ' + sentCount + ' partners\n*Partners:* ' + partnerIds.join(', ')
  );

  return { success: true, sentCount: sentCount, whatsappLinks: whatsappLinks };
}

function sendAnonymizedRFQToPartner(partnerId, rfqData) {
  var config = getConfig();
  var partnerSheet = getSheet(TABS.PARTNERS);
  if (!partnerSheet) return { sent: false };

  var partnerRow = findRowByColumn(partnerSheet, 1, partnerId);
  if (!partnerRow) return { sent: false };

  var partnerName = partnerRow[1];
  var partnerEmail = partnerRow[3];
  var partnerPhone = partnerRow[4];
  var partnerWhatsapp = partnerRow[5];
  var partnerTelegram = partnerRow[6];

  var token = generateToken(partnerId, rfqData.rfqId);
  var genericCargo = anonymizeCargo(rfqData.commodity);
  var originRegion = rfqData.origin;
  var deadlineStr = rfqData.deliveryDate ? String(rfqData.deliveryDate).substring(0, 10) : '';

  var quoteUrl = config.SITE_URL + '/quote.html?' +
    'rfq=' + encodeURIComponent(rfqData.rfqId) +
    '&partner=' + encodeURIComponent(partnerId) +
    '&token=' + encodeURIComponent(token) +
    '&origin=' + encodeURIComponent(originRegion) +
    '&dest=' + encodeURIComponent(rfqData.destination) +
    '&cargo=' + encodeURIComponent(genericCargo) +
    '&type=' + encodeURIComponent(rfqData.shipmentType) +
    '&weight=' + encodeURIComponent(rfqData.cargoWeight || '') +
    '&containers=' + encodeURIComponent(rfqData.containerCount || '') +
    '&incoterm=' + encodeURIComponent(rfqData.incoterm || '') +
    '&deadline=' + encodeURIComponent(deadlineStr);

  // Email (anonymized — NO manufacturer details)
  if (partnerEmail) {
    MailApp.sendEmail({
      to: partnerEmail,
      subject: 'New Shipment Opportunity \u2014 ' + rfqData.rfqId + ' | ' + originRegion + ' \u2192 ' + rfqData.destination,
      htmlBody: buildAnonymizedRFQEmail(rfqData, genericCargo, originRegion, quoteUrl, partnerName),
      name: 'MaritimeEdge Marketplace'
    });
  }

  // Telegram to partner
  if (partnerTelegram) {
    sendTelegram(partnerTelegram,
      '\uD83D\uDCE6 *New Shipment Opportunity*\n\n' +
      '*RFQ:* ' + rfqData.rfqId + '\n' +
      '*Route:* ' + originRegion + ' \u2192 ' + rfqData.destination + '\n' +
      '*Cargo:* ' + genericCargo + '\n*Type:* ' + rfqData.shipmentType + '\n' +
      '*Weight:* ' + (rfqData.cargoWeight || 'N/A') + ' kg\n' +
      '*Containers:* ' + (rfqData.containerCount || 'N/A') + '\n\n' +
      '\uD83D\uDCBC Submit your quote: ' + quoteUrl
    );
  }

  // WhatsApp link (admin sends manually)
  var whatsappLink = '';
  if (partnerWhatsapp || partnerPhone) {
    var waPhone = (partnerWhatsapp || partnerPhone).replace(/[^0-9]/g, '');
    if (waPhone.length === 10) waPhone = '91' + waPhone;
    var waMsg = 'Hi ' + partnerName + ', new shipment opportunity on MaritimeEdge:\n\nRFQ: ' + rfqData.rfqId +
      '\nRoute: ' + originRegion + ' \u2192 ' + rfqData.destination + '\nCargo: ' + genericCargo +
      '\nType: ' + rfqData.shipmentType + '\n\nSubmit quote: ' + quoteUrl;
    whatsappLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(waMsg);
  }

  return { sent: true, whatsappLink: whatsappLink, partnerName: partnerName };
}

function anonymizeCargo(commodity) {
  if (!commodity) return 'General Cargo';
  var lower = commodity.toLowerCase();
  var mapping = [
    [['auto', 'car', 'vehicle'], 'Automotive Components'],
    [['textile', 'cotton', 'fabric', 'garment'], 'Textiles & Garments'],
    [['pharma', 'medicine', 'drug'], 'Pharmaceuticals'],
    [['chemical'], 'Chemicals'],
    [['food', 'spice', 'rice', 'grain'], 'Food & Agricultural Products'],
    [['electronics', 'electric'], 'Electronics & Electrical'],
    [['steel', 'metal', 'iron'], 'Metals & Steel'],
    [['machinery', 'machine', 'equipment'], 'Machinery & Equipment'],
    [['plastic', 'polymer'], 'Plastics & Polymers'],
    [['ceramic', 'tile'], 'Ceramics & Tiles'],
    [['leather'], 'Leather Products'],
    [['wood', 'furniture'], 'Wood & Furniture'],
    [['paper'], 'Paper & Packaging']
  ];
  for (var i = 0; i < mapping.length; i++) {
    for (var j = 0; j < mapping[i][0].length; j++) {
      if (lower.indexOf(mapping[i][0][j]) !== -1) return mapping[i][1];
    }
  }
  return 'General Cargo';
}

function buildAnonymizedRFQEmail(rfqData, genericCargo, originRegion, quoteUrl, partnerName) {
  return '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
    '<div style="background:#0A2463;color:#fff;padding:20px;text-align:center;">' +
    '<h1 style="margin:0;font-size:20px;">\u2693 MaritimeEdge \u2014 New Shipment Opportunity</h1></div>' +
    '<div style="padding:24px;background:#f9fafb;">' +
    '<p style="color:#333;">Hi <strong>' + partnerName + '</strong>,</p>' +
    '<p style="color:#333;font-size:0.95rem;line-height:1.6;">A verified manufacturer is looking for freight quotes:</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;">' +
    '<tr style="background:#EEF2FF;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">RFQ Reference</td><td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;">' + rfqData.rfqId + '</td></tr>' +
    '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Origin Region</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + originRegion + '</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Destination</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + rfqData.destination + '</td></tr>' +
    '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Cargo Type</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + genericCargo + '</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Shipment Type</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + rfqData.shipmentType + '</td></tr>' +
    '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Cargo Weight</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + (rfqData.cargoWeight || 'N/A') + ' kg</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Containers</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + (rfqData.containerCount || 'N/A') + '</td></tr>' +
    '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Incoterm</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + (rfqData.incoterm || 'N/A') + '</td></tr>' +
    '<tr style="background:#EEF2FF;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Delivery By</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + (rfqData.deliveryDate || 'Flexible') + '</td></tr></table>' +
    '<p style="color:#555;font-size:0.85rem;line-height:1.6;margin:16px 0 0;padding:12px;background:#FEF3C7;border-radius:6px;border-left:4px solid #F59E0B;">\u26A0\uFE0F <strong>Note:</strong> Manufacturer details are confidential. Submit your quote below. If selected, you\'ll be notified to unlock full contact details.</p>' +
    '<div style="text-align:center;margin:24px 0;">' +
    '<a href="' + quoteUrl + '" style="background:#0EA5E9;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:1rem;">Submit Your Quote \u2192</a></div></div>' +
    '<div style="padding:16px;background:#0F172A;color:#aaa;text-align:center;font-size:12px;">' +
    'MaritimeEdge Marketplace \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</div></div>';
}

function rejectRFQ(rfqId, reason) {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.RFQ);
  if (!sheet) return { error: 'RFQ sheet not found' };
  var rowNum = findRowNumberByColumn(sheet, 1, rfqId);
  if (rowNum < 0) return { error: 'RFQ not found' };
  sheet.getRange(rowNum, 2).setValue('Rejected');
  sheet.getRange(rowNum, 22).setValue(reason || 'Rejected by admin');
  sendTelegramToAdmin('\u274C *RFQ Rejected*\n*ID:* ' + rfqId + '\n*Reason:* ' + (reason || 'No reason'));
  return { success: true };
}

// ─── 6. QUOTE MANAGEMENT ────────────────────────────────────

function getQuotesForRFQ(rfqId) {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.QUOTES);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var partnersSheet = getSheet(TABS.PARTNERS);

  var quotes = data.filter(function(row) { return row[1] === rfqId; })
    .map(function(row) {
      var r = safeRow(row);
      var pRow = partnersSheet ? findRowByColumn(partnersSheet, 1, r[2]) : null;
      return {
        quoteId: r[0], rfqId: r[1], partnerId: r[2], companyName: r[3],
        quotedPrice: parseFloat(r[4]) || 0, transitTime: parseInt(r[5]) || 0,
        validity: r[6], breakdown: r[7], notes: r[8], submittedAt: r[9],
        status: r[10], rank: r[11], partnerRating: pRow ? pRow[9] : 0
      };
    });

  // Rank: lowest price → fastest transit → highest rating
  quotes.sort(function(a, b) {
    if (a.quotedPrice !== b.quotedPrice) return a.quotedPrice - b.quotedPrice;
    if (a.transitTime !== b.transitTime) return a.transitTime - b.transitTime;
    return (b.partnerRating || 0) - (a.partnerRating || 0);
  });
  quotes.forEach(function(q, i) { q.rank = i + 1; });
  return quotes;
}

// ─── 7. PAYMENT MANAGEMENT ─────────────────────────────────

function sendPaymentRequest(quoteId, rfqId) {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var config = getConfig();

  var rfqSheet = getSheet(TABS.RFQ);
  var rfqRow = findRowByColumn(rfqSheet, 1, rfqId);
  if (!rfqRow) return { error: 'RFQ not found' };
  var shipmentValue = parseFloat(rfqRow[12]) || 0;

  var quotesSheet = getSheet(TABS.QUOTES);
  var quoteRow = findRowByColumn(quotesSheet, 1, quoteId);
  if (!quoteRow) return { error: 'Quote not found' };
  var partnerId = quoteRow[2];
  var partnerName = quoteRow[3];

  var commissionAmount = Math.round(shipmentValue * (config.COMMISSION_PERCENT / 100));
  if (commissionAmount < 100) commissionAmount = 100;

  var partnerSheet = getSheet(TABS.PARTNERS);
  var partnerRow = findRowByColumn(partnerSheet, 1, partnerId);
  if (!partnerRow) return { error: 'Partner not found' };

  var paymentLink = createRazorpayPaymentLink({
    amount: commissionAmount * 100,
    currency: 'INR',
    description: 'MaritimeEdge Commission \u2014 ' + rfqId,
    customerName: partnerRow[2] || partnerName,
    customerEmail: partnerRow[3],
    customerPhone: (partnerRow[4] || '').replace(/[^0-9]/g, ''),
    rfqId: rfqId, quoteId: quoteId, partnerId: partnerId
  });

  if (paymentLink.error) return paymentLink;

  var paymentsHeaders = [
    'Payment ID', 'RFQ ID', 'Quote ID', 'Partner ID', 'Partner Name',
    'Shipment Value (INR)', 'Commission %', 'Commission Amount (INR)',
    'Status', 'Razorpay Link ID', 'Razorpay Link URL', 'Razorpay Payment ID',
    'Created At', 'Paid At'
  ];
  var paymentsSheet = getOrCreateSheet(TABS.PAYMENTS, paymentsHeaders);
  var paymentId = generateId('PAY-', paymentsSheet);

  paymentsSheet.appendRow([
    paymentId, rfqId, quoteId, partnerId, partnerName,
    shipmentValue, config.COMMISSION_PERCENT, commissionAmount,
    'Pending', paymentLink.linkId, paymentLink.shortUrl, '',
    new Date().toISOString(), ''
  ]);

  var quoteRowNum = findRowNumberByColumn(quotesSheet, 1, quoteId);
  if (quoteRowNum > 0) quotesSheet.getRange(quoteRowNum, 11).setValue('Payment Sent');

  // Email to partner
  if (partnerRow[3]) {
    MailApp.sendEmail({
      to: partnerRow[3],
      subject: 'Action Required \u2014 Commission Payment for ' + rfqId + ' | MaritimeEdge',
      htmlBody: buildPaymentEmail(rfqId, partnerName, commissionAmount, paymentLink.shortUrl),
      name: 'MaritimeEdge Marketplace'
    });
  }

  // Telegram to partner
  sendTelegramToPartner(partnerId,
    '\uD83D\uDCB3 *Payment Required*\n\nYour quote for *' + rfqId + '* was shortlisted! \uD83C\uDF89\n\n' +
    '*Commission:* ' + formatINR(commissionAmount) + ' (' + config.COMMISSION_PERCENT + '% of shipment value)\n\n' +
    'Pay to unlock details:\n' + paymentLink.shortUrl
  );

  // WhatsApp link for admin
  var waPhone = (partnerRow[5] || partnerRow[4] || '').replace(/[^0-9]/g, '');
  if (waPhone.length === 10) waPhone = '91' + waPhone;
  var whatsappLink = waPhone ? 'https://wa.me/' + waPhone + '?text=' +
    encodeURIComponent('Hi ' + partnerName + ', your quote for ' + rfqId + ' was shortlisted! Complete payment to unlock manufacturer details: ' + paymentLink.shortUrl) : '';

  sendTelegramToAdmin(
    '\uD83D\uDCB3 *Payment Link Sent*\n\n*RFQ:* ' + rfqId + '\n*Partner:* ' + partnerName +
    '\n*Commission:* ' + formatINR(commissionAmount) + '\n*Link:* ' + paymentLink.shortUrl
  );

  return { success: true, paymentId: paymentId, amount: commissionAmount, link: paymentLink.shortUrl, whatsappLink: whatsappLink };
}

function buildPaymentEmail(rfqId, partnerName, amount, paymentUrl) {
  return '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
    '<div style="background:#0A2463;color:#fff;padding:20px;text-align:center;">' +
    '<h1 style="margin:0;font-size:20px;">\u2693 MaritimeEdge \u2014 Your Quote Was Shortlisted!</h1></div>' +
    '<div style="padding:24px;">' +
    '<p style="color:#333;">Hi <strong>' + partnerName + '</strong>,</p>' +
    '<p style="color:#333;line-height:1.6;">Your quote for <strong>' + rfqId + '</strong> has been selected. Complete the commission payment to connect with the manufacturer.</p>' +
    '<div style="text-align:center;margin:24px 0;padding:20px;background:#EEF2FF;border-radius:8px;">' +
    '<p style="margin:0 0 8px;color:#666;font-size:0.85rem;">Commission Amount</p>' +
    '<p style="margin:0;font-size:2rem;font-weight:800;color:#0A2463;">' + formatINR(amount) + '</p></div>' +
    '<div style="text-align:center;margin:24px 0;">' +
    '<a href="' + paymentUrl + '" style="background:#0EA5E9;color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:1.1rem;">Pay Now & Unlock Details \u2192</a></div>' +
    '<p style="color:#555;font-size:0.85rem;line-height:1.6;">After payment, you will automatically receive the manufacturer\'s full contact details.</p></div>' +
    '<div style="padding:16px;background:#0F172A;color:#aaa;text-align:center;font-size:12px;">' +
    'MaritimeEdge Marketplace \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</div></div>';
}

// ─── 8. RAZORPAY INTEGRATION ────────────────────────────────

function createRazorpayPaymentLink(params) {
  var config = getConfig();
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    return { error: 'Razorpay not configured' };
  }

  var payload = {
    amount: params.amount,
    currency: params.currency || 'INR',
    accept_partial: false,
    description: params.description,
    customer: { name: params.customerName || '', email: params.customerEmail || '', contact: params.customerPhone || '' },
    notify: { sms: true, email: true },
    reminder_enable: true,
    notes: { rfq_id: params.rfqId, quote_id: params.quoteId, partner_id: params.partnerId }
  };

  try {
    var response = UrlFetchApp.fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: { 'Authorization': 'Basic ' + Utilities.base64Encode(config.RAZORPAY_KEY_ID + ':' + config.RAZORPAY_KEY_SECRET) },
      muteHttpExceptions: true
    });

    var result = JSON.parse(response.getContentText());
    if (result.error) return { error: 'Razorpay error: ' + result.error.description };
    return { linkId: result.id, shortUrl: result.short_url, amount: result.amount, status: result.status };
  } catch (err) {
    return { error: 'Razorpay API failed: ' + err.toString() };
  }
}

function confirmPaymentManual(paymentId) {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  return processPaymentConfirmation(paymentId);
}

function processPaymentConfirmation(paymentId) {
  var paymentsSheet = getSheet(TABS.PAYMENTS);
  if (!paymentsSheet) return { error: 'Payments sheet not found' };

  var rowNum = findRowNumberByColumn(paymentsSheet, 1, paymentId);
  if (rowNum < 0) return { error: 'Payment not found' };

  var paymentRow = paymentsSheet.getRange(rowNum, 1, 1, paymentsSheet.getLastColumn()).getValues()[0];
  var rfqId = paymentRow[1], quoteId = paymentRow[2], partnerId = paymentRow[3];
  var partnerName = paymentRow[4], commissionAmount = paymentRow[7];

  paymentsSheet.getRange(rowNum, 9).setValue('Paid');
  paymentsSheet.getRange(rowNum, 14).setValue(new Date().toISOString());

  var quotesSheet = getSheet(TABS.QUOTES);
  var quoteRowNum = findRowNumberByColumn(quotesSheet, 1, quoteId);
  if (quoteRowNum > 0) quotesSheet.getRange(quoteRowNum, 11).setValue('Paid');

  updateRFQStatus(rfqId, 'Paid');
  releaseManufacturerDetails(rfqId, partnerId, partnerName);
  createDealEntry(rfqId, quoteId, partnerId, partnerName, commissionAmount);

  sendTelegramToAdmin(
    '\uD83C\uDF89 *Payment Confirmed!*\n\n*Payment:* ' + paymentId + '\n*RFQ:* ' + rfqId +
    '\n*Partner:* ' + partnerName + '\n*Commission:* ' + formatINR(commissionAmount) +
    '\n\nManufacturer details released.'
  );

  return { success: true };
}

function releaseManufacturerDetails(rfqId, partnerId, partnerName) {
  var rfqSheet = getSheet(TABS.RFQ);
  var rfqRow = findRowByColumn(rfqSheet, 1, rfqId);
  if (!rfqRow) return;

  var mfgName = rfqRow[3], mfgEmail = rfqRow[4], mfgPhone = rfqRow[5];
  var mfgCompany = rfqRow[6], origin = rfqRow[7], destination = rfqRow[8];
  var shipmentType = rfqRow[9], commodity = rfqRow[11];

  var partnerSheet = getSheet(TABS.PARTNERS);
  var partnerRow = findRowByColumn(partnerSheet, 1, partnerId);
  if (!partnerRow) return;

  // Full details to logistics partner
  if (partnerRow[3]) {
    MailApp.sendEmail({
      to: partnerRow[3],
      subject: 'Manufacturer Details Unlocked \u2014 ' + rfqId + ' | MaritimeEdge',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
        '<div style="background:#10B981;color:#fff;padding:20px;text-align:center;">' +
        '<h1 style="margin:0;font-size:20px;">\uD83C\uDF89 Deal Unlocked \u2014 Manufacturer Details</h1></div>' +
        '<div style="padding:24px;">' +
        '<p style="color:#333;">Hi <strong>' + partnerName + '</strong>,</p>' +
        '<p style="color:#333;line-height:1.6;">Payment confirmed! Here are the full manufacturer details for <strong>' + rfqId + '</strong>:</p>' +
        '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
        '<tr style="background:#D1FAE5;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Contact Person</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + mfgName + '</td></tr>' +
        '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Company</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + (mfgCompany || 'N/A') + '</td></tr>' +
        '<tr style="background:#D1FAE5;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Email</td><td style="padding:10px 12px;border:1px solid #e5e7eb;"><a href="mailto:' + mfgEmail + '">' + mfgEmail + '</a></td></tr>' +
        '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Phone</td><td style="padding:10px 12px;border:1px solid #e5e7eb;"><a href="tel:' + mfgPhone + '">' + mfgPhone + '</a></td></tr>' +
        '<tr style="background:#D1FAE5;"><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Shipment</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + origin + ' \u2192 ' + destination + ' (' + shipmentType + ')</td></tr>' +
        '<tr><td style="padding:10px 12px;font-weight:bold;border:1px solid #e5e7eb;">Commodity</td><td style="padding:10px 12px;border:1px solid #e5e7eb;">' + commodity + '</td></tr></table>' +
        '<p style="color:#555;line-height:1.6;">Contact the manufacturer directly to finalize the shipment. We recommend reaching out within 24 hours.</p></div>' +
        '<div style="padding:16px;background:#0F172A;color:#aaa;text-align:center;font-size:12px;">' +
        'MaritimeEdge Marketplace \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</div></div>',
      name: 'MaritimeEdge Marketplace'
    });
  }

  sendTelegramToPartner(partnerId,
    '\uD83C\uDF89 *Deal Unlocked!*\n\n*RFQ:* ' + rfqId + '\n*Manufacturer:* ' + mfgName +
    '\n*Company:* ' + (mfgCompany || 'N/A') + '\n*Email:* ' + mfgEmail + '\n*Phone:* ' + mfgPhone +
    '\n\nContact them within 24 hours. Good luck!'
  );

  // Notify manufacturer
  if (mfgEmail) {
    MailApp.sendEmail({
      to: mfgEmail,
      subject: 'Logistics Partner Matched for ' + rfqId + ' \u2014 MaritimeEdge',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
        '<div style="background:#0A2463;color:#fff;padding:20px;text-align:center;">' +
        '<h1 style="margin:0;font-size:20px;">\u2693 MaritimeEdge \u2014 Partner Matched!</h1></div>' +
        '<div style="padding:24px;">' +
        '<p style="color:#333;">Hi <strong>' + mfgName + '</strong>,</p>' +
        '<p style="color:#333;line-height:1.6;">A verified logistics partner, <strong>' + partnerName + '</strong>, has been matched with your RFQ <strong>' + rfqId + '</strong> (' + origin + ' \u2192 ' + destination + '). They will contact you shortly.</p>' +
        '<p style="color:#555;margin-top:16px;">If you don\'t hear within 48 hours, contact us at quotes@maritimeedge.com</p></div>' +
        '<div style="padding:16px;background:#0F172A;color:#aaa;text-align:center;font-size:12px;">' +
        'MaritimeEdge \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</div></div>',
      name: 'MaritimeEdge'
    });
  }

  updateRFQStatus(rfqId, 'Closed');
}

function createDealEntry(rfqId, quoteId, partnerId, partnerName, commissionAmount) {
  var rfqRow = findRowByColumn(getSheet(TABS.RFQ), 1, rfqId);
  var dealsHeaders = [
    'Deal ID', 'RFQ ID', 'Quote ID', 'Partner ID', 'Logistics Company',
    'Manufacturer Company', 'Shipment Value (INR)', 'Commission Earned (INR)',
    'Details Shared At', 'Manufacturer Feedback', 'Logistics Feedback',
    'Manufacturer Rating', 'Logistics Rating', 'Deal Status'
  ];
  var dealsSheet = getOrCreateSheet(TABS.DEALS, dealsHeaders);
  var dealId = generateId('DEAL-', dealsSheet);

  dealsSheet.appendRow([
    dealId, rfqId, quoteId, partnerId, partnerName,
    rfqRow ? rfqRow[6] : '', rfqRow ? rfqRow[12] : '', commissionAmount,
    new Date().toISOString(), '', '', '', '', 'Active'
  ]);
}

// ─── 9. PAYMENT & DEAL LISTING ──────────────────────────────

function getPaymentsList() {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.PAYMENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function(row) {
    var r = safeRow(row);
    return {
      paymentId: r[0], rfqId: r[1], quoteId: r[2], partnerId: r[3],
      partnerName: r[4], shipmentValue: r[5], commissionPercent: r[6],
      commissionAmount: r[7], status: r[8], razorpayLinkId: r[9],
      razorpayLinkUrl: r[10], razorpayPaymentId: r[11],
      createdAt: r[12], paidAt: r[13]
    };
  }).reverse();
}

function getDealsList() {
  if (!isAdminAuthenticated()) return { error: 'Not authenticated' };
  var sheet = getSheet(TABS.DEALS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function(row) {
    var r = safeRow(row);
    return {
      dealId: r[0], rfqId: r[1], quoteId: r[2], partnerId: r[3],
      logisticsCompany: r[4], manufacturerCompany: r[5],
      shipmentValue: r[6], commissionEarned: r[7],
      detailsSharedAt: r[8], mfgFeedback: r[9], logFeedback: r[10],
      mfgRating: r[11], logRating: r[12], dealStatus: r[13]
    };
  }).reverse();
}

// ─── 10. FEEDBACK (Daily trigger) ───────────────────────────

function checkAndSendFeedback() {
  var dealsSheet = getSheet(TABS.DEALS);
  if (!dealsSheet || dealsSheet.getLastRow() <= 1) return;

  var data = dealsSheet.getRange(2, 1, dealsSheet.getLastRow() - 1, dealsSheet.getLastColumn()).getValues();
  var now = new Date().getTime();
  var sevenDays = 7 * 24 * 60 * 60 * 1000;

  data.forEach(function(row) {
    var rfqId = row[1], partnerId = row[3], logisticsCompany = row[4];
    var detailsSharedAt = new Date(row[8]).getTime();
    if (row[13] !== 'Active' || now - detailsSharedAt < sevenDays || row[9] || row[10]) return;

    var rfqRow = findRowByColumn(getSheet(TABS.RFQ), 1, rfqId);
    if (rfqRow && rfqRow[4]) {
      MailApp.sendEmail({
        to: rfqRow[4],
        subject: 'How was your experience? \u2014 ' + rfqId + ' | MaritimeEdge',
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">' +
          '<h2 style="color:#0A2463;">\u2693 MaritimeEdge \u2014 Feedback Request</h2>' +
          '<p>Hi ' + rfqRow[3] + ',</p>' +
          '<p>How was your experience with <strong>' + logisticsCompany + '</strong> for ' + rfqId + '?</p>' +
          '<p>Please reply with: Rating (1-5), feedback, deal status (completed/in-progress/cancelled).</p></div>',
        name: 'MaritimeEdge'
      });
    }

    var partnerRow = findRowByColumn(getSheet(TABS.PARTNERS), 1, partnerId);
    if (partnerRow && partnerRow[3]) {
      MailApp.sendEmail({
        to: partnerRow[3],
        subject: 'How was the deal? \u2014 ' + rfqId + ' | MaritimeEdge',
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">' +
          '<h2 style="color:#0A2463;">\u2693 MaritimeEdge \u2014 Feedback Request</h2>' +
          '<p>Hi ' + partnerRow[2] + ',</p>' +
          '<p>How was the deal for shipment ' + rfqId + '?</p>' +
          '<p>Please reply with: Rating (1-5), feedback, deal status (completed/in-progress/cancelled).</p></div>',
        name: 'MaritimeEdge'
      });
    }
  });
}

// ─── 11. BULK EMAIL (preserved) ─────────────────────────────

function sendBulkEmail(subject, htmlBody) {
  if (!subject) subject = 'MaritimeEdge Weekly \u2014 Indian Shipping Intelligence';
  if (!htmlBody) htmlBody = getDefaultNewsletterTemplate();
  var sheet = getSheet(TABS.SUBSCRIBERS);
  if (!sheet || sheet.getLastRow() <= 1) { Logger.log('No subscribers.'); return; }

  var emails = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    .filter(function(e) { return e && e.indexOf('@') !== -1; });

  var sent = 0, failed = 0;
  emails.forEach(function(email) {
    try { MailApp.sendEmail({ to: email, subject: subject, htmlBody: wrapNewsletterTemplate(htmlBody, email), name: 'MaritimeEdge' }); sent++; }
    catch (err) { Logger.log('Failed: ' + email); failed++; }
  });

  sendTelegramToAdmin('\uD83D\uDCE7 *Newsletter Sent*\nTo: ' + sent + ' subscribers\nFailed: ' + failed);
}

function wrapNewsletterTemplate(bodyContent, recipientEmail) {
  return '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
    '<div style="background:#0A2463;color:#fff;padding:24px;text-align:center;">' +
    '<h1 style="margin:0;font-size:22px;">\u2693 MaritimeEdge</h1>' +
    '<p style="margin:4px 0 0;opacity:0.8;font-size:13px;">Indian Shipping Intelligence \u2014 Weekly</p></div>' +
    '<div style="padding:24px;">' + bodyContent + '</div>' +
    '<div style="padding:20px;background:#0F172A;color:#999;text-align:center;font-size:12px;">' +
    '<p style="margin:0;">MaritimeEdge \u2014 A <a href="https://vaseraglobal.com" style="color:#0EA5E9;">Vasera Global</a> Initiative</p>' +
    '<p style="margin:8px 0 0;">Sent to ' + recipientEmail + '</p></div></div>';
}

function getDefaultNewsletterTemplate() {
  return '<h2 style="color:#0A2463;">This Week in Indian Shipping</h2>' +
    '<p>Top stories from Indian ports and sea freight:</p>' +
    '<div style="border-left:3px solid #0A2463;padding-left:16px;margin:16px 0;">' +
    '<h3 style="margin:0;">\uD83D\uDCF0 Top Headlines</h3>' +
    '<ul style="color:#555;"><li>JNPT implements new container tracking system</li></ul></div>';
}

// ─── 12. SETUP HELPERS (run once) ────────────────────────────

function setupSheetTabs() {
  var config = getConfig();
  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  var tabs = {
    'Subscribers': ['Email', 'Timestamp', 'Source Page'],
    'RFQ Submissions': ['RFQ ID', 'Status', 'Timestamp', 'Full Name', 'Email', 'Phone', 'Company', 'Origin', 'Destination', 'Shipment Type', 'Cargo Weight', 'Commodity', 'Shipment Value (INR)', 'Container Count', 'Incoterm', 'Ready Date', 'Delivery Date', 'Message', 'Assigned Partners', 'Approved By', 'Approved At', 'Notes'],
    'Logistics Partners': ['Partner ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'WhatsApp', 'Telegram Chat ID', 'Categories', 'Ports Covered', 'Rating', 'Status'],
    'Quotes': ['Quote ID', 'RFQ ID', 'Partner ID', 'Company Name', 'Quoted Price (INR)', 'Transit Time (Days)', 'Validity (Days)', 'Breakdown', 'Notes', 'Submitted At', 'Status', 'Rank'],
    'Payments': ['Payment ID', 'RFQ ID', 'Quote ID', 'Partner ID', 'Partner Name', 'Shipment Value (INR)', 'Commission %', 'Commission Amount (INR)', 'Status', 'Razorpay Link ID', 'Razorpay Link URL', 'Razorpay Payment ID', 'Created At', 'Paid At'],
    'Deals': ['Deal ID', 'RFQ ID', 'Quote ID', 'Partner ID', 'Logistics Company', 'Manufacturer Company', 'Shipment Value (INR)', 'Commission Earned (INR)', 'Details Shared At', 'Manufacturer Feedback', 'Logistics Feedback', 'Manufacturer Rating', 'Logistics Rating', 'Deal Status']
  };

  Object.keys(tabs).forEach(function(tabName) {
    var headers = tabs[tabName];
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      Logger.log('Created sheet: ' + tabName);
    }
    // Always write/update headers in row 1
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    Logger.log('Headers set: ' + tabName + ' (' + headers.length + ' columns)');
  });
  Logger.log('All sheet headers configured!');
}

function testTelegram() {
  sendTelegramToAdmin('\uD83D\uDD14 *Test Notification*\nMaritimeEdge admin notifications are working!');
  Logger.log('Test sent. Check your admin group.');
}

// ─── DEBUG: Check sheet access & data ────────────────────────
function debugSheetAccess() {
  var config = getConfig();
  Logger.log('SHEET_ID: ' + config.SHEET_ID);

  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  Logger.log('Spreadsheet name: ' + ss.getName());

  var allSheets = ss.getSheets();
  Logger.log('All tabs (' + allSheets.length + '):');
  allSheets.forEach(function(s) {
    Logger.log('  - "' + s.getName() + '" → rows: ' + s.getLastRow());
  });

  var rfqSheet = ss.getSheetByName('RFQ Submissions');
  if (rfqSheet) {
    Logger.log('RFQ Submissions tab found! Rows: ' + rfqSheet.getLastRow());
    if (rfqSheet.getLastRow() > 1) {
      var headers = rfqSheet.getRange(1, 1, 1, rfqSheet.getLastColumn()).getValues()[0];
      Logger.log('Headers: ' + headers.join(' | '));
      var lastRow = rfqSheet.getRange(2, 1, 1, Math.min(rfqSheet.getLastColumn(), 5)).getValues()[0];
      Logger.log('First data row (cols 1-5): ' + lastRow.join(' | '));
    }
  } else {
    Logger.log('ERROR: No tab named "RFQ Submissions" found!');
  }

  // Test auth
  Logger.log('isAdminAuthenticated: ' + isAdminAuthenticated());
}

// ─── TEST: Simulate an RFQ submission (run from GAS editor) ──
// This tests the entire handleRFQ pipeline: sheet write, email, telegram.
// Check Execution Log for results. If this works, the server code is fine.
function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        type: 'rfq',
        fullName: 'Test User',
        email: 'mailabhilashganji@gmail.com',
        phone: '+91 99999 99999',
        company: 'Test Company',
        origin: 'Mumbai / Navi Mumbai',
        destination: 'Rotterdam, Netherlands',
        shipmentType: 'FCL 20ft',
        cargoWeight: '15000',
        commodity: 'Auto Components',
        shipmentValue: '500000',
        containerCount: '2',
        incoterm: 'FOB',
        readyDate: '2026-05-15',
        deliveryDate: '2026-06-15',
        message: 'Test submission from GAS editor',
        timestamp: new Date().toISOString()
      }),
      type: 'text/plain'
    }
  };

  var result = doPost(fakeEvent);
  Logger.log('testDoPost result: ' + result.getContent());
}

// ─── 13. EXISTING SHEET MIGRATION (run once if upgrading) ────
// Run this ONCE if you already have an old "RFQ Submissions" tab with 13 columns.
// It deletes the old tab and creates a fresh one with the new 22-column headers.
function migrateExistingRFQSheet() {
  var config = getConfig();
  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  var oldSheet = ss.getSheetByName('RFQ Submissions');
  if (!oldSheet) { Logger.log('No existing RFQ Submissions tab found.'); return; }

  // Check if already migrated (first header = 'RFQ ID' means new format)
  var firstHeader = oldSheet.getRange(1, 1).getValue();
  if (firstHeader === 'RFQ ID') { Logger.log('Already in new format. No migration needed.'); return; }

  // Delete old tab
  ss.deleteSheet(oldSheet);
  Logger.log('Deleted old RFQ Submissions tab.');

  // Create new tab with correct headers
  var newHeaders = [
    'RFQ ID', 'Status', 'Timestamp', 'Full Name', 'Email', 'Phone', 'Company',
    'Origin', 'Destination', 'Shipment Type', 'Cargo Weight', 'Commodity',
    'Shipment Value (INR)', 'Container Count', 'Incoterm', 'Ready Date',
    'Delivery Date', 'Message', 'Assigned Partners', 'Approved By', 'Approved At', 'Notes'
  ];
  var newSheet = ss.insertSheet('RFQ Submissions');
  newSheet.appendRow(newHeaders);
  newSheet.getRange(1, 1, 1, newHeaders.length).setFontWeight('bold');

  Logger.log('Migration complete! Fresh RFQ Submissions tab created with 22 columns.');
}
