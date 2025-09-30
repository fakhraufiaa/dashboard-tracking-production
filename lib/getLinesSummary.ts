import { prisma } from "@/lib/prisma"

type ScanResult = {
  productionUnitId: number;
  uniqCode: string;
  PIC: string;
  createdAt: Date;
};

export async function getLinesSummary() {
  const processes = {
    ASSY: ["INV", "SCC", "BATT", "PD", "PB"],
    WIRING: ["WD", "WB"],
    QC: ["QC"],
    FINISH: ["FINISH"],
  }

  // Hitung batas waktu reset: jam 06 hari ini
  const now = new Date()
  const today6am = new Date(now)
  today6am.setHours(6, 0, 0, 0)
  if (now.getHours() < 6) {
    today6am.setDate(today6am.getDate() - 1)
  }

  // Ambil semua scan sejak jam 06:00 hari ini
  const scans = await prisma.infoScanProduction.findMany({
    where: { createdAt: { gte: today6am } },
    include: { genProductionUnit: true },
  })

  const result = {
    ASSY: { units: 0, personnel: new Set<number>() },
    WIRING: { units: 0, personnel: new Set<number>() },
    QC: { units: 0, personnel: new Set<number>() },
    FINISH: { units: 0, personnel: new Set<number>() },
  }

  // Group per ProductionUnit
  const groupedByPU: Record<number, Record<string, typeof scans>> = {}
  for (const scan of scans) {
    const puId = scan.genProductionUnit.productionUnitId
    const proc = scan.genProductionUnit.process
    if (!groupedByPU[puId]) groupedByPU[puId] = {}
    if (!groupedByPU[puId][proc]) groupedByPU[puId][proc] = []
    groupedByPU[puId][proc].push(scan)
  }

  for (const procScans of Object.values(groupedByPU)) {
    if (processes.ASSY.every(p => procScans[p])) {
      result.ASSY.units += 1
      processes.ASSY.forEach(proc => procScans[proc]?.forEach(s => result.ASSY.personnel.add(s.pekerja)))
    }
    if (processes.WIRING.every(p => procScans[p])) {
      result.WIRING.units += 1
      processes.WIRING.forEach(proc => procScans[proc]?.forEach(s => result.WIRING.personnel.add(s.pekerja)))
    }
    if (procScans["QC"]) {
      result.QC.units += 1
      procScans["QC"].forEach(s => result.QC.personnel.add(s.pekerja))
    }
    if (procScans["FINISH"]) {
      result.FINISH.units += 1
      procScans["FINISH"].forEach(s => result.FINISH.personnel.add(s.pekerja))
    }
  }

  return {
    ASSY: { units: result.ASSY.units, personnel: result.ASSY.personnel.size },
    WIRING: { units: result.WIRING.units, personnel: result.WIRING.personnel.size },
    QC: { units: result.QC.units, personnel: result.QC.personnel.size },
    FINISH: { units: result.FINISH.units, personnel: result.FINISH.personnel.size },
  }
}

export async function getListUnitsToday() {
  // Hitung batas reset: jam 06 hari ini
  const now = new Date()
  const today6am = new Date(now)
  today6am.setHours(6, 0, 0, 0)
  if (now.getHours() < 6) {
    today6am.setDate(today6am.getDate() - 1)
  }

  // Ambil scan sejak jam 06
  const scans = await prisma.infoScanProduction.findMany({
    where: { createdAt: { gte: today6am } },
    include: {
      genProductionUnit: {
        include: {
          productionUnit: true,
        },
      },
      user: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Definisi kelompok proses
  const processes = {
    ASSY: ["INV", "SCC", "BATT", "PD", "PB"],
    WIRING: ["WD", "WB"],
    QC: ["QC"],
    FINISH: ["FINISH"],
  }

  // Hasil akhir
  const result: Record<string, ScanResult[]> = {
    ASSY: [],
    WIRING: [],
    QC: [],
    FINISH: [],
  }

  // Loop per processType
  for (const [type, procList] of Object.entries(processes)) {
    // Cari scan yg process-nya ada di list procList
    const filtered = scans.filter((s) =>
      procList.includes(s.genProductionUnit.process)
    )

    // Group per productionUnitId
    const grouped = new Map<number, typeof filtered>()

    for (const scan of filtered) {
      const puId = scan.genProductionUnit.productionUnitId
      if (!grouped.has(puId)) grouped.set(puId, [])
      grouped.get(puId)!.push(scan)
    }

    // Ambil scan terbaru per unit
    for (const [puId, scanList] of grouped.entries()) {
      const latest = scanList.reduce((a, b) =>
        a.createdAt > b.createdAt ? a : b
      )
      result[type].push({
        productionUnitId: puId,
        uniqCode: latest.genProductionUnit.productionUnit.uniqCode,
        PIC: latest.user?.name || "-",
        createdAt: latest.createdAt,
      })
    }
  }

  return result
}

