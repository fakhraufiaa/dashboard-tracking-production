"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, ClipboardCheck, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProcessLoggingProps {
  onBack: () => void
}

interface QcProcess {
  id: number
  productionUnitId: number
  productionUnit: {
    uniqCode: string
    production: {
      name: string
    }
  }
  uji_input: boolean
  uji_output: boolean
  uji_ac: boolean
  uji_kabel: boolean
  labelling: boolean
  updatedAt: string
}

interface QcLog {
  id: number
  action: string
  status: boolean
  qcUser: {
    name: string
  }
  createdAt: string
}

export function ProcessLogging({ onBack }: ProcessLoggingProps) {
  const [processes, setProcesses] = useState<QcProcess[]>([])
  const [selectedProcess, setSelectedProcess] = useState<QcProcess | null>(null)
  const [logs, setLogs] = useState<QcLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")


  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const response = await fetch("/api/qc/processes")
      if (response.ok) {
        const data = await response.json()
        setProcesses(data)
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal memuat data proses QC",
        variant: "destructive",
      })
    }
  }

  const fetchLogs = async (processId: number) => {
    try {
      const response = await fetch(`/api/qc/processes/${processId}/logs`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal memuat log proses",
        variant: "destructive",
      })
    }
  }

  const updateQcStatus = async (processId: number, field: string, status: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/qc/processes/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, status }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: `Status ${field} berhasil diupdate`,
        })
        fetchProcesses()
        if (selectedProcess) {
          fetchLogs(selectedProcess.id)
        }
      } else {
        throw new Error("Failed to update QC status")
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengupdate status QC",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProcesses = processes.filter(
    (process) =>
      process.productionUnit.uniqCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.productionUnit.production.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCompletionPercentage = (process: QcProcess) => {
    const total = 5
    const completed = [
      process.uji_input,
      process.uji_output,
      process.uji_ac,
      process.uji_kabel,
      process.labelling,
    ].filter(Boolean).length
    return Math.round((completed / total) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-balance">Process Logging</h1>
        <p className="text-muted-foreground mt-2">Monitor dan update proses Quality Control</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Daftar Proses QC
            </CardTitle>
            <CardDescription>Pilih unit produksi untuk monitoring QC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Unit Produksi</Label>
              <Input
                id="search"
                placeholder="Cari berdasarkan kode atau nama produksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProcesses.map((process) => (
                <div
                  key={process.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProcess?.id === process.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedProcess(process)
                    fetchLogs(process.id)
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{process.productionUnit.uniqCode}</p>
                      <p className="text-sm text-muted-foreground">{process.productionUnit.production.name}</p>
                    </div>
                    <Badge variant="outline">{getCompletionPercentage(process)}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getCompletionPercentage(process)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedProcess && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail QC Process
              </CardTitle>
              <CardDescription>Unit: {selectedProcess.productionUnit.uniqCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { key: "uji_input", label: "Uji Input" },
                  { key: "uji_output", label: "Uji Output" },
                  { key: "uji_ac", label: "Uji AC" },
                  { key: "uji_kabel", label: "Uji Kabel" },
                  { key: "labelling", label: "Labelling" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={selectedProcess[item.key as keyof QcProcess] as boolean}
                      onCheckedChange={(checked) => updateQcStatus(selectedProcess.id, item.key, checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor={item.key} className="flex-1">
                      {item.label}
                    </Label>
                    <Badge variant={selectedProcess[item.key as keyof QcProcess] ? "default" : "secondary"}>
                      {selectedProcess[item.key as keyof QcProcess] ? "Selesai" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>

              {logs.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Log Aktivitas</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="text-sm p-2 bg-muted rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant={log.status ? "default" : "destructive"}>
                            {log.status ? "Selesai" : "Gagal"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          oleh {log.qcUser.name} • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
