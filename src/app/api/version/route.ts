import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "file.txt");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const raw = (lines[lines.length - 1] ?? "1.0.0").trim();
    const version = raw.startsWith("v") ? raw : `v${raw}`;
    return NextResponse.json({ version: `${version} Dashboard` });
  } catch {
    return NextResponse.json(
      { version: "v1.0.0 Dashboard" },
      { status: 200 }
    );
  }
}
