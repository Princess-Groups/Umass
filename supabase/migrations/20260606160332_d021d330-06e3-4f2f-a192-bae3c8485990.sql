
-- Open public access (no auth) for the admin dashboard tables
DROP POLICY IF EXISTS "Admins manage clients" ON public.clients;
DROP POLICY IF EXISTS "Admins manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage business_settings" ON public.business_settings;

CREATE POLICY "Public access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access business_settings" ON public.business_settings FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO anon, authenticated;
