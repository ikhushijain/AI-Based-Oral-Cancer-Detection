// Google Apps Script for Contact Form Integration
// To use this script:
// 1. Create a new Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code
// 4. Save and deploy as Web App
// 5. Update the GOOGLE_SCRIPT_URL in contact.html with your deployment URL

function doGet() {
  return HtmlService.createHtmlOutput(`
    <h1>AI MedTech Contact Form</h1>
    <p>This endpoint is for form submissions only.</p>
  `);
}

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contact Submissions') || 
                  SpreadsheetApp.getActiveSpreadsheet().insertSheet('Contact Submissions');
    
    // Set up headers if sheet is new
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Name',
        'Email',
        'Phone',
        'Organization',
        'Subject',
        'Message',
        'Newsletter',
        'Urgent',
        'IP Address',
        'User Agent'
      ];
      sheet.appendRow(headers);
      
      // Format headers
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#00ff88').setFontColor('#0a0a0a');
    }
    
    // Prepare the row data
    const rowData = [
      new Date().toLocaleString(),
      data.name || '',
      data.email || '',
      data.phone || '',
      data.organization || '',
      data.subject || '',
      data.message || '',
      data.newsletter || 'No',
      data.urgent || 'No',
      e.parameter.ip || 'Not available',
      e.parameter.userAgent || 'Not available'
    ];
    
    // Append the new row
    sheet.appendRow(rowData);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 10);
    
    // Send notification email (optional)
    sendNotificationEmail(data);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Form submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log the error
    Logger.log('Error processing form submission: ' + error.toString());
    
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Failed to process form submission'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(data) {
  try {
    const recipient = 'your-email@example.com'; // Replace with your email
    const subject = 'New Contact Form Submission: ' + data.subject;
    
    const body = `
New contact form submission from AI MedTech website:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Organization: ${data.organization || 'Not provided'}
Subject: ${data.subject}
Newsletter: ${data.newsletter}
Urgent: ${data.urgent}

Message:
${data.message}

---
Submitted at: ${new Date().toLocaleString()}
    `;
    
    MailApp.sendEmail(recipient, subject, body);
    
  } catch (error) {
    Logger.log('Error sending notification email: ' + error.toString());
  }
}

// Function to set up the sheet with proper formatting
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contact Submissions') || 
                SpreadsheetApp.getActiveSpreadsheet().insertSheet('Contact Submissions');
  
  // Clear existing data if any
  sheet.clear();
  
  // Set headers
  const headers = [
    'Timestamp',
    'Name',
    'Email',
    'Phone',
    'Organization',
    'Subject',
    'Message',
    'Newsletter',
    'Urgent',
    'IP Address',
    'User Agent'
  ];
  
  sheet.appendRow(headers);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold')
               .setBackground('#00ff88')
               .setFontColor('#0a0a0a')
               .setFontSize(12);
  
  // Set column widths
  sheet.setColumnWidths(1, 10, 150);
  sheet.setColumnWidth(2, 2, 200); // Name
  sheet.setColumnWidth(3, 3, 250); // Email
  sheet.setColumnWidth(4, 4, 150); // Phone
  sheet.setColumnWidth(5, 5, 200); // Organization
  sheet.setColumnWidth(6, 6, 180); // Subject
  sheet.setColumnWidth(7, 7, 400); // Message
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add conditional formatting for urgent requests
  const urgentRange = sheet.getRange(2, 9, sheet.getMaxRows() - 1, 1);
  const urgentRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Yes')
    .setBackground('#ff6b6b')
    .setFontColor('#ffffff')
    .build();
  
  const rules = sheet.getConditionalFormatRules();
  rules.push(urgentRule);
  sheet.setConditionalFormatRules(rules);
  
  return sheet;
}
