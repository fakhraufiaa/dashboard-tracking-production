"use client"

import { useState } from "react"
import { useAuth } from "./auth-provider"
import { Navbar } from "./navbar"
import { ProductionManagement } from "./production-management"
import { UserManagement } from "./user-management"
import { BarcodeGenerator } from "./barcode-generator"
import { ProcessLogging } from "./process-logging"
import { BarcodeScanner } from "./barcode-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Factory, Users, QrCode, ClipboardCheck } from "lucide-react"

export function Dashboard() {
  const { user } = useAuth()
  const [activePage, setActivePage] = useState<string | null>(null)

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Selamat pagi"
    if (hour < 17) return "Selamat siang"
    return "Selamat malam"
  }

  const getRoleAccess = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          { title: "Manajemen Produksi", desc: "Kelola produksi dan unit", icon: Factory, page: "production" },
          { title: "Manajemen User", desc: "Kelola pengguna sistem", icon: Users, page: "users" },
          { title: "Generate Barcode", desc: "Buat barcode produksi", icon: QrCode, page: "barcode" },
          { title: "Process Logging", desc: "Monitor proses QC", icon: ClipboardCheck, page: "logging" },
          { title: "Scan Barcode", desc: "Scan barcode produksi", icon: QrCode, page: "scan" },
        ]
      case "QC":
        return [
          { title: "Process Logging", desc: "Monitor dan update QC", icon: ClipboardCheck, page: "logging" },
          { title: "Scan Barcode", desc: "Scan barcode produksi", icon: QrCode, page: "scan" },
        ]
      case "OPT":
      case "SCM":
        return [{ title: "Scan Barcode", desc: "Scan barcode produksi", icon: QrCode, page: "scan" }]
      default:
        return []
    }
  }

  const renderActivePage = () => {
    switch (activePage) {
      case "production":
        return <ProductionManagement onBack={() => setActivePage(null)} />
    case "users":
        return <UserManagement onBack={() => setActivePage(null)} />
        case "barcode":
        return <BarcodeGenerator onBack={() => setActivePage(null)} />
      case "logging":
        return <ProcessLogging onBack={() => setActivePage(null)} />
      case "scan":
        return <BarcodeScanner onBack={() => setActivePage(null)} />
      default:
        return null
    }
  }

  if (activePage) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        {renderActivePage()}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">
            {getWelcomeMessage()}, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">Sistem Manajemen Produksi dengan Barcode Tracking</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getRoleAccess().map((item, index) => {
            const Icon = item.icon
            return (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActivePage(item.page)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
              <CardDescription>Informasi akses berdasarkan role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span>Role aktif:</span>
                <Badge variant="secondary">{user?.role}</Badge>
                <span className="text-sm text-muted-foreground">• Kode: {user?.uniqCode}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
