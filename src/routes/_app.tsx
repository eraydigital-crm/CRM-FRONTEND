import { Outlet, Navigate } from "react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";
import { session } from "@/lib/api/http";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Either a stored Bearer token (cross-origin setup) or the cookie session
  // flag set by the backend when the front is served same-origin.
  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />
      <div className="lg:pl-64">
        <AppTopbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
