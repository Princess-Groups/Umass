import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { sendAllReminders } from "@/lib/api/reminders.server";

export const Route = createFileRoute("/_authenticated/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);

  const handleSendReminders = async () => {
    setLoading(true);
    try {
      const res = await sendAllReminders();
      setResult(res);
      if (res.success) {
        toast.success(`Sent ${res.sent} reminder(s)`);
      } else {
        toast.error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders");
      setResult({ sent: 0, errors: 1 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-display text-4xl bg-clip-text text-transparent gradient-hero">
          Appointment Reminders
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage WhatsApp reminders for upcoming appointments.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleSendReminders}
          disabled={loading}
          className="px-4 py-2 rounded-full gradient-accent text-accent-foreground disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reminders Now"}
        </button>

        {result && (
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm">
              <strong>Reminders sent:</strong> {result.sent}
            </p>
            <p className="text-sm">
              <strong>Errors:</strong> {result.errors}
            </p>
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <h3 className="font-semibold">How it works:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Clients get reminders 5 days and 1 day before their appointment</li>
            <li>Owner gets reminders 7 days and 1 day before each appointment</li>
            <li>Reminders are sent via WhatsApp to configured phone numbers</li>
            <li>Click the button above to send reminders immediately (for testing)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
