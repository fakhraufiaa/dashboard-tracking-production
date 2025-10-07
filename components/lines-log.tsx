"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Eye, Trash2, ArrowLeft, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"


type ProcessType = "ASSY" | "WIRING" | "QC" | "FINISH"

interface LinesLoggingProps {
  onBack: () => void;
  goToPage?: React.Dispatch<React.SetStateAction<string | null>>; 
  processType: ProcessType;
}

interface UnitLog {
  productionUnitId: number
  uniqCode: string
  PIC: string
  createdAt: string
}

type ApiResponse = {
  ASSY: UnitLog[]
  WIRING: UnitLog[]
  QC: UnitLog[]
  FINISH: UnitLog[]
}

export function PageListLinesLog({ onBack, processType}: LinesLoggingProps) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<UnitLog[]>([])

  useEffect(() => {
    async function fetchUnits() {
      setLoading(true)
      const res = await fetch("/api/lines/log")
      const data: ApiResponse = await res.json()  
      setUnits(data[processType] || [])
      setLoading(false)
    }
    fetchUnits()
  }, [processType])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">LOG {processType}</h1>
            <p className="text-muted-foreground">
              Lihat log process
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Daftar Unit {processType}
            </CardTitle>
            <CardDescription>
              Total: {units.length} unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Unit ID</TableHead>
                  <TableHead>Tanggal Terbaru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Tidak ada unit
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((u, index) => (
                    <TableRow key={u.productionUnitId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{u.uniqCode}</TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleString("id-ID")}
                      </TableCell>
                      
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
