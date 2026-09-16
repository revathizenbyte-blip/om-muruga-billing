"use client";

import { useState } from "react";

export default function Home() {
    const [billNo, setBillNo] = useState("1");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [customer, setCustomer] = useState({ name: "Revathi", phone: "" });
    const [items, setItems] = useState([
        { description: "", hsn: "", quantity: 1, rate: 0, amount: 0 },
    ]);

    const [savedInvoices, setSavedInvoices] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === "quantity" || field === "rate") {
            const q = Number(newItems[index].quantity) || 0;
            const r = Number(newItems[index].rate) || 0;
            newItems[index].amount = q * r;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: "", hsn: "", quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        if (!customer.name) {
            alert("Please enter customer name");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    billNo,
                    date,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    items,
                    subtotal,
                    total,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Invoice saved successfully!");
            } else {
                alert("Failed to save: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Error saving invoice");
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async (query = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/invoices?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSavedInvoices(data);
            }
        } catch (err) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSearch = () => {
        setShowSearchModal(true);
        fetchInvoices("");
    };

    const loadInvoice = (inv) => {
        setBillNo(inv.billNo ? inv.billNo.toString() : "");
        setDate(inv.date || new Date().toISOString().split("T")[0]);
        setCustomer({ name: inv.customerName || "", phone: inv.customerPhone || "" });

        try {
            if (typeof inv.items === "string") {
                setItems(JSON.parse(inv.items));
            } else if (Array.isArray(inv.items)) {
                setItems(inv.items);
            }
        } catch (e) {
            setItems([]);
        }

        setShowSearchModal(false);
    };

    return (
        <main className="min-h-screen bg-gray-600 p-4 sm:p-8 flex flex-col items-center">
            {/* Top Action Bar */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-white">Om Muruga Invoice Generator</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleOpenSearch}
                        className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700"
                    >
                        Search Saved
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-emerald-700"
                    >
                        {loading ? "Saving..." : "Save Only"}
                    </button>
                    <button
                        onClick={() => {
                            handleSave();
                            window.print();
                        }}
                        className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-blue-800"
                    >
                        Save & Print
                    </button>
                </div>
            </div>

            {/* Tax Invoice Document Template */}
            <div className="bg-white w-full max-w-3xl p-8 rounded shadow-xl text-gray-800 border text-sm">
                {/* Header */}
                <div className="text-center border-b pb-4 mb-4">
                    <h2 className="text-xl font-extrabold uppercase tracking-wide">
                        OM MURUGA AUTO ELECTRICAL WORKS
                    </h2>
                    <p className="text-xs font-semibold text-gray-600 mt-1">
                        GSTIN: 33DSSPS7678B1Z2
                    </p>
                    <p className="text-xs text-gray-500">Cell: 997676 5151 / 80 98986464</p>
                    <p className="text-xs text-gray-500">
                        6/1, Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Vadavalli, Coimbatore - 641 007
                    </p>
                    <h3 className="text-md font-bold mt-2 uppercase underline tracking-wider">
                        TAX INVOICE
                    </h3>
                </div>

                {/* Customer & Bill Details */}
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="w-1/2 space-y-2">
                        <label className="text-xs font-semibold text-gray-600 block">To</label>
                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            className="w-full border px-2 py-1 rounded bg-gray-50 focus:bg-white"
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            className="w-full border px-2 py-1 rounded bg-gray-50 focus:bg-white"
                        />
                    </div>

                    <div className="w-1/3 text-right space-y-2">
                        <div className="flex justify-end items-center gap-2">
                            <span className="font-semibold text-xs">Bill No:</span>
                            <input
                                type="text"
                                value={billNo}
                                onChange={(e) => setBillNo(e.target.value)}
                                className="w-20 border px-2 py-1 text-right rounded bg-gray-50"
                            />
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <span className="font-semibold text-xs">Date:</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border px-2 py-1 text-right rounded bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-gray-300 text-left text-xs mb-4">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="border border-gray-300 p-2 w-12 text-center">Sr. No.</th>
                            <th className="border border-gray-300 p-2">Description</th>
                            <th className="border border-gray-300 p-2 w-20 text-center">HSN Code</th>
                            <th className="border border-gray-300 p-2 w-16 text-center">Qty</th>
                            <th className="border border-gray-300 p-2 w-20 text-right">Price (₹)</th>
                            <th className="border border-gray-300 p-2 w-24 text-right">Total (₹)</th>
                            <th className="border border-gray-300 p-1 w-8 text-center print:hidden"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                                <td className="border border-gray-300 p-1">
                                    <input
                                        type="text"
                                        value={item.description}
                                        placeholder="Item description"
                                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                        className="w-full px-1 bg-transparent border-none focus:outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 p-1">
                                    <input
                                        type="text"
                                        value={item.hsn}
                                        onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                                        className="w-full px-1 text-center bg-transparent border-none focus:outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 p-1">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                        className="w-full px-1 text-center bg-transparent border-none focus:outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 p-1">
                                    <input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                        className="w-full px-1 text-right bg-transparent border-none focus:outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 p-2 text-right font-semibold">
                                    {(item.amount || 0).toFixed(2)}
                                </td>
                                <td className="border border-gray-300 p-1 text-center print:hidden">
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button
                    onClick={addItem}
                    className="bg-emerald-800 text-white text-xs px-3 py-1 rounded font-medium hover:bg-emerald-900 print:hidden mb-6"
                >
                    + Add Item
                </button>

                {/* Totals & Footer */}
                <div className="flex justify-between items-start pt-4 border-t border-gray-300">
                    <div className="text-[10px] text-gray-500 space-y-1 w-1/2">
                        <p className="font-bold text-gray-700">Terms & Conditions:</p>
                        <p>1. Goods once sold cannot be taken back.</p>
                        <p>2. Our risk and responsibility ceases on delivery of goods to carriers.</p>
                        <p>3. We cannot be responsible for any damage or theft in transit.</p>
                        <p>4. Bills not paid within 30 days incur 24% interest per annum.</p>
                        <p>5. All disputes will be settled under Coimbatore jurisdiction.</p>
                    </div>

                    <div className="w-1/3 text-xs space-y-1 text-right">
                        <div className="flex justify-between">
                            <span>Sub Total:</span>
                            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CGST (9%):</span>
                            <span className="font-semibold">₹{cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>SGST (9%):</span>
                            <span className="font-semibold">₹{sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-800 pt-1 text-sm font-bold">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Signature */}
                <div className="mt-12 text-right text-xs">
                    <p className="font-bold">For Om Muruga Auto Electrical Works</p>
                    <div className="h-10"></div>
                    <p className="font-bold">S. Selvakumar</p>
                    <p className="text-gray-500 text-[10px]">Authorised Signatory</p>
                </div>
            </div>

            {/* Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto text-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Saved Invoices</h2>
                            <button
                                onClick={() => setShowSearchModal(false)}
                                className="text-gray-500 hover:text-gray-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search by customer, date, bill no..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                fetchInvoices(e.target.value);
                            }}
                            className="w-full border p-2 rounded mb-4"
                        />

                        {savedInvoices.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No invoices found</p>
                        ) : (
                            <div className="space-y-2">
                                {savedInvoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        onClick={() => loadInvoice(inv)}
                                        className="p-3 border rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-semibold">{inv.customerName}</div>
                                            <div className="text-xs text-gray-500">
                                                Bill #{inv.billNo} | {inv.date}
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-800">
                                            ₹{(inv.total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}