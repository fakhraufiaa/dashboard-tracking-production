"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, Plus, Search, Eye, Trash2, Loader2 } from "lucide-react"
import type { Production, ProductionUnit } from "@/lib/type"
import { Checkbox } from "@/components/ui/checkbox"

interface ProductionWithUnits extends Production {
  units: ProductionUnit[]
}

interface ProductionManagementProps {
  onBack: () => void
}

export function ProductionManagement({ onBack }: ProductionManagementProps) {
  const [productions, setProductions] = useState<ProductionWithUnits[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduction, setSelectedProduction] = useState<ProductionWithUnits | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedUnits, setSelectedUnits] = useState<number[]>([])

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    jumlah: "",
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchProductions()
  }, [])

  const fetchProductions = async () => {
    try {
      const response = await fetch("/api/productions")
      if (response.ok) {
        const data = await response.json()
        setProductions(data)
      }
    } catch (error) {
      console.error("Error fetching productions:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data produksi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const response = await fetch("/api/productions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          jumlah: Number.parseInt(formData.jumlah),
        }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Produksi berhasil dibuat",
        })
        setShowCreateModal(false)
        setFormData({ name: "", jumlah: "" })
        fetchProductions()
      } else {
        throw new Error("Failed to create production")
      }
    } catch (error) {
      console.error("Error creating production:", error)
      toast({
        title: "Error",
        description: "Gagal membuat produksi",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProduction = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produksi ini?")) return

    try {
      const response = await fetch(`/api/productions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Produksi berhasil dihapus",
        })
        fetchProductions()
      } else {
        throw new Error("Failed to delete production")
      }
    } catch (error) {
      console.error("Error deleting production:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus produksi",
        variant: "destructive",
      })
    }
  }

  const filteredProductions = productions.filter(
    (production) =>
      production.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      production.units.some((unit) => unit.uniqCode.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Handler untuk toggle satu unit
const toggleUnitSelection = (unitId: number) => {
  setSelectedUnits((prev) =>
    prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
  )
}

// Handler untuk toggle semua unit
const toggleSelectAll = () => {
  if (!selectedProduction) return
  if (selectedUnits.length === selectedProduction.units.length) {
    setSelectedUnits([])
  } else {
    setSelectedUnits(selectedProduction.units.map((u) => u.id))
  }
}

// Handler generate
const handleGenerate = async () => {
  if (selectedUnits.length === 0) {
    toast({
      title: "Pilih unit terlebih dahulu",
      description: "Tidak ada unit yang dipilih",
      variant: "destructive",
    })
    return
  }

  toast({
    title: "Generate",
    description: `Menghasilkan barcode untuk ${selectedUnits.length} unit`,
  })

  // Contoh panggil API
  await fetch("/api/barcode/generate/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unitIds: selectedUnits }),
  })
}

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Produksi</h1>
            <p className="text-muted-foreground">Kelola produksi dan unit produksi</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama atau kode unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Produksi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Produksi Baru</DialogTitle>
                <DialogDescription>Masukkan nama penugasan dan jumlah unit yang akan diproduksi</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Penugasan</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama penugasan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah Unit</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="1"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    placeholder="Masukkan jumlah unit"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      "Buat Produksi"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produksi</CardTitle>
            <CardDescription>Total: {filteredProductions.length} produksi</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Penugasan</TableHead>
                  <TableHead>Jumlah Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Tidak ada produksi yang ditemukan" : "Belum ada produksi"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProductions.map((production, index) => (
                    <TableRow key={production.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{production.name}</TableCell>
                      <TableCell>{production.jumlah}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{production.units.length} unit dibuat</Badge>
                      </TableCell>
                      <TableCell>{new Date(production.createdAt).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduction(production)
                              setShowDetailModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProduction(production.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Production Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail Produksi: {selectedProduction?.name}</DialogTitle>
            <DialogDescription>Daftar unit produksi yang telah dibuat</DialogDescription>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Unit</p>
                  <p className="text-2xl font-bold">{selectedProduction.jumlah}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Dibuat</p>
                  <p className="text-2xl font-bold">{selectedProduction.units.length}</p>
                </div>
              </div>

              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={
                        selectedProduction?.units.length > 0 &&
                        selectedUnits.length === selectedProduction.units.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>No</TableHead>
                  <TableHead>Kode Unit</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProduction.units.map((unit, index) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUnits.includes(unit.id)}
                        onCheckedChange={() => toggleUnitSelection(unit.id)}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono">{unit.uniqCode}</TableCell>
                    <TableCell>{new Date(unit.createdAt).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleGenerate}>Generate</Button>
            </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
