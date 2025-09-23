"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/use-toast";
import { ArrowLeft, CheckCircleIcon, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProcessLoggingProps {
  onBack: () => void;
  goToPage?: React.Dispatch<React.SetStateAction<string | null>>;
}

interface ProcessUnit {
  id: number;
  uniqCode: string;
  production: { name: string };
  processQc?: {
    id: number;
    uji_input: boolean;
    uji_output: boolean;
    uji_ac: boolean;
    uji_kabel: boolean;
    labelling: boolean;
  };
  genUnits?: {
    id: number;
    process: string;
    status: boolean;
  }[];
  processUnitProductions?: {
    id: number;
    process: string;
    status: boolean;
    qcUser?: { name: string };
    createdAt: string;
  }[];
}

interface ScanLog {
  code: string;
  process: string;
  status: string;
  pekerja: string;
  role: string;
  datetime: string;
}

export function ProcessLogging({ onBack, goToPage }: ProcessLoggingProps) {
  const [units, setUnits] = useState<ProcessUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<ProcessUnit | null>(null);
  const [detailUnit, setDetailUnit] = useState<ProcessUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);

  const checklistFields = [
    "uji_input",
    "uji_output",
    "uji_ac",
    "uji_kabel",
    "labelling",
  ];

  function getGeneralStatus(unit: ProcessUnit): "red" | "yellow" | "green" {
    const allProcesses = [
      "INV",
      "SCC",
      "BATT",
      "PD",
      "PB",
      "WD",
      "WB",
      "QC",
      "PACK",
    ];

    // ❌ jika genUnits kosong atau tidak ada, langsung merah
    if (!unit.genUnits || unit.genUnits.length === 0) return "red";

    const doneProcesses = unit.genUnits
      .filter((g) => g.status)
      .map((g) => g.process);

    // ✅ semua done
    if (allProcesses.every((p) => doneProcesses.includes(p))) return "green";

    // ⚠️ sebagian done
    if (doneProcesses.length > 0) return "yellow";

    // ❌ jika semua status false → merah
    return "red";
  }

  // Fetch ProcessUnit
  const fetchUnits = async () => {
    setLoading(true); // ⬅️ ini penting supaya loading muncul tiap fetch
    try {
      const res = await fetch("/api/qc/process-qc");
      const data = await res.json();
      setUnits(
        data.data.map((u: ProcessUnit) => ({
          ...u,
          genUnits: u.genUnits ?? [],
        }))
      );
    } catch {
      toast({
        title: "Error",
        description: "Gagal memuat data QC",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // ⬅️ berhenti loading apapun hasilnya
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // ✅ Hapus fetchScanLogs lama, ganti useEffect khusus SSE
  useEffect(() => {
    if (!detailUnit) return;

    setLoading(true);
    const es = new EventSource(
      `/api/barcode/scan/log?uniqCode=${detailUnit.uniqCode}`
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.logs && detailUnit) {
          // update scanLogs
          setScanLogs(data.logs);

          // mapping logs ke genUnits dengan status boolean
          const updatedGenUnits = data.logs.map((log: any) => ({
            id: log.id,
            process: log.process,
            status: log.status === "Done",
          }));

          // update units di state
          setUnits((prev) =>
            prev.map((u) =>
              u.id === detailUnit.id
                ? {
                    ...u,
                    genUnits: updatedGenUnits,
                    generalStatus: getGeneralStatus({
                      ...u,
                      genUnits: updatedGenUnits,
                    }),
                  }
                : u
            )
          );
        }

        if (data.summary) {
          console.log("QC Summary:", data.summary);
        }

        setLoading(false);
      } catch (e) {
        console.error("❌ Error parsing SSE:", e);
        setLoading(false);
      }
    };

    es.onerror = (err) => {
      console.error("❌ SSE error:", err);
      es.close();
      setLoading(false);
      toast({
        title: "Error",
        description: "Gagal terhubung ke stream log scan",
        variant: "destructive",
      });
    };

    // ✅ cleanup saat modal ditutup
    return () => {
      es.close();
      setScanLogs([]); // reset biar bersih
    };
  }, [detailUnit]);

  const filteredUnits = units.filter((u) =>
    u.uniqCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompletionCount = (unit: ProcessUnit) => {
    const total = checklistFields.length;
    const done = checklistFields.filter(
      (f) => unit.processQc?.[f as keyof typeof unit.processQc]
    ).length;
    return { done, total };
  };

  const getQcStatus = (unit: ProcessUnit) => {
    if (!unit.processQc) return "Checking";
    const done = checklistFields.every(
      (f) => unit.processQc?.[f as keyof typeof unit.processQc]
    );
    return done ? "Done" : "Checking";
  };

  const handleSaveQc = async (
    unitId: number,
    checklist: Record<string, boolean>
  ) => {
    setLoading(true);
    try {
      await fetch("/api/qc/process-qc", {
        method: "POST",
        body: JSON.stringify({
          productionUnitId: unitId,
          qcUserId: 1, // TODO: ganti qcUserId sesuai user login
          checklist,
        }),
      });

      toast({ title: "Berhasil", description: "QC berhasil disimpan" });
      fetchUnits();
      setSelectedUnit(null);

      // ✅ Cek kalau semua checklist sudah true
      const allChecked = Object.values(checklist).every(Boolean);
      if (allChecked) {
        goToPage?.("scan"); // direct ke halaman barcode
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menyimpan QC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!selectedUnit) return;
    const newVal = !selectAll;
    setSelectedUnit({
      ...selectedUnit,
      processQc: {
        id: selectedUnit.processQc?.id ?? 0,
        uji_input: newVal,
        uji_output: newVal,
        uji_ac: newVal,
        uji_kabel: newVal,
        labelling: newVal,
      },
    });
    setSelectAll(newVal);
  };

  const toggleItem = (field: string) => {
    if (!selectedUnit) return;
    const newQc = {
      id: selectedUnit.processQc?.id ?? 0,
      uji_input: selectedUnit.processQc?.uji_input ?? false,
      uji_output: selectedUnit.processQc?.uji_output ?? false,
      uji_ac: selectedUnit.processQc?.uji_ac ?? false,
      uji_kabel: selectedUnit.processQc?.uji_kabel ?? false,
      labelling: selectedUnit.processQc?.labelling ?? false,
      [field]:
        !selectedUnit.processQc?.[field as keyof typeof selectedUnit.processQc],
    };
    setSelectedUnit({ ...selectedUnit, processQc: newQc });
    setSelectAll(Object.values(newQc).every((v) => v === true));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-balance">Process Log</h1>
        <p className="text-muted-foreground mt-2">
          Ringkasan QC per Production Unit
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Cari berdasarkan kode unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Ringkasan ProcessUnit */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between items-center">
              <p>List ProcessUnit</p>
              <span className="opacity-50">status</span>
            </div>
          </CardTitle>

          <div className="flex justify-end items-center gap-6 mb-4">
            {/* Merah - Kosong */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-700">Empty</span>
            </div>

            {/* Kuning - Proses */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm text-gray-700">On Proses</span>
            </div>

            {/* Hijau - Selesai */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-700">Done</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-w-5xl overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Code (Unit)</TableHead>
                    <TableHead>Process QC</TableHead>
                    <TableHead>Status QC</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit, idx) => {
                    const { done, total } = getCompletionCount(unit);
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{unit.uniqCode}</TableCell>
                        <TableCell>
                          {done}/{total}
                          <CheckCircleIcon
                            className={`inline-block ml-1 h-4 w-4 ${
                              done === total
                                ? "text-green-500"
                                : "text-secondary"
                            }`}
                          />
                        </TableCell>
                        <TableCell>{getQcStatus(unit)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedUnit(unit)}
                            >
                              <Eye className="w-4 h-4 mr-1" /> Edit QC
                            </Button>
                            <Button
                              size="sm"
                              className={
                                getGeneralStatus(unit) === "green"
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : getGeneralStatus(unit) === "yellow"
                                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                  : "bg-red-500 text-white border hover:bg-red-600"
                              }
                              onClick={() => {
                                setDetailUnit(unit);
                              }}
                            >
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Edit QC */}
      {selectedUnit && (
        <Dialog open={true} onOpenChange={() => setSelectedUnit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit QC - {selectedUnit.uniqCode}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                {selectAll ? "Unselect All" : "Select All"}
              </Button>

              {checklistFields.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(
                      selectedUnit.processQc?.[
                        field as keyof typeof selectedUnit.processQc
                      ]
                    )}
                    onCheckedChange={() => toggleItem(field)}
                  />
                  <span className="capitalize">{field.replace("_", " ")}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSelectedUnit(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleSaveQc(
                    selectedUnit.id,
                    checklistFields.reduce(
                      (acc, field) => ({
                        ...acc,
                        [field]: Boolean(
                          selectedUnit.processQc?.[
                            field as keyof typeof selectedUnit.processQc
                          ]
                        ),
                      }),
                      {} as Record<string, boolean>
                    )
                  )
                }
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Detail Log Scan */}
      {detailUnit && (
        <Dialog open={true} onOpenChange={() => setDetailUnit(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detail Log Scan - {detailUnit.uniqCode}</DialogTitle>
            </DialogHeader>

            {/* Scroll wrapper */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Process</TableHead>
                        <TableHead>PIC</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Datetime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanLogs.length > 0 ? (
                        scanLogs.map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{log.process}</TableCell>
                            <TableCell>{log.pekerja}</TableCell>
                            <TableCell>{log.role}</TableCell>
                            <TableCell>
                              {new Date(log.datetime).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow key={0}>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground"
                          >
                            Belum ada log scan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setDetailUnit(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
