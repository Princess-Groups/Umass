import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("luxora_auth") !== "1") {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("luxora_auth");
    navigate({ to: "/login" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="h-16 sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <Logo size={36} />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg">Uma's Luxora</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Permanent Hair Extensions</span>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </header>
          <main className="p-6 lg:p-8 flex-1"><Outlet /></main>
          <footer className="border-t border-border/60 bg-background/60 backdrop-blur px-6 py-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Logo size={44} />
                <div className="leading-tight">
                  <div className="font-display text-base">Uma's Luxora</div>
                  <div className="text-xs text-muted-foreground">Permanent Hair Extensions</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Uma's Luxora. Crafted with care.</p>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
