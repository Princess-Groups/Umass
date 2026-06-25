import { getServerConfig } from './config.server';

export async function sendWhatsAppMessage({
  phone,
  clientName,
  appointmentDate,
}: {
  phone: string;
  clientName?: string;
  appointmentDate?: string;
}): Promise<boolean> {
  const config = getServerConfig();
  const apiKey = config.whatsappApiKey;
  const phoneNumberId = config.whatsappPhoneNumberId;

  if (!apiKey || !phoneNumberId) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  const formattedPhone = phone.replace(/\D/g, '').replace(/^0/, '91');
  const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();

  const name = clientName || 'Client';
  const date = appointmentDate
    ? new Date(appointmentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'soon';
  const msg = `Hi ${name},\n\n📅 Your hair replacement appointment is scheduled for ${date}.\n\nPlease confirm if you're still available or let us know if you need to reschedule.\n\nThank you!`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: msg },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      return false;
    }

    const result = await response.json();
    console.log('WhatsApp message sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

export function formatReminderMessage(
  clientName: string,
  appointmentDate: string,
  daysUntil: number,
  isForOwner: boolean = false
): string {
  const date = new Date(appointmentDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isForOwner) {
    return `📅 Upcoming Appointment\n\nClient: ${clientName}\nDate: ${date}\nDays until: ${daysUntil}\n\nPlease prepare for the session accordingly.`;
  }

  return `Hi ${clientName},\n\n📅 Your hair replacement appointment is scheduled for ${date} (in ${daysUntil} days).\n\nPlease confirm if you're still available or let us know if you need to reschedule.\n\nThank you!`;
}
