"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/lib/use-toast"
import { ArrowLeft, Users, Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserManagementProps {
  onBack: () => void
}

interface User {
  id: number
  uniqCode: number
  name: string
  role: "ADMIN" | "OPT" | "QC" | "SCM"
  createdAt: string
}

const roles = [
  { value: "ADMIN", label: "Administrator" },
  { value: "OPT", label: "Operator" },
  { value: "QC", label: "Quality Control" },
  { value: "SCM", label: "Supply Chain Management" },
]

export function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    uniqCode: "",
    name: "",
    role: "",
    password: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqCode: Number.parseInt(formData.uniqCode),
          name: formData.name,
          role: formData.role,
          ...(formData.password && { password: formData.password }),
        }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: editingUser ? "Pengguna berhasil diupdate" : "Pengguna berhasil ditambahkan",
        })
        fetchUsers()
        resetForm()
        setDialogOpen(false)
      } else {
        throw new Error("Failed to save user")
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menyimpan data pengguna",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengguna berhasil dihapus",
        })
        fetchUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ uniqCode: "", name: "", role: "", password: "" })
    setEditingUser(null)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      uniqCode: user.uniqCode.toString(),
      name: user.name,
      role: user.role,
      password: "",
    })
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "QC":
        return "secondary"
      case "OPT":
        return "outline"
      case "SCM":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-balance">User Management</h1>
            <p className="text-muted-foreground mt-2">Kelola pengguna sistem produksi</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update informasi pengguna yang sudah ada" : "Masukkan informasi untuk pengguna baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uniqCode">Kode Unik</Label>
                  <Input
                    id="uniqCode"
                    type="number"
                    placeholder="Masukkan kode unik"
                    value={formData.uniqCode}
                    onChange={(e) => setFormData({ ...formData, uniqCode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password {editingUser && "(kosongkan jika tidak ingin mengubah)"}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Menyimpan..." : editingUser ? "Update" : "Tambah"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Pengguna
          </CardTitle>
          <CardDescription>Kelola akses pengguna sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Kode: {user.uniqCode}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
