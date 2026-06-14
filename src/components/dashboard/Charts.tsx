import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

interface Invoice {
  invoice_date: string;
  total_amount: number;
  amount_paid: number;
  service_type: string;
  technician: string | null;
  payment_method: string | null;
}

export function MonthlyRevenueChart({ invoices }: { invoices: Invoice[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en", { month: "short" });
      map.set(key, 0);
    }
    invoices.forEach((inv) => {
      const d = new Date(inv.invoice_date);
      const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthDiff < 0 || monthDiff > 11) return;
      const key = d.toLocaleString("en", { month: "short" });
      map.set(key, (map.get(key) ?? 0) + Number(inv.amount_paid));
    });
    return Array.from(map, ([month, revenue]) => ({ month, revenue }));
  }, [invoices]);

  return (
    <Card className="p-6 border-border/60 shadow-soft">
      <h3 className="font-display text-xl mb-1">Monthly Revenue</h3>
      <p className="text-xs text-muted-foreground mb-4">Last 12 months</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ServiceBreakdownChart({ invoices }: { invoices: Invoice[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((i) => map.set(i.service_type, (map.get(i.service_type) ?? 0) + Number(i.amount_paid)));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [invoices]);

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-muted-foreground)"];

  return (
    <Card className="p-6 border-border/60 shadow-soft">
      <h3 className="font-display text-xl mb-1">Revenue by Service</h3>
      <p className="text-xs text-muted-foreground mb-4">Top services</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function PaymentMethodChart({ invoices }: { invoices: Invoice[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((i) => {
      const k = i.payment_method ?? "unpaid";
      map.set(k, (map.get(k) ?? 0) + Number(i.amount_paid));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [invoices]);

  return (
    <Card className="p-6 border-border/60 shadow-soft">
      <h3 className="font-display text-xl mb-1">Payment Methods</h3>
      <p className="text-xs text-muted-foreground mb-4">Collected amount split</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Bar dataKey="value" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
