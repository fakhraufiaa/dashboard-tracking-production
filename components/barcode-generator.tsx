"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, QrCode, Printer, Download, Loader2 } from "lucide-react"
import type { ProductionUnit } from "@/lib/type"

interface BarcodeGeneratorProps {
  onBack: () => void
}

export function BarcodeGenerator({ onBack }: BarcodeGeneratorProps) {
  const [uniqCode, setUniqCode] = useState("")
  const [units, setUnits] = useState<ProductionUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const PROCESSES = [
  "INV",
  "SCC",
  "BATT",
  "PD",
  "PB",
  "WD",
  "WB",
  "QC",
  "PACK",
]


  // ✅ Ambil daftar ProductionUnit
  const fetchUnits = async () => {
  setLoading(true) // pastikan mulai dengan loading
  try {
    const res = await fetch("/api/productions/units")
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API error: ${res.status} - ${text}`)
    }
    const { data } = await res.json()
    setUnits(data)
  } catch (err) {
    console.error("❌ Error fetch units:", err)
    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Gagal memuat Production Unit",
      variant: "destructive",
    })
  } finally {
    setLoading(false) // dijamin terpanggil
  }
}
  useEffect(() => {
    fetchUnits()
  }, [])

  // ✅ Generate barcode
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

  // ✅ Ambil data genUnits (print/download)
  const fetchGenUnits = async (unitId: number) => {
    try {
      const res = await fetch("/api/barcode/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitIds: [unitId] }),
      })
      if (res.ok) {
        const { units } = await res.json()
        return units[0]?.genUnits ?? []
      }
      return []
    } catch (err) {
      console.error("Error fetch genUnits:", err)
      return []
    }
  }

  // const printBarcode = async (unitId: number, uniqCode: string) => {
  //   const genUnits = await fetchGenUnits(unitId)
  //   genUnits.forEach((g: any) => {
  //     const printWindow = window.open("", "_blank")
  //     if (printWindow) {
  //       printWindow.document.write(`
  //         <html>
  //           <head><title>Print Barcode</title></head>
  //           <body style="margin:0; padding:20px; text-align:center;">
  //             <div style="margin-bottom:10px;">
  //               <strong>UniqCode: ${uniqCode}</strong><br>
  //               <strong>Process: ${g.process}</strong>
  //             </div>
  //             ${g.jsBarcode}
  //           </body>
  //         </html>
  //       `)
  //       printWindow.document.close()
  //       printWindow.print()
  //       printWindow.close()
  //     }
  //   })
  // }
const printBarcode = async (unitId: number, uniqCode: string) => {
  const genUnits = await fetchGenUnits(unitId)

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    let content = `
      <div class="page">
        <div class="uniq">${uniqCode ? `#${uniqCode}` : "&nbsp;"}</div>
    `

    PROCESSES.forEach((process) => {
      const g = genUnits.find((gu: { process: string }) => gu.process === process)
      if (g) {
        content += `
          <div class="block">
            <div class="process">${g.process}</div>
            <div class="barcode">${g.jsBarcode}</div>
          </div>
        `
      }
    })

    content += `</div>` // tutup .page

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page {
              size: A6 portrait;
              margin: 5mm;
            }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .page {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              page-break-after: always;
            }
            .uniq {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              text-align: center;
              min-height: 40px;
              line-height: 40px;
            }
            .block {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              margin-bottom: 10px;
            }
            .process {
              margin-bottom: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .barcode svg {
              width: 100%;   
              height: auto;   
              max-height: 20mm;
            }
            .barcode text {
              font-size: 18px !important;
              letter-spacing: 5px;
              font-weight: bold;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }
}






  const downloadBarcode = async (unitId: number, uniqCode: string) => {
    const genUnits = await fetchGenUnits(unitId)
    genUnits.forEach((g: { jsBarcode: BlobPart; process: unknown }) => {
      const blob = new Blob([g.jsBarcode], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `barcode-${uniqCode}-${g.process}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
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
              <DialogDescription>
                Masukkan uniqCode untuk membuat semua barcode proses
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                placeholder="Masukkan uniqCode"
                value={uniqCode}
                onChange={(e) => setUniqCode(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                >
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
            Menampilkan semua unit. Barcode bisa di-print/download setelah digenerate.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-5xl">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Kode Unit</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Belum ada Production Unit
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((u, i) => (
                    <TableRow key={u.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono">{u.uniqCode}</TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printBarcode(u.id, u.uniqCode)}
                          >
                            <Printer className="h-4 w-4 mr-1" /> Print
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBarcode(u.id, u.uniqCode)}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>     
          )}
        </CardContent>
      </Card>
    </main>
  )
}
