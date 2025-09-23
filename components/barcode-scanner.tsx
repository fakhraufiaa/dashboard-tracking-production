"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, Camera, CameraOff, Loader2, Scan } from "lucide-react"
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library"


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
  const [isLoading, setIsLoading] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isBackCamera, setIsBackCamera] = useState(true) 
  const [pendingBarcode, setPendingBarcode] = useState<ScanResult | null>(null)
  // const lastScanRef = useRef<string | null>(null)
  const scanCooldownRef = useRef<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setCameraError(null)
      setIsScanning(true)

      // ✅ Fokus hanya ke CODE_128 biar cepat
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128])

      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader(hints)
      }

      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices()
      setDevices(videoInputDevices)

      if (videoInputDevices.length === 0) throw new Error("Tidak ada kamera tersedia")

      const deviceId = isBackCamera
        ? videoInputDevices[videoInputDevices.length - 1].deviceId
        : videoInputDevices[0].deviceId

      // ✅ Set constraints untuk resolusi kamera
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },   // bisa coba 1920
          height: { ideal: 720 },   // bisa coba 1080
          facingMode: "environment", // biar pakai kamera belakang
        },
      }

      codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current!,
        (result, error) => {
          if (result) {
            console.log("📷 RAW hasil scan:", result.getText())
            handleScanSuccess(result.getText())
          }
          if (error && !(error.name === "NotFoundException")) {
            console.error("Scan error:", error)
          }
        }
      )
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError(error instanceof Error ? error.message : "Gagal mengakses kamera")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
    setIsLoading(false);
  }


  const handleScanSuccess = async (barcodeText: string) => {
    const cleanBarcode = barcodeText.trim()
    if (scanCooldownRef.current) return
    scanCooldownRef.current = true
    setTimeout(() => { scanCooldownRef.current = false }, 2000)

    console.log("📷 Scan:", cleanBarcode)

    try {
      // 🔎 preview dulu data barcode (tanpa insert ke DB)
      const response = await fetch("/api/barcode/scan/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcodeText: cleanBarcode }),
      })
      const data = await response.json()
      if (response.ok) {
        // simpan ke pending untuk konfirmasi
        setPendingBarcode(data)
        stopScanning()
      } else {
        toast({
          title: "Error",
          description: data.error || "Barcode tidak valid",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal memproses barcode",
        variant: "destructive",
      })
    }
  }

  const confirmScan = async () => {
    if (!pendingBarcode) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/barcode/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ barcodeText: pendingBarcode.uniqCode }),
      })

      const data = await response.json()
      if (response.ok) {
        setScanResult(data)
        toast({ title: "Berhasil", description: "Barcode berhasil dipindai" })
        stopScanning()
      } else {
        toast({
          title: "Error",
          description: data.error || "Gagal menyimpan scan",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan scan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setPendingBarcode(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-balance">Scan Barcode</h1>
        <p className="text-muted-foreground mt-2">
          Pindai barcode produksi untuk tracking
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner Barcode
            </CardTitle>
            <CardDescription>
              Gunakan kamera untuk memindai barcode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <div className="relative w-full h-full">
                  {/* Video diperlebar (horizontal frame) */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-3xl mx-auto"
                    style={{ aspectRatio: "16/5", objectFit: "cover" }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                      <span className="ml-2 text-white">Memproses...</span>
                    </div>
                  )}
                  {/* Kotak merah horizontal */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-20 border-4 border-red-500 rounded"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-video">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Kamera tidak aktif
                    </p>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{cameraError}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={devices.length < 2}
              onClick={async () => {
                if (!codeReaderRef.current || devices.length < 2) return

                // hentikan stream kamera lama
                codeReaderRef.current.reset()

                const newState = !isBackCamera
                setIsBackCamera(newState)

                const deviceId = newState
                  ? devices[devices.length - 1].deviceId // kamera belakang
                  : devices[0].deviceId // kamera depan

                codeReaderRef.current.decodeFromVideoDevice(
                  deviceId,
                  videoRef.current!,
                  (result, error) => {
                    if (result) {
                      console.log("📷 RAW hasil scan:", result.getText())
                      handleScanSuccess(result.getText())
                    }
                    if (error && !(error.name === "NotFoundException")) {
                      console.error("Scan error:", error)
                    }
                  }
                )
              }}
            >
              Ganti ke Kamera {isBackCamera ? "Depan" : "Belakang"}
            </Button>




            <div className="flex justify-center gap-2">
              {isScanning ? (
                <Button onClick={stopScanning} variant="outline">
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button onClick={startScanning}>
                  <Camera className="mr-2 h-4 w-4" />
                  Mulai Scan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Konfirmasi Scan */}
        <AlertDialog
          open={!!pendingBarcode}
          onOpenChange={() => setPendingBarcode(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Scan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin scan proses{" "}
                <span className="font-bold text-blue-600">
                  {pendingBarcode?.process}
                </span>
                ?
                <br />
                <span className="text-sm text-muted-foreground">
                  Kode: {pendingBarcode?.uniqCode}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmScan} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Lanjutkan"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       

        {/* Result */}
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
                    {scanResult.status ? "Selesai" : "Belum"}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={() => setScanResult(null)}
                variant="outline"
                className="w-full"
              >
                Scan Lagi
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
