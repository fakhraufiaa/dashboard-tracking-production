"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Navbar } from "./navbar";
import { ProductionManagement } from "./production-management";
import { UserManagement } from "./user-management";
import { BarcodeGenerator } from "./barcode-generator";
import { ProcessLogging } from "./process-logging";
import { Button } from "@/components/ui/button";
import { BarcodeScanner  } from "./barcode-scanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Factory,
  Users,
  QrCode,
  ClipboardCheck,
  ChartColumn,
  Code,
  Shield,
  Scan,
  QrCodeIcon,
  ScanBarcodeIcon,
} from "lucide-react";
import LinesAssy from "./lines-assy";
import LinesWiring from "./lines-wiring";
import LinesQC from "./lines-qc";
import LinesPacking from "./lines-pack";
import { useLinesData } from "@/lib/useLinesData";
import { ChartBar } from "./bar-chart";
import { PageListLinesLog } from "./lines-log";
import dayjs from "@/lib/dayjs";

export function Dashboard() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<string | null>(null);
  const [processType, setProcessType] = useState<
    "ASSY" | "WIRING" | "QC" | "FINISH"
  >("ASSY");
  const { data, loading } = useLinesData();

  const getWelcomeMessage = () => {
    const hour = dayjs().toDate().getHours();
    if (hour < 12) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const getRoleAccess = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          {
            title: "Manajemen Produksi",
            desc: "Kelola produksi dan unit",
            icon: Factory,
            page: "production",
          },
          {
            title: "Manajemen User",
            desc: "Kelola pengguna sistem",
            icon: Users,
            page: "users",
          },
          {
            title: "Generate Barcode",
            desc: "Buat barcode produksi",
            icon: QrCode,
            page: "barcode",
          },
          {
            title: "Process Logging",
            desc: "Monitor proses",
            icon: ClipboardCheck,
            page: "logging",
          },
          {
            title: "Scan Barcode",
            desc: "Scan barcode produksi",
            icon: QrCode,
            page: "scan",
          },
        ];
      case "QC":
        return [
          {
            title: "Process Logging",
            desc: "Monitor dan update QC",
            icon: ClipboardCheck,
            page: "logging",
          },
          {
            title: "Scan Barcode",
            desc: "Scan barcode produksi",
            icon: QrCode,
            page: "scan",
          },
        ];
      case "OPT":
      case "SCM":
        return [
          {
            title: "Scan Barcode",
            desc: "Scan barcode produksi",
            icon: QrCode,
            page: "scan",
          },
        ];
      default:
        return [];
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "production":
        return <ProductionManagement onBack={() => setActivePage(null)} />;
      case "users":
        return <UserManagement onBack={() => setActivePage(null)} />;
      case "barcode":
        return <BarcodeGenerator onBack={() => setActivePage(null)} />;
      case "logging":
        return (
          <ProcessLogging
            onBack={() => setActivePage(null)}
            goToPage={setActivePage}
          />
        );
      case "scan":
        return <BarcodeScanner onBack={() => setActivePage(null)} />;
      case "lineslog":
        return (
          <PageListLinesLog
            onBack={() => setActivePage(null)}
            goToPage={setActivePage}
            processType={processType}
          />
        );
      default:
        return null;
    }
  };

  if (activePage) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        {renderActivePage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">
            {getWelcomeMessage()}, {user?.name}!
          </h1>
          <p className="text-muted-foreground/40 mt-2">
            Sistem Manajemen Produksi dengan Barcode Tracking
          </p>
        </div>

        {/* Widget floating pojok kanan bawah */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setActivePage("scan")}
            variant="outline"
            size="icon"
            className="h-12 w-12 rectangle-full shadow-lg bg-primary text-primary-foreground"
          >
            <ScanBarcodeIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Section khusus lines */}
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-6 place-items-center md:place-items-stretch md:grid-cols-2 lg:grid-cols-4 cursor-pointer">
            <div
              onClick={() => {
                setProcessType("ASSY");
                setActivePage("lineslog");
              }}
            >
              <LinesAssy
                count={data?.ASSY?.units ?? 0}
                amount={data?.ASSY?.personnel ?? 0}
              />
            </div>
            <div
              onClick={() => {
                setActivePage("lineslog");
                setProcessType("WIRING");
              }}
            >
              <LinesWiring
                count={data?.WIRING?.units ?? 0}
                amount={data?.WIRING?.personnel ?? 0}
              />
            </div>
            <div
              onClick={() => {
                setActivePage("lineslog");
                setProcessType("QC");
              }}
            >
              <LinesQC
                count={data?.QC?.units ?? 0}
                amount={data?.QC?.personnel ?? 0}
              />
            </div>
            <div
              onClick={() => {
                setActivePage("lineslog");
                setProcessType("FINISH");
              }}
            >
              <LinesPacking
                count={data?.FINISH?.units ?? 0}
                amount={data?.FINISH?.personnel ?? 0}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {user?.role === "ADMIN" && (
            <div className="lg:col-span-1">
              <ChartBar />
            </div>
          )}

          <div className="lg:col-span-2 gap-6 grid md:grid-cols-2">
            {getRoleAccess()
              .filter((item) => item.page !== "scan")
              .map((item, index) => {
                const Icon = item.icon;
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
                          <CardTitle className="text-lg">
                            {item.title}
                          </CardTitle>
                          <CardDescription>{item.desc}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
          </div>
        </div>

        <div className="mt-8">
          <Card className="p-5 md:p-6 border border-border bg-card/60 rounded-xl">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold">Status Sistem</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Informasi akses berdasarkan role
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Role aktif:</span>
                  <Badge variant="secondary">{user?.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Kode: {user?.uniqCode}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
