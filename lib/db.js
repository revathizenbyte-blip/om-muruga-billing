import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "invoices.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billNo INTEGER,
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

export default db;