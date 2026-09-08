import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import FlameMark from "@/components/FlameMark";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

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

      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          You're in, {user?.email}
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Auth is wired up. Pantry, recipes, verified cooking, and ranks are next.
        </p>
      </div>
    </div>
  );
}
