import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import FlameMark from "@/components/FlameMark";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/pantry", label: "Pantry" },
  { to: "/recipes", label: "Recipes" },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
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
      <nav className="flex gap-1 border-b border-border px-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
