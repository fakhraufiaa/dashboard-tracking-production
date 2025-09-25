// Enums
// lib/type.ts
export interface LineGroup {
  units: number
  personnel: number
}

export interface LinesData {
  ASSY: LineGroup
  WIRING: LineGroup
  QC: LineGroup
  PACK: LineGroup
}

type LineItem = {
  timestamp: string // ISO string atau epoch
  value: number
}



export enum Role {
  ADMIN = "ADMIN",
  OPT = "OPT",
  QC = "QC",
  SCM = "SCM",
}

export enum ProcessType {
  INV = "INV",
  SCC = "SCC",
  BATT = "BATT",
  PD = "PD",
  PB = "PB",
  WD = "WD",
  WB = "WB",
  QC = "QC",
  PACK = "PACK",
}

// User
export interface User {
  id: number
  uniqCode: number
  name: string
  role: Role
  password: string
  infoScans?: InfoScanProduction[]
  processQcLogs?: ProcessQcLog[]
  createdAt: Date
  updatedAt: Date
}

// Production
export interface Production {
  id: number
  name: string
  jumlah: number
  units?: ProductionUnit[]
  createdAt: Date
  updatedAt: Date
}

// ProductionUnit
export interface ProductionUnit {
  id: number
  productionId: number
  uniqCode: string
  production?: Production
  genUnits?: GenProductionUnit[]
  processQc?: ProcessQc
  createdAt: Date
  updatedAt: Date
}

// GenProductionUnit
export interface GenProductionUnit {
  id: number
  productionUnitId: number
  uniqCode: string
  process: ProcessType
  jsBarcode: string
  status: boolean
  productionUnit?: ProductionUnit
  infoScans?: InfoScanProduction[]
  createdAt: Date
  updatedAt: Date
}

// InfoScanProduction
export interface InfoScanProduction {
  id: number
  genProductionUnitId: number
  pekerja: number
  genProductionUnit?: GenProductionUnit
  user?: User
  createdAt: Date
}

// ProcessQc
export interface ProcessQc {
  id: number
  productionUnitId: number
  uji_input: boolean
  uji_output: boolean
  uji_ac: boolean
  uji_kabel: boolean
  labelling: boolean
  productionUnit?: ProductionUnit
  logs?: ProcessQcLog[]
  createdAt: Date
  updatedAt: Date
}

// ProcessQcLog
export interface ProcessQcLog {
  id: number
  processQcId: number
  qcUserId: number
  action: string // "uji_input", "labelling", "uji_ac", etc
  status: boolean
  processQc?: ProcessQc
  qcUser?: User
  createdAt: Date
}
