import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import JsBarcode from "jsbarcode"
import { JSDOM } from "jsdom"

const PROCESSES = ["INV", "SCC", "BATT", "PD", "PB", "WD", "WB", "QC", "PACK"]

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { unitIds } = await request.json()

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({ error: "Unit IDs harus diisi" }, { status: 400 })
    }

    // Get production units
    const units = await prisma.productionUnit.findMany({
      where: {
        id: { in: unitIds },
      },
    })

    if (units.length === 0) {
      return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 404 })
    }

    // Generate current date string (DDMMYYYY)
    const currentDate = new Date()
    const dateString = currentDate
      .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "")

    // Generate barcodes for each unit and process
    const genUnitsData = []

    for (const unit of units) {
      // Check if barcodes already exist for this unit
      const existingGenUnits = await prisma.genProductionUnit.findMany({
        where: { productionUnitId: unit.id },
      })

      if (existingGenUnits.length > 0) {
        continue // Skip if barcodes already generated
      }

      for (const process of PROCESSES) {
        const barcodeText = `${unit.uniqCode}-${process}-${dateString}`

        // Generate SVG barcode using jsbarcode
        const dom = new JSDOM()
        const document = dom.window.document
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

        JsBarcode(svg, barcodeText, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 10,
        })

        genUnitsData.push({
          productionUnitId: unit.id,
          uniqCode: barcodeText,
          process: process as any,
          jsBarcode: svg.outerHTML,
          status: false,
        })
      }
    }

    if (genUnitsData.length === 0) {
      return NextResponse.json({ error: "Semua unit sudah memiliki barcode" }, { status: 400 })
    }

    // Create gen production units
    await prisma.genProductionUnit.createMany({
      data: genUnitsData,
    })

    return NextResponse.json({
      message: `Berhasil generate ${genUnitsData.length} barcode untuk ${units.length} unit`,
      generatedCount: genUnitsData.length,
    })
  } catch (error) {
    console.error("Generate barcode error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
