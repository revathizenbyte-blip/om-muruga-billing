import { getRequestContext } from '@cloudflare/next-on-pages';

// Helper to access Cloudflare D1 instance
function getDb() {
  try {
    const { env } = getRequestContext();
    return env.invoices_db;
  } catch (e) {
    console.error("D1 database binding 'invoices_db' not found.", e);
    return null;
  }
}

// Get all invoices
export async function getInvoices() {
  const db = getDb();
  if (!db) return [];
  const { results } = await db.prepare("SELECT * FROM invoices ORDER BY createdAt DESC").all();
  return results || [];
}

// Get single invoice by ID
export async function getInvoiceById(id) {
  const db = getDb();
  if (!db) return null;
  const result = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  return result || null;
}

// Create new invoice
export async function createInvoice(invoice) {
  const db = getDb();
  if (!db) throw new Error("Database connection unavailable");

  const query = `
    INSERT INTO invoices (billNo, date, customerName, customerPhone, subTotal, cgst, sgst, grandTotal, items, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.prepare(query).bind(
    invoice.billNo || null,
    invoice.date || '',
    invoice.customerName || '',
    invoice.customerPhone || '',
    invoice.subTotal || 0,
    invoice.cgst || 0,
    invoice.sgst || 0,
    invoice.grandTotal || 0,
    typeof invoice.items === 'string' ? invoice.items : JSON.stringify(invoice.items || []),
    invoice.createdAt || new Date().toISOString()
  ).run();

  return invoice;
}

// Delete invoice
export async function deleteInvoice(id) {
  const db = getDb();
  if (!db) throw new Error("Database connection unavailable");
  await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
  return true;
}