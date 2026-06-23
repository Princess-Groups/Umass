-- Create reminder_logs table to track sent WhatsApp reminders
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'owner')),
  days_until INT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invoice_id, recipient_type, days_until)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS reminder_logs_invoice_id_idx ON public.reminder_logs(invoice_id);
CREATE INDEX IF NOT EXISTS reminder_logs_sent_at_idx ON public.reminder_logs(sent_at);

-- Add RLS policy (optional - adjust based on your needs)
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their reminders (optional)
CREATE POLICY "Users can view reminder logs"
  ON public.reminder_logs FOR SELECT
  USING (TRUE);
