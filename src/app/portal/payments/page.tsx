import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { formatDt, formatDate, formatDevisNumber } from "@/lib/format";

type PaymentStatus = "unpaid" | "partial" | "paid";

type Invoice = {
  id: string;
  devis_number: number;
  date: string | null;
  due_date: string | null;
  object: string | null;
  total_dt: number;
  payment_status: PaymentStatus;
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
};
const STATUS_TONE: Record<PaymentStatus, "green" | "amber" | "red"> = {
  unpaid: "red",
  partial: "amber",
  paid: "green",
};

export default async function PortalPayments() {
  await requireClient();
  const supabase = await createClient();

  // RLS returns only this client's invoices.
  const { data } = await supabase
    .from("devis")
    .select("id, devis_number, date, due_date, object, total_dt, payment_status")
    .eq("kind", "facture")
    .order("date", { ascending: false });

  const invoices = (data ?? []) as Invoice[];
  const outstanding = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_dt ?? 0), 0);
  const totalPaid = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((sum, i) => sum + Number(i.total_dt ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Payments</h1>
        <p className="mt-1 text-sm text-ink/55">
          Your invoices and their payment status.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-ink/45">
              Outstanding
            </p>
            <p className="mt-1 text-2xl font-black text-ink">
              {formatDt(outstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-ink/45">
              Total paid
            </p>
            <p className="mt-1 text-2xl font-black text-ink">
              {formatDt(totalPaid)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink/50">
              No invoices yet.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Invoice</TH>
                  <TH>Date</TH>
                  <TH>Due</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <TD className="font-medium text-ink/90">
                      {formatDevisNumber(i.devis_number, "facture")}
                      {i.object ? (
                        <span className="block text-xs text-ink/45">
                          {i.object}
                        </span>
                      ) : null}
                    </TD>
                    <TD>{formatDate(i.date)}</TD>
                    <TD>{formatDate(i.due_date)}</TD>
                    <TD>{formatDt(Number(i.total_dt))}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[i.payment_status]}>
                        {STATUS_LABEL[i.payment_status]}
                      </Badge>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
