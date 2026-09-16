import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request) {
    try {
        const body = await request.json();
        const { billNo, date, customerName, customerPhone, items, subtotal, total } = body;

        // Get D1 Binding from Cloudflare Edge Context
        const { env } = getRequestContext();
        const db = env.DB; // Make sure your D1 binding name in Cloudflare settings is "DB"

        if (!db) {
            return new Response(
                JSON.stringify({ error: "Database binding 'DB' not found" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Insert into D1
        const query = `
      INSERT INTO invoices (billNo, date, customerName, customerPhone, items, subtotal, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        await db
            .prepare(query)
            .bind(
                billNo || "",
                date || "",
                customerName || "",
                customerPhone || "",
                JSON.stringify(items || []),
                subtotal || 0,
                total || 0
            )
            .run();

        return new Response(
            JSON.stringify({ success: true, message: "Invoice saved successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("API Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to save invoice" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function GET(request) {
    try {
        const { env } = getRequestContext();
        const db = env.DB;

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";

        let results;
        if (query) {
            results = await db
                .prepare(
                    "SELECT * FROM invoices WHERE customerName LIKE ? OR billNo LIKE ? ORDER BY id DESC LIMIT 20"
                )
                .bind(`%${query}%`, `%${query}%`)
                .all();
        } else {
            results = await db
                .prepare("SELECT * FROM invoices ORDER BY id DESC LIMIT 20")
                .all();
        }

        return new Response(JSON.stringify(results.results || []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}