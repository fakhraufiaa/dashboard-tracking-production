"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, Camera, CameraOff, Scan } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BarcodeScannerProps {
  onBack: () => void
}

interface ScanResult {
  uniqCode: string
  process: string
  productionUnit: string
  status: boolean
}

export function BarcodeScanner({ onBack }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch {
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    // Convert canvas to blob and send to API for processing
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        setLoading(true)
        try {
          const formData = new FormData()
          formData.append("image", blob)

          const response = await fetch("/api/barcode/scan", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            setScanResult(data)
            stopCamera()
            toast({
              title: "Berhasil",
              description: "Barcode berhasil dipindai",
            })
          } else {
            throw new Error("Failed to scan barcode")
          }
        } catch {
          toast({
            title: "Error",
            description: "Gagal memindai barcode",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const recordScan = async () => {
    if (!scanResult) return

    try {
      const response = await fetch("/api/barcode/record-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genProductionUnitId: scanResult.uniqCode,
        }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Scan berhasil dicatat",
        })
        setScanResult(null)
      } else {
        throw new Error("Failed to record scan")
      }
    } catch{
      toast({
        title: "Error",
        description: "Gagal mencatat scan",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-balance">Scan Barcode</h1>
        <p className="text-muted-foreground mt-2">Pindai barcode produksi untuk tracking</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner Barcode
            </CardTitle>
            <CardDescription>Gunakan kamera untuk memindai barcode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Kamera tidak aktif</p>
                  </div>
                </div>
              )}

              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Mulai Scan
                </Button>
              ) : (
                <>
                  <Button onClick={captureAndScan} disabled={loading} className="flex-1">
                    {loading ? "Memproses..." : "Capture & Scan"}
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {scanResult && (
          <Card>
            <CardHeader>
              <CardTitle>Hasil Scan</CardTitle>
              <CardDescription>Informasi barcode yang dipindai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Kode Unik:</span>
                  <Badge variant="outline">{scanResult.uniqCode}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Proses:</span>
                  <Badge>{scanResult.process}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Unit Produksi:</span>
                  <span className="text-sm">{scanResult.productionUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={scanResult.status ? "default" : "secondary"}>
                    {scanResult.status ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              </div>

              <Button onClick={recordScan} className="w-full">
                Catat Scan
              </Button>

              <Button onClick={() => setScanResult(null)} variant="outline" className="w-full">
                Scan Lagi
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
