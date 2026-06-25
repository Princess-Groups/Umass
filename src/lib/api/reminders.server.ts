import { createServerFn } from "@tanstack/react-start";
import { checkAndSendReminders } from "../reminder-scheduler.server";
import { sendWhatsAppMessage } from "../whatsapp.server";
import { getServerConfig } from "../config.server";

export const sendAllReminders = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const result = await checkAndSendReminders(undefined, true);
      return { success: true, sent: result.sent, errors: result.errors };
    } catch (error) {
      console.error("Reminder error:", error);
      return { success: false, error: String(error) };
    }
  });

export const sendTestMessage = createServerFn({ method: "POST" })
  .handler(async () => {
    const config = getServerConfig();
    const ownerNumber = "919159250079";
    const message = "🧪 Test message — WhatsApp is working!";
    const ok = await sendWhatsAppMessage({ phone: ownerNumber, message });
    return { success: ok, message: ok ? "Message sent!" : "Failed" };
  });

export const sendClientReminder = createServerFn({ method: "POST" })
  .handler(async (data: { clientId: string; clientName: string; clientPhone: string }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // no extra import needed
    const config = getServerConfig();
    if (!config.whatsappApiKey) return { success: false, error: "WhatsApp not configured" };

    const { data: settings } = await supabaseAdmin.from("business_settings").select("whatsapp_number").single();
    const ownerPhone = settings?.whatsapp_number;
    if (!ownerPhone) return { success: false, error: "Owner number not configured" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("id, client_name, refixing_due_date")
      .eq("client_id", data.clientId)
      .not("refixing_due_date", "is", null)
      .gte("refixing_due_date", today.toISOString());

    if (!invoices?.length) return { success: true, sent: 0, message: "No upcoming appointments" };

    let sent = 0;
    for (const inv of invoices) {
      const dueDate = new Date(inv.refixing_due_date);
      const ok1 = await sendWhatsAppMessage({
        phone: data.clientPhone,
        clientName: data.clientName,
        appointmentDate: inv.refixing_due_date,
      });
      const ok2 = await sendWhatsAppMessage({
        phone: ownerPhone,
        clientName: data.clientName,
        appointmentDate: inv.refixing_due_date,
      });
      if (ok1 || ok2) sent++;
    }
    return { success: true, sent, total: invoices.length };
  });
