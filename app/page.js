"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [items, setItems] = useState([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  const [savedInvoices, setSavedInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const total = subtotal;

  // Handle item changes
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
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Save invoice to D1 Database via API
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

  // Fetch invoices for search modal
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

  // Open modal and fetch initial invoices
  const handleOpenSearch = () => {
    setShowSearchModal(true);
    fetchInvoices("");
  };

  // Safe load invoice function (handles both array and stringified items)
  const loadInvoice = (inv) => {
    setBillNo(inv.billNo ? inv.billNo.toString() : "");
    setDate(inv.date || new Date().toISOString().split("T")[0]);
    setCustomer({ name: inv.customerName || "", phone: inv.customerPhone || "" });

    try {
      if (typeof inv.items === "string") {
        setItems(JSON.parse(inv.items));
      } else if (Array.isArray(inv.items)) {
        setItems(inv.items);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to parse items:", e);
      setItems([]);
    }

    setShowSearchModal(false);
  };

  // Delete an invoice
  const handleDeleteInvoice = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedInvoices(savedInvoices.filter((inv) => inv.id !== id));
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto bg-gray-50 text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing System</h1>
        <button
          onClick={handleOpenSearch}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Search Saved Invoices
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bill No</label>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Auto / Manual"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full border p-2 rounded"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full border p-2 rounded"
              placeholder="Phone"
            />
          </div>
        </div>

        {/* Item List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Items</h2>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                className="flex-grow border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                className="w-20 border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                className="w-24 border p-2 rounded"
              />
              <span className="w-24 text-right font-semibold">
                ₹{(item.amount || 0).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 px-2 font-bold"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addItem}
            className="mt-2 text-sm text-blue-600 font-semibold hover:underline"
          >
            + Add Item
          </button>
        </div>

        <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
          <span>Total Amount:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Saved Invoices</h2>
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
                      <div className="text-sm text-gray-500">
                        Bill #{inv.billNo} | {inv.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">
                        ₹{(inv.total || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => handleDeleteInvoice(inv.id, e)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
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