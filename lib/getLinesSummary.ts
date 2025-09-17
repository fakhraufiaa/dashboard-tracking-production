// lib/getLinesSummary.ts
import { prisma } from "@/lib/prisma"

export async function getLinesSummary() {
  const processes = {
    ASSY: ["INV", "SCC", "BATT", "PD", "PB"],
    WIRING: ["WD", "WB"],
    QC: ["QC"],
    PACK: ["PACK"],
  }

  const scans = await prisma.infoScanProduction.findMany({
    include: {
      genProductionUnit: true,
    },
  })

  const result = {
    ASSY: { units: 0, personnel: new Set<number>() },
    WIRING: { units: 0, personnel: new Set<number>() },
    QC: { units: 0, personnel: new Set<number>() },
    PACK: { units: 0, personnel: new Set<number>() },
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
    // ASSY → semua proses harus ada
    if (processes.ASSY.every(p => procScans[p])) {
      result.ASSY.units += 1
      processes.ASSY.forEach(proc => {
        procScans[proc]?.forEach(s => result.ASSY.personnel.add(s.pekerja))
      })
    }

    // WIRING → harus ada WD dan WB
    if (processes.WIRING.every(p => procScans[p])) {
      result.WIRING.units += 1
      processes.WIRING.forEach(proc => {
        procScans[proc]?.forEach(s => result.WIRING.personnel.add(s.pekerja))
      })
    }

    // QC
    if (procScans["QC"]) {
      result.QC.units += 1
      procScans["QC"].forEach(s => result.QC.personnel.add(s.pekerja))
    }

    // PACK
    if (procScans["PACK"]) {
      result.PACK.units += 1
      procScans["PACK"].forEach(s => result.PACK.personnel.add(s.pekerja))
    }
  }

  return {
    ASSY: { units: result.ASSY.units, personnel: result.ASSY.personnel.size },
    WIRING: { units: result.WIRING.units, personnel: result.WIRING.personnel.size },
    QC: { units: result.QC.units, personnel: result.QC.personnel.size },
    PACK: { units: result.PACK.units, personnel: result.PACK.personnel.size },
  }
}
