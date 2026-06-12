const cron = require('node-cron');
const User = require('../models/User');
const { sendMonthlyReport } = require('./emailService');

// Schedule checking every day at 9:00 AM (0 9 * * *)
cron.schedule('0 9 * * *', async () => {
  console.log('[SCHEDULER] Running daily check for monthly report...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // If tomorrow's date is 1, then today is the last day of the month
  if (tomorrow.getDate() === 1) {
    console.log('[SCHEDULER] Today is the last day of the month. Preparing monthly reports...');
    try {
      const users = await User.find({ monthlyReportEnabled: true });
      console.log(`[SCHEDULER] Found ${users.length} users with monthly reports enabled.`);
      
      for (const user of users) {
        try {
          await sendMonthlyReport(user);
          console.log(`[SCHEDULER] Successfully sent monthly report to ${user.email}`);
        } catch (err) {
          console.error(`[SCHEDULER] Failed to send report to ${user.email}:`, err);
        }
      }
    } catch (err) {
      console.error('[SCHEDULER] Error processing monthly report cron job:', err);
    }
  } else {
    console.log('[SCHEDULER] Today is not the last day of the month. Skipping report dispatch.');
  }
});

console.log('[SCHEDULER] Monthly report scheduler initialized.');
