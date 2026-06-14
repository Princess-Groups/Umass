import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

const USERNAME = "Umasluxora";
const PASSWORD = "Umaluxora";

function LoginPage() {
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (u.trim() === USERNAME && p === PASSWORD) {
      localStorage.setItem("luxora_auth", "1");
      toast.success("Welcome back to Uma's Luxora");
      navigate({ to: "/" });
    } else {
      toast.error("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur shadow-elegant p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <Logo size={72} />
          <div className="text-center">
            <h1 className="font-display text-2xl">Uma's Luxora</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Sign In</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
