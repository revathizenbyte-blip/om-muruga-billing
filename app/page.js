"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Printer, Search, Save } from "lucide-react";

export default function InvoiceGenerator() {
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [items, setItems] = useState([
    { id: 1, description: "", hsn: "", qty: "", price: "", total: 0 },
  ]);

  const fetchNextBillNumber = async () => {
    try {
      const res = await fetch("/api/invoices?query=");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const maxBill = Math.max(...data.map((inv) => parseInt(inv.billNo, 10) || 0));
          setBillNo((maxBill + 1).toString());
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching bill numbers:", err);
    }
    setBillNo("1");
  };

  useEffect(() => {
    fetchNextBillNumber();
  }, []);

  const handleDeleteInvoice = async (id, billNum) => {
    if (!confirm(`Are you sure you want to delete Invoice #${billNum}?`)) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSearchResults(searchResults.filter((inv) => inv.id !== id));
        fetchNextBillNumber();
      } else {
        alert("Failed to delete invoice.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting invoice.");
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    item[field] = value;

    if (field === "qty" || field === "price") {
      const qtyVal = field === "qty" ? parseFloat(value) || 0 : parseFloat(item.qty) || 0;
      const priceVal = field === "price" ? parseFloat(value) || 0 : parseFloat(item.price) || 0;
      item.total = parseFloat((qtyVal * priceVal).toFixed(2));
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), description: "", hsn: "", qty: "", price: "", total: 0 },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const resetFormForNextInvoice = (nextNo) => {
    setBillNo(nextNo);
    setCustomer({ name: "", phone: "" });
    setItems([{ id: Date.now(), description: "", hsn: "", qty: "", price: "", total: 0 }]);
  };

  const subTotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
  const cgst = subTotal * 0.09;
  const sgst = subTotal * 0.09;
  const grandTotal = Math.round(subTotal + cgst + sgst);

  const saveToDatabase = async () => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNo,
          date,
          customerName: customer.name,
          customerPhone: customer.phone,
          subTotal,
          cgst,
          sgst,
          grandTotal,
          items,
        }),
      });

      if (!response.ok) throw new Error("Failed to save invoice");
      alert(`Invoice #${billNo} saved to database successfully!`);

      const currentNum = parseInt(billNo, 10) || 1;
      const nextBillNo = (currentNum + 1).toString();
      resetFormForNextInvoice(nextBillNo);
      return true;
    } catch (err) {
      console.error(err);
      alert("Error saving invoice to database.");
      return false;
    }
  };

  const handlePrint = async () => {
    const saved = await saveToDatabase();
    if (saved) {
      window.print();
    }
  };

  const handleOpenSearch = async () => {
    setShowSearchModal(true);
    await fetchAllInvoices();
  };

  const fetchAllInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?query=");
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const res = await fetch(`/api/invoices?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoice = (inv) => {
    setBillNo(inv.billNo.toString());
    setDate(inv.date);
    setCustomer({ name: inv.customerName || "", phone: inv.customerPhone || "" });
    try {
      setItems(JSON.parse(inv.items));
    } catch {
      setItems([]);
    }
    setShowSearchModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-xl font-bold text-slate-900">Om Muruga Invoice Generator</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOpenSearch}
            style={{
              backgroundColor: "#1e293b",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #0f172a",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            <Search style={{ width: "16px", height: "16px", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontSize: "14px" }}>Search Invoices</span>
          </button>

          <button
            type="button"
            onClick={saveToDatabase}
            style={{
              backgroundColor: "#059669",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            <Save style={{ width: "16px", height: "16px", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontSize: "14px" }}>Save Only</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            <Printer style={{ width: "16px", height: "16px", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontSize: "14px" }}>Save & Print</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md print:shadow-none print:p-0">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
            OM MURUGA AUTO ELECTRICAL WORKS
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-1">GSTIN: 33DSSPS7678B1Z2</p>
          <p className="text-xs text-slate-700">Cell: 997676 5151 / 80 98986464</p>
          <p className="text-xs text-slate-700">
            6/1, Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007
          </p>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900 mt-3 underline">
            TAX INVOICE
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-2">
            <div>
              <label className="font-bold block text-xs text-slate-700">To</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-2 py-1 text-slate-900 bg-white"
                placeholder="Customer Name"
              />
            </div>
            <div>
              <input
                type="text"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full border border-slate-300 rounded px-2 py-1 text-slate-900 bg-white"
                placeholder="Phone Number"
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <h3 className="font-bold text-base text-slate-900">INVOICE</h3>
            <div className="flex justify-end items-center gap-2">
              <label className="font-bold text-xs text-slate-700">Bill No:</label>
              <input
                type="number"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-24 border border-slate-300 rounded px-2 py-1 text-right text-slate-900 bg-white"
              />
            </div>
            <div className="flex justify-end items-center gap-2">
              <label className="font-bold text-xs text-slate-700">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-36 border border-slate-300 rounded px-2 py-1 text-right text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        <table className="w-full text-left text-sm mb-4 border-collapse">
          <thead>
            <tr className="border-b border-t bg-slate-50 text-slate-800">
              <th className="p-2 text-center w-12">Sr. No.</th>
              <th className="p-2">Description</th>
              <th className="p-2 w-24 text-center">HSN Code</th>
              <th className="p-2 w-16 text-center">Qty</th>
              <th className="p-2 w-28 text-center">Price (₹)</th>
              <th className="p-2 w-28 text-right">Total (₹)</th>
              <th className="p-2 w-10 print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 text-center text-slate-900">{index + 1}</td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-slate-900 bg-white"
                    placeholder="Item description"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.hsn}
                    onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-center text-slate-900 bg-white"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-center text-slate-900 bg-white"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-right text-slate-900 bg-white"
                  />
                </td>
                <td className="p-2 text-right font-medium text-slate-900">
                  {item.total.toFixed(2)}
                </td>
                <td className="p-2 text-center print:hidden">
                  <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addItem}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded mb-6 print:hidden cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>

        <div className="grid grid-cols-2 gap-4 text-xs border-t pt-4">
          <div>
            <p className="font-bold text-slate-900 mb-1">Terms & Conditions:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
              <li>Goods once sold cannot be taken back.</li>
              <li>Our risk and responsibility ceases on delivery of goods to carriers.</li>
              <li>We cannot be responsible for any damage or theft in transit.</li>
              <li>Bills not paid within 30 days incur 24% interest per annum.</li>
              <li>All disputes will be settled under Coimbatore jurisdiction.</li>
            </ol>
          </div>

          <div className="space-y-1 text-right text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Sub Total:</span>
              <span className="font-medium text-slate-900">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CGST (9%):</span>
              <span className="font-medium text-slate-900">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-600">SGST (9%):</span>
              <span className="font-medium text-slate-900">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 pt-1">
              <span>Total:</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-end text-xs">
          <div className="text-right">
            <p className="font-semibold text-slate-800">For Om Muruga Auto Electrical Works</p>
            <div className="h-12"></div>
            <p className="font-bold text-slate-900">S. Selvakumar</p>
            <p className="text-slate-600">Authorised Signatory</p>
          </div>
        </div>
      </div>

      {showSearchModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              color: "#0f172a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Search Saved Invoices
              </h3>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Type Customer Name or Date..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "#0f172a",
                backgroundColor: "#f8fafc",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ maxHeight: "250px", overflowY: "auto", borderTop: "1px solid #e2e8f0" }}>
              {searchResults.length === 0 ? (
                <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", padding: "24px 0" }}>
                  No saved invoices found.
                </p>
              ) : (
                searchResults.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: "12px 4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                        Bill #{inv.billNo} — {inv.customerName || "Unnamed"}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                        Date: {inv.date} | Phone: {inv.customerPhone || "N/A"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                          ₹{inv.grandTotal}
                        </p>
                        <button
                          type="button"
                          onClick={() => loadInvoice(inv)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2563eb",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                            marginTop: "4px",
                          }}
                        >
                          Load Invoice
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteInvoice(inv.id, inv.billNo)}
                        style={{
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}