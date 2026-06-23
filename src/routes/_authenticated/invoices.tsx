import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, downloadCSV } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/invoices")({ component: InvoicesPage });

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default", partially_paid: "secondary", pending: "destructive",
};

function InvoicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*").order("invoice_date", { ascending: false })).data ?? [],
  });

  const filtered = invoices.filter((i) => {
    const matchesSearch = !search || i.client_name.toLowerCase().includes(search.toLowerCase()) || i.mobile.includes(search) || i.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const inv = invoices.find((i) => i.id === id);
      const amountPaid = status === "paid" ? Number(inv?.total_amount) : status === "pending" ? 0 : Number(inv?.amount_paid);
      const { error } = await supabase.from("invoices").update({ payment_status: status as any, amount_paid: amountPaid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track payments, bills and outstanding amounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadCSV("invoices.csv", filtered as any)} className="rounded-full">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full"><Plus className="w-4 h-4" /> New Invoice</Button>
            </DialogTrigger>
            <NewInvoiceDialog onDone={() => setOpen(false)} />
          </Dialog>
        </div>
      </div>

      <Card className="p-4 border-border/60 shadow-soft">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, mobile, invoice #" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{i.client_name}</div>
                    <div className="text-xs text-muted-foreground">{i.mobile}</div>
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(i.invoice_date)}</TableCell>
                  <TableCell className="text-sm">{i.service_type}</TableCell>
                  <TableCell className="text-right font-medium">{fmtCurrency(Number(i.total_amount))}</TableCell>
                  <TableCell className="text-right">{fmtCurrency(Number(i.amount_paid))}</TableCell>
                  <TableCell>
                    <Select value={i.payment_status} onValueChange={(v) => updateStatus.mutate({ id: i.id, status: v })}>
                      <SelectTrigger className="w-36 h-8">
                        <Badge variant={statusVariants[i.payment_status]}>{i.payment_status.replace("_", " ")}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setEditingId(i.id)}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                      title="Edit invoice"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {editingId && (
        <EditInvoiceDialog
          invoices={invoices}
          editingId={editingId}
          qc={qc}
          onDone={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function EditInvoiceDialog({ invoices, editingId, qc, onDone }: {
  invoices: any[]; editingId: string; qc: any; onDone: () => void;
}) {
  const invoice = invoices.find((i) => i.id === editingId);
  const [form, setForm] = useState({
    refixing_due_date: invoice?.refixing_due_date?.slice(0, 10) ?? "",
  });

  useEffect(() => {
    if (invoice) {
      setForm({ refixing_due_date: invoice.refixing_due_date?.slice(0, 10) ?? "" });
    }
  }, [invoice]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").update({
        refixing_due_date: form.refixing_due_date || null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Refixing date updated"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onDone()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">Edit Refixing Date</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Client: <strong>{invoice?.client_name}</strong></p>
          <Field label="Next session (refixing due date)">
            <Input type="date" value={form.refixing_due_date} onChange={(e) => setForm({ ...form, refixing_due_date: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewInvoiceDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_name: "", mobile: "", service_type: "", technician: "",
    total_amount: "", amount_paid: "", payment_method: "cash",
    invoice_date: new Date().toISOString().slice(0, 10),
    refixing_due_date: "",
  });

  const submit = useMutation({
    mutationFn: async () => {
      const total = Number(form.total_amount) || 0;
      const paid = Number(form.amount_paid) || 0;
      const status = paid >= total && total > 0 ? "paid" : paid > 0 ? "partially_paid" : "pending";
      const invoice_number = `INV-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("invoices").insert({
        invoice_number,
        client_name: form.client_name,
        mobile: form.mobile,
        service_type: form.service_type,
        technician: form.technician || null,
        total_amount: total,
        amount_paid: paid,
        payment_status: status as any,
        payment_method: form.payment_method as any,
        invoice_date: form.invoice_date,
        refixing_due_date: form.refixing_due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice created"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle className="font-display text-2xl">New Invoice</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Client name"><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></Field>
        <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
        <Field label="Service type"><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="e.g. Hair Extension" /></Field>
        <Field label="Technician"><Input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></Field>
        <Field label="Total amount"><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></Field>
        <Field label="Amount paid"><Input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} /></Field>
        <Field label="Payment method">
          <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Invoice date"><Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></Field>
        <Field label="Refixing due date (optional)"><Input type="date" value={form.refixing_due_date} onChange={(e) => setForm({ ...form, refixing_due_date: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button onClick={() => submit.mutate()} disabled={submit.isPending || !form.client_name || !form.mobile || !form.service_type} className="rounded-full">
          {submit.isPending ? "Saving..." : "Create invoice"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
