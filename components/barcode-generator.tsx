"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, QrCode, Printer, Download, Loader2 } from "lucide-react"
import type { ProductionUnit } from "@/lib/type"

interface BarcodeGeneratorProps {
  onBack: () => void
}

interface GeneratedBarcode {
  jsBarcode: string
  process: string
  svg: string
}

export function BarcodeGenerator({ onBack }: BarcodeGeneratorProps) {
  const [uniqCode, setUniqCode] = useState("")
  const [, setGeneratedBarcodes] = useState<GeneratedBarcode[]>([])
  const [units, setUnits] = useState<ProductionUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // ✅ Fetch units dari API
  const fetchUnits = async () => {
    try {
      const res = await fetch("/api/productions/units")
      if (res.ok) {
        const { data } = await res.json()
        setUnits(data) // sudah terfilter di backend (punya genUnits)
      }
    } catch (err) {
      console.error("Error fetch units:", err)
      toast({
        title: "Error",
        description: "Gagal memuat Production Unit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  // ✅ Generate barcode (modal form)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uniqCode) {
      toast({
        title: "Error",
        description: "Harap isi uniqCode",
        variant: "destructive",
      })
      return
    }

    setFormLoading(true)
    try {
      const res = await fetch("/api/barcode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqCode }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedBarcodes(data.barcodes)
        toast({
          title: "Berhasil",
          description: "Barcode berhasil dibuat",
        })
        setShowGenerateModal(false)
        setUniqCode("")
        fetchUnits()
      } else {
        throw new Error("Gagal generate barcode")
      }
    } catch (err) {
      console.error("Error generate:", err)
      toast({
        title: "Error",
        description: "Gagal membuat barcode",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // ✅ Print
  const printBarcode = (jsBarcode: string, process: string) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Barcode</title></head>
          <body style="margin:0; padding:20px; text-align:center;">
            <div style="margin-bottom:10px;">
              <strong>UniqCode: ${uniqCode}</strong><br>
              <strong>Process: ${process}</strong>
            </div>
            ${jsBarcode}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // ✅ Download
  const downloadBarcode = (jsBarcode: string, process: string) => {
    const blob = new Blob([jsBarcode], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `barcode-${uniqCode}-${process}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Dashboard
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Barcode Generator</h1>
        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
          <DialogTrigger asChild>
            <Button>
              <QrCode className="mr-2 h-4 w-4" />
              Generate Barcode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Barcode</DialogTitle>
              <DialogDescription>Masukkan uniqCode untuk membuat semua barcode proses</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                placeholder="Masukkan uniqCode"
                value={uniqCode}
                onChange={(e) => setUniqCode(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ Table daftar unit */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Production Unit</CardTitle>
          <CardDescription>
            Menampilkan Production Unit yang sudah memiliki <code>genUnits</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Kode Unit</TableHead>
                  <TableHead>Jumlah genUnits</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Belum ada unit yang memiliki genUnits
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((u, i) => (
                    <TableRow key={u.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono">{u.uniqCode}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.genUnits?.length ?? 0}</Badge>
                      </TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => printBarcode(u.uniqCode, "ALL")}>
                            <Printer className="h-4 w-4 mr-1" /> Print
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadBarcode(u.uniqCode, "ALL")}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
