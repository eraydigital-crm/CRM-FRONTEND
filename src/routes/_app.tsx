import { Outlet, Navigate } from "react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
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
