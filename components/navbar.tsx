"use client"

import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Factory, User } from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive text-destructive-foreground"
      case "QC":
        return "bg-accent text-accent-foreground"
      case "OPT":
        return "bg-primary text-primary-foreground"
      case "SCM":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Factory className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Production Management</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user.name}</span>
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            </div>

            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
