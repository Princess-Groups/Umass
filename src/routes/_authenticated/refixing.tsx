import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, MessageCircle, Phone } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/refixing")({ component: RefixingPage });

function RefixingPage() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*").not("refixing_due_date", "is", null).order("refixing_due_date", { ascending: true })).data ?? [],
  });

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const today = invoices.filter((i) => new Date(i.refixing_due_date!).toDateString() === now.toDateString());
  const upcoming = invoices.filter((i) => { const d = new Date(i.refixing_due_date!); return d > now && d <= in7; });
  const overdue = invoices.filter((i) => new Date(i.refixing_due_date!) < now);

  const sections = [
    { title: "Today", items: today, variant: "default" as const, icon: CalendarClock },
    { title: "Upcoming (next 7 days)", items: upcoming, variant: "secondary" as const, icon: CalendarClock },
    { title: "Overdue", items: overdue, variant: "destructive" as const, icon: CalendarClock },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-display text-4xl">Refixing</h1>
        <p className="text-muted-foreground mt-1">Follow-up appointments for hair extensions and services.</p>
      </div>

      {sections.map((s) => (
        <Card key={s.title} className="p-6 border-border/60 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">{s.title}</h2>
            <Badge variant={s.variant}>{s.items.length}</Badge>
          </div>
          {!s.items.length ? (
            <p className="text-sm text-muted-foreground py-4">Nothing here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium">{i.client_name}</div>
                      <div className="text-xs text-muted-foreground">{i.mobile}</div>
                    </TableCell>
                    <TableCell className="text-sm">{i.service_type}</TableCell>
                    <TableCell className="text-sm">{fmtDate(i.refixing_due_date!)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild className="rounded-full">
                        <a href={`https://wa.me/${i.mobile.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ))}
    </div>
  );
}
