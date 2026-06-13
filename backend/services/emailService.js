const Task = require('../models/Task');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

/**
 * Query stats for a specific user for the last 30 days
 */
async function getUserStats(userId) {
  const today = new Date();
  const dates = [];
  
  // Calculate the dates for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Fetch all tasks for the user in the last 30 days
  const tasks = await Task.find({ user: userId, date: { $in: dates } });
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Group by priority
  const priorities = {
    high: { total: 0, completed: 0 },
    moderate: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 }
  };

  tasks.forEach(t => {
    const p = t.priority || 'moderate';
    if (priorities[p]) {
      priorities[p].total += 1;
      if (t.completed) {
        priorities[p].completed += 1;
      }
    }
  });

  // Group by type
  const types = {};
  tasks.forEach(t => {
    const type = t.type || 'other';
    if (!types[type]) {
      types[type] = { total: 0, completed: 0 };
    }
    types[type].total += 1;
    if (t.completed) {
      types[type].completed += 1;
    }
  });

  // Fetch User info for streaks
  const user = await User.findById(userId);

  return {
    name: user.name,
    email: user.email,
    totalTasks,
    completedTasks,
    completionPercent,
    priorities,
    types,
    dailyStreak: user.dailyStreak || 0,
    longestStreak: user.longestStreak || 0
  };
}

/**
 * Generate premium HTML template for the email report
 */
