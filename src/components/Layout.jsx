import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import FlameMark from "@/components/FlameMark";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LogOut, Refrigerator, ChefHat, Trophy, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/pantry", label: "Pantry", icon: Refrigerator },
  { to: "/recipes", label: "Recipes", icon: ChefHat },
  { to: "/ranks", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <FlameMark className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-tight">Cookin'</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </header>

      <main className="flex-1 pb-20">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-border bg-card">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
