const cron = require('node-cron');
const { getPool } = require('../config/db');

/**
 * Initialize scheduled jobs for:
 * - Application deadline reminders (1 week before)
 * - Auto-reject when offer_deadline has passed
 *
 * For now, we do NOT send real emails. Instead, we log actions to the console.
 */
function initReminderJobs() {
  // Run once a day at 09:00 server time
  cron.schedule('0 9 * * *', async () => {
    const pool = getPool();

    try {
      // 1) Application deadline reminders (1 week before)
      const [reminderRows] = await pool.execute(
        `SELECT si.id, si.title, si.company_name, si.application_deadline, u.email
         FROM student_internships si
         JOIN users u ON si.user_id = u.id
         WHERE si.reminder_enabled = 1
           AND si.application_deadline = DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
      );

      reminderRows.forEach((row) => {
        console.log(
          `[ReminderJob] Would send reminder email to ${row.email} about internship "${row.title}" at ${row.company_name}, deadline ${row.application_deadline}`
        );
      });

      // 2) Auto-reject when offer_deadline has passed and status is not Accepted/Rejected
      const [toAutoReject] = await pool.execute(
        `SELECT id, title, company_name, offer_deadline, status
         FROM student_internships
         WHERE offer_deadline IS NOT NULL
           AND offer_deadline < CURDATE()
           AND status NOT IN ('Accepted', 'Rejected')`
      );

      if (toAutoReject.length > 0) {
        const ids = toAutoReject.map((row) => row.id);
        await pool.execute(
          `UPDATE student_internships
           SET status = 'Rejected',
               updated_at = NOW(),
               last_status_change_at = NOW()
           WHERE id IN (${ids.map(() => '?').join(', ')})`,
          ids
        );

        toAutoReject.forEach((row) => {
          console.log(
            `[ReminderJob] Auto-marked internship "${row.title}" at ${row.company_name} as Rejected (offer deadline ${row.offer_deadline} passed)`
          );
        });
      }
    } catch (err) {
      console.error('[ReminderJob] Error running reminder/auto-reject job:', err);
    }
  });
}

module.exports = {
  initReminderJobs,
};

