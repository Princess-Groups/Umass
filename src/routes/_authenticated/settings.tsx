import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("business_settings").select("*").limit(1).maybeSingle()).data,
  });

  const [form, setForm] = useState({
    business_name: "", logo_url: "", gst_number: "", address: "",
    contact_number: "", whatsapp_number: "", reminder_template: "",
  });

  useEffect(() => {
    if (data) setForm({
      business_name: data.business_name ?? "",
      logo_url: data.logo_url ?? "",
      gst_number: data.gst_number ?? "",
      address: data.address ?? "",
      contact_number: data.contact_number ?? "",
      whatsapp_number: data.whatsapp_number ?? "",
      reminder_template: data.reminder_template ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (data) {
        const { error } = await supabase.from("business_settings").update(form).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("business_settings").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-4xl">Business settings</h1>
        <p className="text-muted-foreground mt-1">Manage your salon details and templates.</p>
      </div>

      <Card className="p-6 border-border/60 shadow-soft space-y-5">
        <Field label="Business name"><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></Field>
        <Field label="Logo URL"><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="GST number"><Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></Field>
          <Field label="Contact number"><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></Field>
        </div>
        <Field label="WhatsApp number"><Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} /></Field>
        <Field label="Address"><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} /></Field>
        <Field label="Reminder message template">
          <Textarea value={form.reminder_template} onChange={(e) => setForm({ ...form, reminder_template: e.target.value })} rows={4} placeholder="Use {name} and {date} as placeholders" />
        </Field>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">
          {save.isPending ? "Saving..." : "Save changes"}
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
