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
  BarcodeFormat,
  DecodeHintType,
  Result
} from "@zxing/library"
import { BrowserMultiFormatReader } from "@zxing/browser"

interface BarcodeScannerProps {
  onBack: ()  => void
}

interface ScanResult {
  uniqCode: string
  process: string
  productionUnit: string
  status: boolean
}

const DESIRED_CROP_WIDTH = 480;
const DESIRED_CROP_HEIGHT = 160;
const CROP_AREA_FACTOR = 0.5;
const SCAN_INTERVAL_MS = 100;

export function BarcodeScanner({ onBack }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isBackCamera, setIsBackCamera] = useState(true) 
  const [pendingBarcode, setPendingBarcode] = useState<ScanResult | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const cropOverlayRef = useRef<HTMLDivElement>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const scanCooldownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!codeReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
    return () => {
      stopScanning()
    }
  }, [])

  const captureFrameAndCrop = () => {
    const video = videoRef.current;
      const overlayDiv = cropOverlayRef.current;
      const displayCanvas = hiddenCanvasRef.current; // Gunakan canvas tersembunyi

      if (!video || !displayCanvas || !overlayDiv || !codeReaderRef.current || video.videoWidth === 0) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoRatio = videoWidth / videoHeight;
      
      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) return;
      
      // 1. Gambar frame video penuh ke canvas sementara
      tempCanvas.width = videoWidth;
      tempCanvas.height = videoHeight;
      tempContext.drawImage(video, 0, 0, videoWidth, videoHeight);

      // --- Perhitungan Crop (Meniru Kotak Merah Anda) ---
      // Asumsi rasio kotak merah Anda kira-kira 16:5
      const DESIRED_RATIO = 16 / 5; 
      
      let cropWidth: number, cropHeight: number;

      // Ambil ukuran crop yang proporsional
      if (videoRatio / DESIRED_RATIO > 1) {
          // Video lebih lebar, batasi oleh tinggi video
          cropHeight = videoHeight * CROP_AREA_FACTOR;
          cropWidth = cropHeight * DESIRED_RATIO;
      } else {
          // Video lebih tinggi, batasi oleh lebar video
          cropWidth = videoWidth * CROP_AREA_FACTOR;
          cropHeight = cropWidth / DESIRED_RATIO;
      }

      // Pastikan crop tidak melebihi dimensi video
      cropWidth = Math.min(cropWidth, videoWidth);
      cropHeight = Math.min(cropHeight, videoHeight);

      // Pastikan dimensi crop minimal untuk zxing
      // Angka ini bisa disesuaikan, tapi pastikan cukup besar
      const MIN_CROP_DIMENSION = 100; 
      cropWidth = Math.max(MIN_CROP_DIMENSION, cropWidth);
      cropHeight = Math.max(MIN_CROP_DIMENSION, cropHeight);
      
      // Hitung posisi crop agar berada di tengah
      const cropX = (videoWidth - cropWidth) / 2;
      const cropY = (videoHeight - cropHeight) / 2;

      // 2. Potong area ke canvas yang akan discan (hiddenCanvasRef)
      displayCanvas.width = cropWidth;
      displayCanvas.height = cropHeight;
      const displayContext = displayCanvas.getContext("2d");
      if (!displayContext) return;

      displayContext.drawImage(
          tempCanvas,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
      );
      
      // 3. (Opsional, tapi penting) Update posisi overlay merah agar sesuai dengan perhitungan crop
      // Karena video div Anda memiliki objectFit: 'cover' dan aspect-ratio,
      // kita perlu memastikan kotak merah (visual) sesuai dengan area crop (perhitungan)
      // NOTE: Style CSS di JSX Anda menggunakan rasio 16/5 dan nilai absolut 'w-4/5 h-20'
      // Perhitungan di atas mencoba mendekati nilai itu secara proporsional dari video.
      // Untuk memastikan visual dan logika sama, Anda harus konsisten.
      
      // Asumsi lebar div video 100% dan tinggi diatur oleh aspect-ratio: "16/5"
      // Kita perlu proporsi cropX/cropWidth relatif terhadap ukuran video
      
      // Kita biarkan saja CSS Anda (top-1/2... w-4/5 h-20) untuk tampilan visual
      // dan hanya gunakan perhitungan di atas untuk zxing.
      // Jika Anda ingin *overlay* yang akurat, Anda harus menggunakan perhitungan
      // proporsional seperti yang dilakukan di contoh awal Anda, bukan CSS hard-coded.
      
      // --- Pemindaian ---
      const decodeCanvas = async () => {
          try {
              const result: Result = await codeReaderRef.current!.decodeFromCanvas(displayCanvas);
              console.log("Decoded barcode (CROPPED):", result.getText());
              // Hentikan interval scan setelah berhasil
              if (intervalIdRef.current) clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
              handleScanSuccess(result.getText());
          } catch (err: unknown) {
              if (err instanceof Error && err.name !== "NotFoundException") {
                  console.error("Decoding error:", err);
              }
          }
      };

      decodeCanvas();
  }

  const startScanning = async () => {
    try {
      setCameraError(null)
      setIsScanning(true)

      // Pastikan codeReader sudah diinisialisasi
      if (!codeReaderRef.current) {
         // ini tidak perlu karena sudah di useEffect, tapi sebagai fallback
         const hints = new Map();
         hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
         codeReaderRef.current = new BrowserMultiFormatReader(hints);
      }
      const reader = codeReaderRef.current;
      if (!reader) return; // Seharusnya sudah diinisialisasi

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      setDevices(videoInputDevices)

      if (videoInputDevices.length === 0) throw new Error("Tidak ada kamera tersedia")

      const deviceId = isBackCamera
        ? videoInputDevices[videoInputDevices.length - 1].deviceId
        : videoInputDevices[0].deviceId

      // ✅ Set constraints untuk resolusi kamera
      const constraints : MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },   // bisa coba 1920
          height: { ideal: 720 },   // bisa coba 1080
          facingMode: "environment", // biar pakai kamera belakang
        },
      }

      //ini kalau mau di uncomment juga gapapa
      // codeReaderRef.current.decodeFromConstraints(
      //   constraints,
      //   videoRef.current!,
      //   (result, error) => {
      //     if (result) {
      //       console.log("📷 RAW hasil scan:", result.getText())
      //       handleScanSuccess(result.getText())
      //     }
      //     if (error && !(error.name === "NotFoundException")) {
      //       console.error("Scan error:", error)
      //     }
      //   }
      // )

      // Mulai stream kamera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              
              /// Tambahkan sedikit delay, misalnya 500ms, untuk memastikan frame sudah tersedia
        setTimeout(() => {
             if (intervalIdRef.current) clearInterval(intervalIdRef.current);
             intervalIdRef.current = setInterval(captureFrameAndCrop, SCAN_INTERVAL_MS);
        }, 500);
          };
      }
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError(error instanceof Error ? error.message : "Gagal mengakses kamera")
      setIsScanning(false)
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    }
  }



  const stopScanning = () => {

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if ( videoRef.current?.srcObject ) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (codeReaderRef.current) {
      // codeReaderRef.current.reset();
      // codeReaderRef.current = null;
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
    stopScanning();

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
        startScanning();
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal memproses barcode",
        variant: "destructive",
      })
      startScanning();
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
          {/* Canvas tersembunyi untuk cropping */}
          <canvas 
            ref={hiddenCanvasRef} 
            // style={{ border: '2px solid blue', marginTop: '1rem', width: 300, height: 'auto'}} 
            style={{display: 'none'}}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner Barcode 
            </CardTitle>
            <CardDescription>
              Hanya memindai area di dalam kotak merah
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
                    muted
                    className="w-full max-w-3xl mx-auto"
                    style={{ aspectRatio: "16/5", objectFit: "cover"}}
                  />     

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                      <span className="ml-2 text-white">Memproses...</span>
                    </div>
                  )}
                  {/* Kotak merah horizontal - Ini sekarang hanya VISUAL */}
                  <div 
                      ref={cropOverlayRef}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/7 h-20 border-4 border-red-500 rounded"
                  ></div>
                  {/* Overlays untuk menutupi area di luar fokus */}
                  {/* NOTE: Overlays ini mungkin tidak akurat karena video object-fit: cover */}
                  {/* Untuk menyederhanakan, kita biarkan saja visual ini: */}
                  <div className="absolute top-0 left-0 w-full h-[calc(50%-70px)] bg-black/50 z-10"></div> {/* Overlay atas */}
                  <div className="absolute bottom-0 left-0 w-full h-[calc(50%-70px)] bg-black/50 z-10"></div> {/*Overlay bawah */}
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
            
            {/* Tombol Ganti Kamera kita nonaktifkan/hapus karena logika ganti device
                akan lebih kompleks dengan metode decodeFromCanvas (perlu restart stream) 
                Untuk kode yang bersih, kita fokus pada Start/Stop saja
            */}
            
            <div className="flex justify-center gap-2">
              {isScanning ? (
                <Button onClick={stopScanning} variant="outline">
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop Scan
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
          onOpenChange={() => {
            setPendingBarcode(null);
            // Mulai scan lagi setelah konfirmasi/batal
            if (!scanResult) { // Jangan mulai jika sudah ada hasil scan
                startScanning();
            }
          }}
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
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Lanjutkan"}
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
                onClick={() => {
                  setScanResult(null);
                  startScanning(); // Mulai scan lagi setelah melihat hasil
                }}
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
