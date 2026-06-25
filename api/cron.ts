// Vercel cron handler — called daily at 9 AM
// This runs as a Nitro serverless function on Vercel
import { checkAndSendReminders } from "../src/lib/reminder-scheduler.server";

export default async () => {
  try {
    const result = await checkAndSendReminders();
    return { success: true, sent: result.sent, errors: result.errors };
  } catch (error) {
    console.error("Cron error:", error);
    return { success: false, error: String(error) };
  }
};
