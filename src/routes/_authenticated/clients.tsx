import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Phone, Mail, MapPin, Bell } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clients")({ component: ClientsPage });

function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", notes: "" });
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert({
        name: form.name,
        mobile: form.mobile,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client added");
      setOpen(false);
      setForm({ name: "", mobile: "", email: "", address: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendReminder = useMutation({
    mutationFn: async () => {
      // Send all reminders from the bell icon
      const { sendAllReminders } = await import("@/lib/api/reminders.server");
      const data = await sendAllReminders();
      if (!data.success) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent} reminder(s)`);
      setSendingReminderId(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setSendingReminderId(null);
    },
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl bg-clip-text text-transparent gradient-hero">Clients</h1>
          <p className="text-muted-foreground mt-1">Your studio's client directory.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-accent text-accent-foreground shadow-lavender hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-2xl">Add Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Client Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Contact No.</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => submit.mutate()} disabled={!form.name || !form.mobile} className="rounded-full gradient-primary text-primary-foreground">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 border-border/60 shadow-elegant gradient-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm"><Phone className="w-3 h-3 text-muted-foreground" />{c.mobile}</div>
                  {c.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs">
                  {c.address ? (
                    <div className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /><span>{c.address}</span></div>
                  ) : <span className="text-muted-foreground/60">—</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.notes}</TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setSendingReminderId(c.id);
                      sendReminder.mutate();
                    }}
                    disabled={sendReminder.isPending && sendingReminderId === c.id}
                    className="p-1 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                    title="Send WhatsApp reminders"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {!clients.length && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No clients yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
