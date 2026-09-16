import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request) {
    try {
        const body = await request.json();
        const { billNo, date, customerName, customerPhone, items, subtotal, total } = body;

        // Get Cloudflare Edge Context
        const { env } = getRequestContext();
        const db = env?.DB;

        if (!db) {
            return new Response(
                JSON.stringify({ error: "Cloudflare D1 Binding 'DB' is missing in settings." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Auto-create table if it doesn't exist yet
        await db.prepare(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        billNo TEXT,
        date TEXT,
        customerName TEXT,
        customerPhone TEXT,
        items TEXT,
        subtotal REAL,
        total REAL
      )
    `).run();

        // Insert record
        await db.prepare(`
      INSERT INTO invoices (billNo, date, customerName, customerPhone, items, subtotal, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
            String(billNo || ""),
            String(date || ""),
            String(customerName || ""),
            String(customerPhone || ""),
            JSON.stringify(items || []),
            Number(subtotal) || 0,
            Number(total) || 0
        ).run();

        return new Response(
            JSON.stringify({ success: true, message: "Invoice saved successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message || "Failed to execute database query" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function GET(request) {
    try {
        const { env } = getRequestContext();
        const db = env?.DB;

        if (!db) {
            return new Response(
                JSON.stringify({ error: "Cloudflare D1 Binding 'DB' missing" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";

        let results;
        if (query) {
            results = await db.prepare(
                "SELECT * FROM invoices WHERE customerName LIKE ? OR billNo LIKE ? ORDER BY id DESC LIMIT 20"
            ).bind(`%${query}%`, `%${query}%`).all();
        } else {
            results = await db.prepare("SELECT * FROM invoices ORDER BY id DESC LIMIT 20").all();
        }

        return new Response(JSON.stringify(results.results || []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message || "Failed to fetch invoices" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}