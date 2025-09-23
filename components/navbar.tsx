"use client";

import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Factory, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive text-destructive-foreground";
      case "QC":
        return "bg-accent text-accent-foreground";
      case "OPT":
        return "bg-primary text-primary-foreground";
      case "SCM":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-primary/90 text-primary-foreground backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Factory className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Production Management</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 max-w-[150px]">
              <User className="h-4 w-4 opacity-80 shrink-0" />
              <span
                className="truncate text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                title={user?.name}
              >
                {user?.name}
              </span>
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="h-8 px-2 md:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Keluar</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
