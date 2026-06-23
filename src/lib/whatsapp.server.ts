import { getServerConfig } from './config.server';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  clientName?: string;
  appointmentDate?: string;
}

export async function sendWhatsAppMessage({
  phone,
  message,
}: WhatsAppMessage): Promise<boolean> {
  const config = getServerConfig();
  const apiKey = config.whatsappApiKey;
  const phoneNumberId = config.whatsappPhoneNumberId;

  if (!apiKey || !phoneNumberId) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  // Format phone number: remove special chars, ensure it starts with country code
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('91')) {
    formattedPhone = formattedPhone.startsWith('0')
      ? '91' + formattedPhone.slice(1)
      : '91' + formattedPhone;
  }

  // The token from .env may have quotes — clean it
  const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();

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
          text: {
            body: message,
          },
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
