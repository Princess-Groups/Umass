import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyRevenueChart, ServiceBreakdownChart, PaymentMethodChart } from "@/components/dashboard/Charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, Users, FileText, AlertCircle, Clock, Award, CalendarClock } from "lucide-react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Logo } from "@/components/Logo";


export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("invoice_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*")).data ?? [],
  });

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);

  const monthInvoices = invoices.filter((i) => new Date(i.invoice_date) >= startMonth);
  const yearInvoices = invoices.filter((i) => new Date(i.invoice_date) >= startYear);

  const monthRevenue = monthInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const yearRevenue = yearInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const outstanding = invoices.reduce((s, i) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);
  const pendingCount = invoices.filter((i) => i.payment_status !== "paid").length;
  const avgBill = invoices.length ? invoices.reduce((s, i) => s + Number(i.total_amount), 0) / invoices.length : 0;

  const serviceCounts = new Map<string, number>();
  invoices.forEach((i) => serviceCounts.set(i.service_type, (serviceCounts.get(i.service_type) ?? 0) + 1));
  const topService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const upcomingRefixing = invoices.filter((i) => i.refixing_due_date && new Date(i.refixing_due_date) >= now && new Date(i.refixing_due_date) <= in7);
  const overdueRefixing = invoices.filter((i) => i.refixing_due_date && new Date(i.refixing_due_date) < now);

  return (
    <div className="space-y-8 max-w-[1600px]">
      <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 shadow-elegant">
        <div className="flex items-center gap-5">
          <Logo size={84} className="ring-4 ring-white/40" />
          <div>
            <h1 className="font-display text-4xl text-white drop-shadow">Uma's Luxora</h1>
            <p className="text-white/85 mt-1 text-sm uppercase tracking-[0.25em]">Permanent Hair Extensions</p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-display text-3xl">Good day ✨</h2>
        <p className="text-muted-foreground mt-1">Here's how your studio is performing.</p>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue this month" value={fmtCurrency(monthRevenue)} icon={IndianRupee} variant="primary" trend={`${monthInvoices.length} invoices`} />
        <StatCard label="Revenue this year" value={fmtCurrency(yearRevenue)} icon={TrendingUp} variant="accent" trend={`${yearInvoices.length} invoices`} />
        <StatCard label="Outstanding" value={fmtCurrency(outstanding)} icon={AlertCircle} variant="warning" trend={`${pendingCount} pending`} />
        <StatCard label="Total clients" value={clients.length} icon={Users} trend={`${monthInvoices.length} served this month`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bills generated" value={invoices.length} icon={FileText} />
        <StatCard label="Avg. bill value" value={fmtCurrency(avgBill)} icon={IndianRupee} />
        <StatCard label="Top service" value={topService} icon={Award} variant="accent" />
        <StatCard label="Refixing due (7 days)" value={upcomingRefixing.length} icon={CalendarClock} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><MonthlyRevenueChart invoices={invoices} /></div>
        <ServiceBreakdownChart invoices={invoices} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PaymentMethodChart invoices={invoices} />

        <Card className="p-6 border-border/60 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl">Refixing alerts</h3>
              <p className="text-xs text-muted-foreground">Upcoming & overdue follow-ups</p>
            </div>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {[...overdueRefixing, ...upcomingRefixing].slice(0, 6).map((i) => {
              const overdue = new Date(i.refixing_due_date!) < now;
              return (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition">
                  <div>
                    <div className="font-medium text-sm">{i.client_name}</div>
                    <div className="text-xs text-muted-foreground">{i.service_type} · {i.mobile}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={overdue ? "destructive" : "secondary"}>{overdue ? "Overdue" : "Upcoming"}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{fmtDate(i.refixing_due_date!)}</div>
                  </div>
                </div>
              );
            })}
            {!overdueRefixing.length && !upcomingRefixing.length && (
              <p className="text-sm text-muted-foreground text-center py-8">No refixing alerts. You're all caught up.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
