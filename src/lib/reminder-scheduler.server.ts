import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { sendWhatsAppMessage, formatReminderMessage } from './whatsapp.server';
import { getServerConfig } from './config.server';

export interface ReminderConfig {
  clientReminderDays: number[];
  ownerReminderDays: number[];
}

const DEFAULT_CONFIG: ReminderConfig = {
  clientReminderDays: [5, 1], // Remind client 5 days and 1 day before
  ownerReminderDays: [7, 1], // Remind owner 7 days and 1 day before
};

export async function checkAndSendReminders(config: ReminderConfig = DEFAULT_CONFIG, forceSend = false) {
  try {
    const config_srv = getServerConfig();
    if (!config_srv.whatsappApiKey) {
      console.log('WhatsApp not configured, skipping reminders');
      return { sent: 0, errors: 0 };
    }

    // Get owner's WhatsApp number from business settings
    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('whatsapp_number')
      .single();

    const ownerPhone = settings?.whatsapp_number;
    if (!ownerPhone) {
      console.warn('Owner WhatsApp number not configured');
      return { sent: 0, errors: 0 };
    }

    // Get upcoming appointments (invoices with refixing_due_date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: appointments, error: appointmentError } = await supabaseAdmin
      .from('invoices')
      .select('id, client_id, client_name, mobile, refixing_due_date')
      .not('refixing_due_date', 'is', null)
      .gte('refixing_due_date', today.toISOString());

    if (appointmentError) {
      console.error('Error fetching appointments:', appointmentError);
      return { sent: 0, errors: 1 };
    }

    let sent = 0;
    let errors = 0;

    for (const appointment of appointments || []) {
      const dueDate = new Date(appointment.refixing_due_date);
      const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Force send: send one reminder per appointment (for manual trigger)
      if (forceSend) {
        // Send to client
        const clientMsg = formatReminderMessage(appointment.client_name, appointment.refixing_due_date, daysUntil, false);
        const ok1 = await sendWhatsAppMessage({ phone: appointment.mobile, message: clientMsg });
        if (ok1) { await logReminderSent(appointment.id, 'client', daysUntil); sent++; } else errors++;

        // Send to owner
        const ownerMsg = formatReminderMessage(appointment.client_name, appointment.refixing_due_date, daysUntil, true);
        const ok2 = await sendWhatsAppMessage({ phone: ownerPhone, message: ownerMsg });
        if (ok2) { await logReminderSent(appointment.id, 'owner', daysUntil); sent++; } else errors++;
        continue;
      }

      // Auto mode: send only when exact day matches (for cron job)
      // Check client reminders
      for (const reminderDay of config.clientReminderDays) {
        if (daysUntil === reminderDay) {
          const isAlreadySent = await checkReminderSent(appointment.id, 'client', reminderDay);
          if (isAlreadySent) continue;

          const message = formatReminderMessage(appointment.client_name, appointment.refixing_due_date, daysUntil, false);
          const success = await sendWhatsAppMessage({ phone: appointment.mobile, message });
          if (success) { await logReminderSent(appointment.id, 'client', reminderDay); sent++; }
          else { errors++; }
        }
      }

      // Check owner reminders
      for (const reminderDay of config.ownerReminderDays) {
        if (daysUntil === reminderDay) {
          const isAlreadySent = await checkReminderSent(appointment.id, 'owner', reminderDay);
          if (isAlreadySent) continue;

          const message = formatReminderMessage(appointment.client_name, appointment.refixing_due_date, daysUntil, true);
          const success = await sendWhatsAppMessage({ phone: ownerPhone, message });
          if (success) { await logReminderSent(appointment.id, 'owner', reminderDay); sent++; }
          else { errors++; }
        }
      }
    }

    console.log(`Reminders sent: ${sent}, errors: ${errors}`);
    return { sent, errors };
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
    return { sent: 0, errors: 1 };
  }
}

async function checkReminderSent(
  invoiceId: string,
  recipientType: 'client' | 'owner',
  daysUntil: number
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('reminder_logs')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('recipient_type', recipientType)
    .eq('days_until', daysUntil)
    .single();

  return !!data;
}

async function logReminderSent(
  invoiceId: string,
  recipientType: 'client' | 'owner',
  daysUntil: number
): Promise<void> {
  await supabaseAdmin.from('reminder_logs').insert({
    invoice_id: invoiceId,
    recipient_type: recipientType,
    days_until: daysUntil,
    sent_at: new Date().toISOString(),
  });
}
