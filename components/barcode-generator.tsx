"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, QrCode, Printer, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BarcodeGeneratorProps {
  onBack: () => void
}

const processTypes = [
  { value: "INV", label: "Inventory" },
  { value: "SCC", label: "Supply Chain Control" },
  { value: "BATT", label: "Battery" },
  { value: "PD", label: "Production Design" },
  { value: "PB", label: "Production Build" },
  { value: "WD", label: "Warehouse Design" },
  { value: "WB", label: "Warehouse Build" },
  { value: "QC", label: "Quality Control" },
  { value: "PACK", label: "Packaging" },
]

export function BarcodeGenerator({ onBack }: BarcodeGeneratorProps) {
  const [productionUnitId, setProductionUnitId] = useState("")
  const [processType, setProcessType] = useState("")
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const generateBarcode = async () => {
    if (!productionUnitId || !processType) {
      toast({
        title: "Error",
        description: "Harap isi semua field yang diperlukan",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/barcode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionUnitId: Number.parseInt(productionUnitId),
          processType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedBarcode(data.barcode)
        toast({
          title: "Berhasil",
          description: "Barcode berhasil dibuat",
        })
      } else {
        throw new Error("Failed to generate barcode")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat barcode",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const printBarcode = () => {
    if (generatedBarcode) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Barcode</title></head>
            <body style="margin: 0; padding: 20px; text-align: center;">
              <div style="margin-bottom: 10px;">
                <strong>Production Unit: ${productionUnitId}</strong><br>
                <strong>Process: ${processType}</strong>
              </div>
              ${generatedBarcode}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const downloadBarcode = () => {
    if (generatedBarcode) {
      const blob = new Blob([generatedBarcode], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `barcode-${productionUnitId}-${processType}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-balance">Generate Barcode</h1>
        <p className="text-muted-foreground mt-2">Buat barcode untuk proses produksi</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generator Barcode
            </CardTitle>
            <CardDescription>Masukkan informasi untuk membuat barcode baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionUnitId">Production Unit ID</Label>
              <Input
                id="productionUnitId"
                type="number"
                placeholder="Masukkan ID unit produksi"
                value={productionUnitId}
                onChange={(e) => setProductionUnitId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processType">Tipe Proses</Label>
              <Select value={processType} onValueChange={setProcessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe proses" />
                </SelectTrigger>
                <SelectContent>
                  {processTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type.value}</Badge>
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateBarcode} disabled={loading} className="w-full">
              {loading ? "Membuat..." : "Generate Barcode"}
            </Button>
          </CardContent>
        </Card>

        {generatedBarcode && (
          <Card>
            <CardHeader>
              <CardTitle>Barcode Hasil</CardTitle>
              <CardDescription>Barcode siap untuk dicetak atau diunduh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex justify-center p-4 bg-white rounded-lg border"
                dangerouslySetInnerHTML={{ __html: generatedBarcode }}
              />

              <div className="flex gap-2">
                <Button onClick={printBarcode} variant="outline" className="flex-1 bg-transparent">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={downloadBarcode} variant="outline" className="flex-1 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Unit ID:</strong> {productionUnitId}
                </p>
                <p>
                  <strong>Process:</strong> {processType}
                </p>
                <p>
                  <strong>Generated:</strong> {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
