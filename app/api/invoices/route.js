import { NextResponse } from "next/server";
import { getInvoices, createInvoice, deleteInvoice } from "@/lib/db";

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = (searchParams.get("query") || "").toLowerCase();

        const allInvoices = await getInvoices();

        // Filter invoices by customer name, date, or bill number
        const filtered = allInvoices.filter((inv) => {
            const nameMatch = inv.customerName?.toLowerCase().includes(query);
            const dateMatch = inv.date?.toLowerCase().includes(query);
            const billMatch = inv.billNo?.toString().includes(query);
            return nameMatch || dateMatch || billMatch;
        });

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Database fetch failed" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // Calls createInvoice from lib/db.js to interact with Cloudflare D1
        const result = await createInvoice(body);

        return NextResponse.json({
            success: true,
            id: result?.meta?.last_row_id || result?.id || null
        });
    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save invoice" },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
        }

        await deleteInvoice(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }
}