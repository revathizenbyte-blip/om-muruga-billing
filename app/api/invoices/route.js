export const runtime = 'edge';
import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "invoices.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billNo TEXT,
    date TEXT,
    customerName TEXT,
    customerPhone TEXT,
    subTotal REAL,
    cgst REAL,
    sgst REAL,
    grandTotal REAL,
    items TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    const stmt = db.prepare(`
      SELECT * FROM invoices 
      WHERE customerName LIKE ? OR date LIKE ? OR billNo LIKE ?
      ORDER BY id DESC
    `);
    
    const invoices = stmt.all(`%${query}%`, `%${query}%`, `%${query}%`);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Database fetch failed" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const stmt = db.prepare(`
      INSERT INTO invoices (billNo, date, customerName, customerPhone, subTotal, cgst, sgst, grandTotal, items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.billNo,
      body.date,
      body.customerName,
      body.customerPhone,
      body.subTotal,
      body.cgst,
      body.sgst,
      body.grandTotal,
      JSON.stringify(body.items)
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
    }

    const stmt = db.prepare("DELETE FROM invoices WHERE id = ?");
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}