function generateEmailHTML(stats) {
  // Build category/type rows
  let typeRows = '';
  Object.keys(stats.types).forEach(type => {
    const item = stats.types[type];
    const pct = item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100);
    typeRows += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: #a1a1aa; text-transform: capitalize;">${type}</td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: #fafafa; font-weight: 600;">
          ${item.completed}/${item.total} <span style="color: #00c6ff; font-size: 12px; margin-left: 8px;">(${pct}%)</span>
        </td>
      </tr>
    `;
  });
  if (typeRows === '') {
    typeRows = '<tr><td colspan="2" style="color: #71717a; text-align: center; padding: 15px 0; font-style: italic;">No tasks tracked in this category.</td></tr>';
  }

  // Build priority rows
  let priorityRows = '';
  ['high', 'moderate', 'low'].forEach(p => {
    const item = stats.priorities[p];
    if (item.total > 0) {
      const pct = item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100);
      let pColor = '#a1a1aa';
      if (p === 'high') pColor = '#ef4444';
      else if (p === 'moderate') pColor = '#eab308';
      else if (p === 'low') pColor = '#3b82f6';

      priorityRows += `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: ${pColor}; font-weight: 500; text-transform: capitalize;">${p}</td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: #fafafa; font-weight: 600;">
            ${item.completed}/${item.total} <span style="color: #00c6ff; font-size: 12px; margin-left: 8px;">(${pct}%)</span>
          </td>
        </tr>
      `;
    }
  });
  if (priorityRows === '') {
    priorityRows = '<tr><td colspan="2" style="color: #71717a; text-align: center; padding: 15px 0; font-style: italic;">No prioritized tasks tracked.</td></tr>';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Wedo Monthly Productivity Report</title>
</head>
<body style="background-color: #09090b; color: #fafafa; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;-webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #09090b; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="550" cellpadding="0" cellspacing="0" border="0" style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #00c6ff, #0072ff); padding: 45px 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.8px; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Wedo</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">Monthly Productivity Report</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="color: #fafafa; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Hey ${stats.name},</p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                Here is your monthly check-in from Wedo. We've compiled your productivity statistics and streak milestones for the past 30 days. Let's see how you did!
              </p>
              
              <!-- Completion Cards -->
              <table width="100%" cellpadding="0" cellspacing="8" border="0">
                <tr>
                  <td width="50%" align="center" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 20px 10px;">
                    <div style="font-size: 34px; font-weight: 700; color: #00c6ff; font-family: 'Segoe UI', sans-serif;">${stats.completionPercent}%</div>
                    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.8px; margin-top: 6px;">Completion Rate</div>
                  </td>
                  <td width="50%" align="center" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 20px 10px;">
                    <div style="font-size: 34px; font-weight: 700; color: #10b981; font-family: 'Segoe UI', sans-serif;">${stats.completedTasks}/${stats.totalTasks}</div>
                    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.8px; margin-top: 6px;">Tasks Completed</div>
                  </td>
                </tr>
              </table>

              <!-- Streak Section -->
              <h3 style="font-size: 15px; font-weight: 700; color: #00c6ff; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">Streak Milestones</h3>
              <table width="100%" cellpadding="0" cellspacing="8" border="0">
                <tr>
                  <td width="50%" align="center" style="background-color: rgba(249, 115, 22, 0.04); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 12px; padding: 18px 10px;">
                    <div style="font-size: 26px; font-weight: 700; color: #f97316;">${stats.dailyStreak} 🔥</div>
                    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #fdba74; letter-spacing: 0.8px; margin-top: 6px;">Current Streak</div>
                  </td>
                  <td width="50%" align="center" style="background-color: rgba(0, 198, 255, 0.04); border: 1px solid rgba(0, 198, 255, 0.2); border-radius: 12px; padding: 18px 10px;">
                    <div style="font-size: 26px; font-weight: 700; color: #00c6ff;">${stats.longestStreak} 👑</div>
                    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #93c5fd; letter-spacing: 0.8px; margin-top: 6px;">Longest Streak</div>
                  </td>
                </tr>
              </table>
              
              <!-- Habit Breakdown -->
              <h3 style="font-size: 15px; font-weight: 700; color: #00c6ff; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin: 30px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Category Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                ${typeRows}
              </table>

              <!-- Priority Breakdown -->
              <h3 style="font-size: 15px; font-weight: 700; color: #00c6ff; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin: 30px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Priority Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                ${priorityRows}
              </table>

              <!-- Motivation Block -->
              <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 35px 0 0 0; text-align: center; font-style: italic;">
                "Success is the sum of small efforts, repeated day in and day out." Keep up the excellent work!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px; border-top: 1px solid #27272a; color: #71717a; font-size: 11px; line-height: 1.5;">
              You received this monthly report because it is enabled in your account.<br>
              To stop receiving these, toggle this off in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" style="color: #00c6ff; text-decoration: none; font-weight: 600;">Profile Settings</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate a PDF document report containing detailed daily checklist status
 */
/**
 * Generate a PDF document report containing detailed daily checklist status
 */
/**
 * Generate a PDF document report containing detailed daily checklist status
 */
/**
 * Generate a PDF document report containing detailed daily checklist status
 */
async function generatePDFReport(stats, userId) {
  const today = new Date();
  const dates = [];
  
  // Calculate the dates for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Fetch all tasks for the user sorted chronologically
  const tasks = await Task.find({ user: userId, date: { $in: dates } }).sort({ date: 1 });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Cover / Header Banner (Dark Charcoal)
      doc.rect(0, 0, 595, 120).fill('#121214');
      
      // Header Accent Line (cyan gradient style)
      doc.rect(0, 116, 595, 4).fill('#00c6ff');

      // Title & Branding
      doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold')
         .text('WEDO', 40, 32);
      
      doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica')
         .text('MONTHLY PRODUCTIVITY REPORT', 40, 65);

      doc.fillColor('#00c6ff').fontSize(9).font('Helvetica-Bold')
         .text(`PERIOD: ${dates[0].toUpperCase()} TO ${dates[29].toUpperCase()}`, 40, 80);

      // Report metadata
      doc.fillColor('#121214'); // reset default draw color
      
      doc.fillColor('#27272a').fontSize(16).font('Helvetica-Bold')
         .text(`Report for: ${stats.name}`, 40, 150);
      doc.fillColor('#71717a').fontSize(10).font('Helvetica')
         .text(`Email: ${stats.email}`, 40, 170);

      // Scorecard Title
      doc.fillColor('#27272a').fontSize(12).font('Helvetica-Bold')
         .text('SUMMARY STATISTICS', 40, 195);

      // Scorecard Box
      doc.rect(40, 212, 515, 65).fill('#18181b');
      
      // Separator Line
      doc.strokeColor('#27272a').lineWidth(1)
         .moveTo(297, 217).lineTo(297, 272).stroke();

      // Scorecard Completion rate
      doc.fillColor('#00c6ff').fontSize(24).font('Helvetica-Bold')
         .text(`${stats.completionPercent}%`, 60, 222);
      doc.fillColor('#a1a1aa').fontSize(8).font('Helvetica')
         .text('COMPLETION RATE', 60, 252);

      // Scorecard Completed tasks
      doc.fillColor('#10b981').fontSize(24).font('Helvetica-Bold')
         .text(`${stats.completedTasks} / ${stats.totalTasks}`, 317, 222);
      doc.fillColor('#a1a1aa').fontSize(8).font('Helvetica')
         .text('COMPLETED / TOTAL TASKS', 317, 252);

      // Streak Scorecard Box
      doc.rect(40, 290, 515, 55).fill('#18181b');
      doc.strokeColor('#27272a').lineWidth(1)
         .moveTo(297, 295).lineTo(297, 340).stroke();

      // Current Streak
      doc.fillColor('#f97316').fontSize(18).font('Helvetica-Bold')
         .text(`${stats.dailyStreak} Days`, 60, 300);
      doc.fillColor('#a1a1aa').fontSize(8).font('Helvetica')
         .text('CURRENT STREAK', 60, 324);

      // Longest Streak
      doc.fillColor('#00c6ff').fontSize(18).font('Helvetica-Bold')
         .text(`${stats.longestStreak} Days`, 317, 300);
      doc.fillColor('#a1a1aa').fontSize(8).font('Helvetica')
         .text('LONGEST STREAK', 317, 324);

      // Group tasks by domain/type
      const domains = ['daily', 'health', 'study', 'work'];
      const tasksByDomain = {};
      domains.forEach(d => {
        tasksByDomain[d] = [];
      });

      // Capture any other types/domains the user created
      tasks.forEach(t => {
        const type = t.type ? t.type.toLowerCase() : 'other';
        if (!tasksByDomain[type]) {
          tasksByDomain[type] = [];
        }
        tasksByDomain[type].push(t);
      });

      let currentY = 370;

      // Draw horizontal habit tracking grids for each domain
      Object.keys(tasksByDomain).forEach(domain => {
        const domainTasks = tasksByDomain[domain];
        if (domainTasks.length === 0) return; // skip domains without tasks

        // Determine unique habits for this domain, sorted by tracking frequency
        const frequency = {};
        domainTasks.forEach(t => {
          frequency[t.title] = (frequency[t.title] || 0) + 1;
        });
        const visibleTitles = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
        if (visibleTitles.length === 0) return;

        // Table dimensions
        const titleColWidth = 110;
        const totalGridWidth = 515;
        const dayColWidth = (totalGridWidth - titleColWidth) / 30; // 13.5 pt each

        // Estimate height: Header (25pt) + Table header (20pt) + (visibleTitles.length * 18pt)
        const requiredHeight = 35 + 20 + (visibleTitles.length * 18) + 15;
        if (currentY + requiredHeight > 780) {
          doc.addPage();
          currentY = 40;
        }

        // Domain Section Header
        const domainTitle = `${domain.toUpperCase()} HABIT TRACKING GRID`;
        doc.fillColor('#00c6ff').fontSize(12).font('Helvetica-Bold')
           .text(domainTitle, 40, currentY);
        
        // Legend description
        doc.fillColor('#71717a').fontSize(8).font('Helvetica')
           .text('Legend:   o Completed (Green)  |  o Pending (Red)  |  - Not Tracked (Gray)', 40, currentY + 15);

        currentY += 28;

        // Helper to draw the table header
        const drawTableHeader = (yVal) => {
          // Table header box
          doc.rect(40, yVal, totalGridWidth, 20).fill('#1c1c1f');
          
          // HABIT/TASK column header
          doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
             .text('HABIT / TASK', 45, yVal + 6);

          // Vertical divider line after HABIT/TASK
          doc.strokeColor('#27272a').lineWidth(0.5)
             .moveTo(40 + titleColWidth, yVal).lineTo(40 + titleColWidth, yVal + 20).stroke();

          // Render each day number column header
          dates.forEach((dateStr, dateIdx) => {
            const colX = 40 + titleColWidth + (dateIdx * dayColWidth);
            const dayNum = new Date(dateStr).getUTCDate(); // get calendar day

            doc.fillColor('#ffffff').fontSize(6).font('Helvetica-Bold');
            const textOffset = dayNum < 10 ? 4.5 : 2.5;
            doc.text(`${dayNum}`, colX + textOffset, yVal + 7);

            // Draw vertical column grid lines
            if (dateIdx < 29) {
              doc.strokeColor('#27272a').lineWidth(0.5)
                 .moveTo(colX + dayColWidth, yVal).lineTo(colX + dayColWidth, yVal + 20).stroke();
            }
          });

          // Draw bottom line
          doc.strokeColor('#27272a').lineWidth(0.5)
             .moveTo(40, yVal + 20).lineTo(555, yVal + 20).stroke();
        };

        // Draw header
        drawTableHeader(currentY);
        currentY += 20;

        // Draw rows for each unique habit
        visibleTitles.forEach((title, rowIdx) => {
          // Check page limit for row (18pt height)
          if (currentY + 18 > 780) {
            doc.addPage();
            currentY = 40;
            drawTableHeader(currentY);
            currentY += 20;
          }

          // Alternating row background colors
          if (rowIdx % 2 === 0) {
            doc.rect(40, currentY, totalGridWidth, 18).fill('#0f0f11');
          } else {
            doc.rect(40, currentY, totalGridWidth, 18).fill('#141416');
          }

          // Render Habit Title (Row title)
          doc.fillColor('#fafafa').fontSize(8.5).font('Helvetica');
          doc.text(title, 45, currentY + 5, {
            width: titleColWidth - 10,
            height: 12,
            ellipsis: true
          });

          // Divider after habit title
          doc.strokeColor('#27272a').lineWidth(0.5)
             .moveTo(40 + titleColWidth, currentY).lineTo(40 + titleColWidth, currentY + 18).stroke();

          // Render cells for each of the 30 days
          dates.forEach((dateStr, dateIdx) => {
            const colX = 40 + titleColWidth + (dateIdx * dayColWidth);
            const cellCenterX = colX + (dayColWidth / 2);
            const cellCenterY = currentY + 9;

            // Find matching task log
            const dayTask = domainTasks.find(t => t.date === dateStr && t.title === title);

            if (dayTask) {
              if (dayTask.completed) {
                // Completed: green dot
                doc.fillColor('#10b981').circle(cellCenterX, cellCenterY, 3.2).fill();
              } else {
                // Pending: red dot
                doc.fillColor('#ef4444').circle(cellCenterX, cellCenterY, 3.2).fill();
              }
            } else {
              // Not tracked: gray dash
              doc.fillColor('#4b5563').fontSize(8).font('Helvetica-Bold')
                 .text('-', cellCenterX - 2, currentY + 5);
            }

            // Divider between columns in row
            if (dateIdx < 29) {
              doc.strokeColor('#27272a').lineWidth(0.5)
                 .moveTo(colX + dayColWidth, currentY).lineTo(colX + dayColWidth, currentY + 18).stroke();
            }
          });

          // Draw bottom line
          doc.strokeColor('#27272a').lineWidth(0.5)
             .moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke();

          currentY += 18;
        });

        // Separator space between different domain grids
        currentY += 25;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Send the monthly report to a user
 */
async function sendMonthlyReport(user) {
  const stats = await getUserStats(user._id);
  const htmlContent = generateEmailHTML(stats);
  const pdfBuffer = await generatePDFReport(stats, user._id);

  // Write to a local preview files so they are always inspectable locally
  const fs = require('fs');
  const path = require('path');
  let localHtmlPath = '';
  let localPdfPath = '';
  try {
    const previewDir = path.join(__dirname, '../previews');
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }
    
    // Save HTML
    const htmlFilename = `report-${user._id}.html`;
    const htmlFullPath = path.join(previewDir, htmlFilename);
    fs.writeFileSync(htmlFullPath, htmlContent);
    localHtmlPath = `backend/previews/${htmlFilename}`;
    
    // Save PDF
    const pdfFilename = `report-${user._id}.pdf`;
    const pdfFullPath = path.join(previewDir, pdfFilename);
    fs.writeFileSync(pdfFullPath, pdfBuffer);
    localPdfPath = `backend/previews/${pdfFilename}`;
    
    console.log(`[EMAIL] Local HTML preview saved to: ${localHtmlPath}`);
    console.log(`[EMAIL] Local PDF preview saved to: ${localPdfPath}`);
  } catch (err) {
    console.error('[EMAIL] Failed to write local preview files:', err);
  }

  // If RESEND_API_KEY is not configured, fall back immediately to local previews
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY is not configured. Falling back to local previews.');
    return { 
      success: true, 
      smtpFailed: true, 
      localPreview: localHtmlPath,
      localPdf: localPdfPath
    };
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM || 'Wedo <onboarding@resend.dev>';

    const response = await resend.emails.send({
      from: fromAddress,
      to: stats.email,
      subject: `Your Wedo Monthly Productivity Report 📊`,
      html: htmlContent,
      attachments: [
        {
          filename: `Wedo-Monthly-Report-${stats.name.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    if (response.error) {
      throw new Error(response.error.message || JSON.stringify(response.error));
    }

    console.log(`[EMAIL] Email sent successfully via Resend API. ID: ${response.data.id}`);
    return { success: true, localPreview: localHtmlPath, localPdf: localPdfPath };
  } catch (error) {
    console.warn('[EMAIL] Resend API Delivery failed. Local preview files are available.', error.message);
    return { 
      success: true, 
      smtpFailed: true, 
      localPreview: localHtmlPath,
      localPdf: localPdfPath
    };
  }
}

module.exports = {
  sendMonthlyReport,
  getUserStats
};
