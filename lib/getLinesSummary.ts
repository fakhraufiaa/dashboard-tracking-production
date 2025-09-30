import { prisma } from "@/lib/prisma"
import { getTodayRangeUTC } from "./time"

type ScanResult = {
  productionUnitId: number
  uniqCode: string
  PIC: string
  createdAt: Date
}

const processes = {
  ASSY: ["INV", "SCC", "BATT", "PD", "PB"],
  WIRING: ["WD", "WB"],
  QC: ["QC"],
  FINISH: ["FINISH"],
}

// --- Summary per line ---
export async function getLinesSummary() {
  const { start, end } = getTodayRangeUTC()

  const scans = await prisma.infoScanProduction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { genProductionUnit: true },
  })

  const result = {
    ASSY: { units: 0, personnel: new Set<number>() },
    WIRING: { units: 0, personnel: new Set<number>() },
    QC: { units: 0, personnel: new Set<number>() },
    FINISH: { units: 0, personnel: new Set<number>() },
  }

  const groupedByPU = new Map<number, Record<string, typeof scans>>()

  for (const scan of scans) {
    const puId = scan.genProductionUnit.productionUnitId
    const proc = scan.genProductionUnit.process

    if (!groupedByPU.has(puId)) groupedByPU.set(puId, {})
    const map = groupedByPU.get(puId)!
    if (!map[proc]) map[proc] = []
    map[proc].push(scan)
  }

  for (const procScans of groupedByPU.values()) {
    if (processes.ASSY.every(p => procScans[p])) {
      result.ASSY.units++
      processes.ASSY.forEach(proc =>
        procScans[proc]?.forEach(s => result.ASSY.personnel.add(s.pekerja))
      )
    }
    if (processes.WIRING.every(p => procScans[p])) {
      result.WIRING.units++
      processes.WIRING.forEach(proc =>
        procScans[proc]?.forEach(s => result.WIRING.personnel.add(s.pekerja))
      )
    }
    if (procScans["QC"]) {
      result.QC.units++
      procScans["QC"].forEach(s => result.QC.personnel.add(s.pekerja))
    }
    if (procScans["FINISH"]) {
      result.FINISH.units++
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

// --- List unit terbaru per process ---
export async function getListUnitsToday() {
  const { start, end } = getTodayRangeUTC()

  const scans = await prisma.infoScanProduction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      genProductionUnit: { include: { productionUnit: true } },
      user: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const result: Record<string, ScanResult[]> = {
    ASSY: [],
    WIRING: [],
    QC: [],
    FINISH: [],
  }

  for (const [type, procList] of Object.entries(processes)) {
    const filtered = scans.filter(s => procList.includes(s.genProductionUnit.process))

    const grouped = new Map<number, typeof filtered>()
    for (const scan of filtered) {
      const puId = scan.genProductionUnit.productionUnitId
      if (!grouped.has(puId)) grouped.set(puId, [])
      grouped.get(puId)!.push(scan)
    }

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
