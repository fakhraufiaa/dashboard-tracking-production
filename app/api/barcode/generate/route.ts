import { NextRequest, NextResponse } from "next/server";
import { $Enums, PrismaClient, ProcessType } from "@prisma/client";
import JsBarcode from "jsbarcode";
import { JSDOM } from "jsdom";
import dayjs from "dayjs";

export const runtime = "nodejs";

const prisma = new PrismaClient();

const processTypes: ProcessType[] = [
  "INV", "SCC", "BATT", "PD", "PB", "WD", "WB", "QC", "FINISH"
];

export async function POST(req: NextRequest) {
  try {
    
    const { uniqCode } = await req.json();
    const [prodCode, unitCode] = uniqCode.split("-")
    const baseCode = `${prodCode.slice(-2)}${unitCode}`

    if (!uniqCode) {
      return NextResponse.json(
        { success: false, error: "uniqCode is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Cari productionUnitId berdasarkan uniqCode
    const productionUnit = await prisma.productionUnit.findUnique({
      where: { uniqCode }
    });

    if (!productionUnit) {
      return NextResponse.json(
        { success: false, error: `Production unit with uniqCode ${uniqCode} not found` },
        { status: 404 }
      );
    }

    const productionUnitId = productionUnit.id;
    const dateStr = dayjs().format("DDMM");
    const genData: { uniqCode: string; process: $Enums.ProcessType; jsBarcode: string; productionUnitId: number; }[] = [];

    for (const proc of processTypes) {
      // buat JSDOM
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
        pretendToBeVisual: true
      });
      const document = dom.window.document;

      // buat SVG
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      const displayProc = proc === "FINISH" ? "FNSH" : proc;
      const fullCode = `${baseCode}${displayProc}${dateStr}`; 

      JsBarcode(svg, fullCode, {
        format: "CODE128",
        displayValue: true,
        height: 40,
        fontSize: 18,
        xmlDocument: document
      });

      genData.push({
        uniqCode: fullCode,
        process: proc,
        jsBarcode: svg.outerHTML,
        productionUnitId
      });
    }

    // Simpan ke database
    await prisma.genProductionUnit.createMany({
      data: genData,
      skipDuplicates: true
    });

    const created = await prisma.genProductionUnit.findMany({
      where: { productionUnitId }
    });
    

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("❌ Error in POST /barcode:", error);
    return NextResponse.json(
      { success: false, error:"Internal Server Error" },
      { status: 500 }
    );
  }
}
