import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Safe accessor for Cloudflare D1 Binding
 */
function getDb() {
  try {
    const { env } = getRequestContext();
    if (!env || !env.invoices_db) {
      console.error("D1 database binding 'invoices_db' is missing from request context.");
      return null;
    }
    return env.invoices_db;
  } catch (e) {
    console.error("Failed to access getRequestContext() env. Ensure runtime = 'edge' is enabled in your API route.", e);
    return null;
  }
}

/**
 * Fetch all invoices sorted by latest creation date
 */
export async function getInvoices() {
  const db = getDb();
  if (!db) return [];

  try {
    const { results } = await db.prepare("SELECT * FROM invoices ORDER BY id DESC").all();
    return results ? results.map(parseInvoiceRow) : [];
  } catch (error) {
    console.error("Error fetching invoices from D1:", error);
    return [];
  }
}

/**
 * Fetch a single invoice by its ID
 */
export async function getInvoiceById(id) {
  const db = getDb();
  if (!db) return null;

  try {
    const result = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
    return result ? parseInvoiceRow(result) : null;
  } catch (error) {
    console.error(`Error fetching invoice #${id} from D1:`, error);
    return null;
  }
}

/**
 * Insert a new invoice into D1
 */
export async function createInvoice(invoice) {
  const db = getDb();
  if (!db) {
    throw new Error("Database binding unavailable. Check Worker bindings configuration.");
  }

  // Format complex objects/arrays to string for SQLite storage
  const itemsJson = typeof invoice.items === 'string' 
    ? invoice.items 
    : JSON.stringify(invoice.items || []);

  const query = `
    INSERT INTO invoices (
      billNo, date, customerName, customerPhone, 
      subTotal, cgst, sgst, grandTotal, items, createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const info = await db.prepare(query).bind(
      invoice.billNo ? Number(invoice.billNo) : null,
      invoice.date || new Date().toISOString().split('T')[0],
      invoice.customerName || '',
      invoice.customerPhone || '',
      Number(invoice.subTotal) || 0,
      Number(invoice.cgst) || 0,
      Number(invoice.sgst) || 0,
      Number(invoice.grandTotal) || 0,
      itemsJson,
      invoice.createdAt || new Date().toISOString()
    ).run();

    return { id: info.meta?.last_row_id, ...invoice };
  } catch (error) {
    console.error("Failed to execute INSERT query in Cloudflare D1:", error);
    throw new Error(`D1 Execution Error: ${error.message}`);
  }
}

/**
 * Delete an invoice by ID
 */
export async function deleteInvoice(id) {
  const db = getDb();
  if (!db) throw new Error("Database binding unavailable.");

  try {
    await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
    return true;
  } catch (error) {
    console.error(`Failed to delete invoice #${id}:`, error);
    throw error;
  }
}

/**
 * Helper to safely deserialize JSON strings back into JS objects
 */
function parseInvoiceRow(row) {
  if (!row) return row;
  try {
    if (typeof row.items === 'string') {
      row.items = JSON.parse(row.items);
    }
  } catch (e) {
    row.items = [];
  }
  return row;
}