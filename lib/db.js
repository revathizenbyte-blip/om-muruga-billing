import { getRequestContext } from "@cloudflare/next-on-pages";

// Helper function to safely fetch the D1 binding from Cloudflare's request context
function getD1Database() {
  try {
    const { env } = getRequestContext();
    if (!env || !env.DB) {
      throw new Error(
        "D1 Database binding 'DB' was not found. Please verify your wrangler.toml setup."
      );
    }
    return env.DB;
  } catch (error) {
    console.error("Error accessing Cloudflare D1 Context:", error);
    throw error;
  }
}

// Fetch all invoices
export async function getInvoices() {
  const db = getD1Database();
  const { results } = await db
    .prepare("SELECT * FROM invoices ORDER BY id DESC")
    .all();

  return results || [];
}

// Create a new invoice
export async function createInvoice(data) {
  const db = getD1Database();
  const {
    billNo,
    date,
    customerName,
    customerPhone,
    items,
    subtotal,
    total,
  } = data;

  // Convert array/object items into a JSON string for SQLite storage
  const itemsJson = typeof items === "string" ? items : JSON.stringify(items || []);

  const result = await db
    .prepare(
      `INSERT INTO invoices (billNo, date, customerName, customerPhone, items, subtotal, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      billNo || "",
      date || "",
      customerName || "",
      customerPhone || "",
      itemsJson,
      subtotal || 0,
      total || 0
    )
    .run();

  return result;
}

// Delete an invoice by ID
export async function deleteInvoice(id) {
  const db = getD1Database();
  const result = await db
    .prepare("DELETE FROM invoices WHERE id = ?")
    .bind(id)
    .run();

  return result;
}