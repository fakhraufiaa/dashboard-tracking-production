import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, ProcessType } from "@prisma/client"
import JsBarcode from "jsbarcode"
import { JSDOM } from "jsdom"
import dayjs from "dayjs"

export const runtime = "nodejs" // ✅ pastikan jalan di Node.js

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { unitIds } = await req.json()
    const dateStr = dayjs().format("DDMMYYYY")

    const units = await prisma.productionUnit.findMany({
      where: { id: { in: unitIds } }
    })

    if (units.length === 0) {
      return NextResponse.json(
        { success: false, error: "No production units found" },
        { status: 404 }
      )
    }

    const genData: { productionUnitId: number; uniqCode: string; process: ProcessType; jsBarcode: string }[] = []

    for (const unit of units) {
      for (const proc of Object.values(ProcessType)) {
        const [prodCode, unitCode] = unit.uniqCode.split("-")
        const baseCode = `${prodCode.slice(-2)}${unitCode}`
        const uniqCode = `${baseCode}-${proc}-${dayjs().format("DDMM")}`

        // generate SVG
       const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
         pretendToBeVisual: true,
       });
       const document = dom.window.document;
       const svg = document.createElementNS(
         "http://www.w3.org/2000/svg",
         "svg"
       );

       // kasih window ke JsBarcode
       JsBarcode(svg, uniqCode, {
         xmlDocument: document, // ⬅️ ini penting biar ga nyari global document
         format: "CODE128",
         displayValue: true,
         height: 40,
         fontSize: 18,
       });
       const svgStr = svg.outerHTML;

        genData.push({
          productionUnitId: unit.id,
          uniqCode,
          process: proc as ProcessType,
          jsBarcode: svgStr,
        })
      }
    }

    // insert ke DB
    await prisma.genProductionUnit.createMany({
      data: genData,
      skipDuplicates: true,
    })

    // query ulang data yg baru dibuat
    const created = await prisma.genProductionUnit.findMany({
      where: { productionUnitId: { in: unitIds } },
    })

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error("❌ Error in POST /barcode:", error)
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
