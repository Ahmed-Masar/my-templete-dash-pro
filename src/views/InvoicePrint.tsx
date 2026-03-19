"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer, Add as X } from "iconsax-react";
import { cartsAPI } from "@/lib/api";
import { Cart } from "@/store/slices/cartsSlice";
import logo from "@/assets/Sahel Jeddah Logo 2.png";


const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

const fmtTime = (d?: string) =>
  d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

const fmtNum = (n?: number) => (n != null ? n.toLocaleString("en-US") : "");

const uName = (u: Cart["user"]) => (typeof u === "object" ? u?.name ?? "" : "");
const uPhone = (u: Cart["user"]) => (typeof u === "object" ? u?.phone ?? "" : "");


export default function InvoicePrint({ id }: { id: string }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cartsAPI
      .getById(id)
      .then((res) => {
        const d = res.data;
        setCart(d?.cart ?? d?.carts?.[0] ?? d ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        Loading invoice…
      </div>
    );

  if (!cart)
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#ef4444" }}>
        Invoice not found.
      </div>
    );

  const items = cart.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.totalItemPrice ?? 0), 0);
  const totalDue = cart.totalPrice ?? subtotal;

  const statusLabel: Record<Cart["status"], string> = {
    draft: "Draft",
    generated: "Generated",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .invoice-shell { background: #fff !important; padding: 0 !important; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }

        .invoice-shell {
          background: #e5e7eb;
          min-height: calc(100vh - 57px);
          padding: 24px;
          display: flex;
          justify-content: center;
        }

        .invoice-page {
          width: 760px;
          background: #ffffff;
          padding: 40px 48px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #111827;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          gap: 24px;
        }

        .invoice-brand-name {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .invoice-brand-tagline {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }

        .invoice-meta-label {
          font-size: 26px;
          font-weight: 700;
          color: #1d4ed8;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: right;
        }

        .invoice-meta-table {
          margin-top: 8px;
          font-size: 12px;
          width: 100%;
        }

        .invoice-meta-table td {
          padding: 2px 0 2px 16px;
        }

        .invoice-meta-table td:first-child {
          color: #9ca3af;
          white-space: nowrap;
        }

        .invoice-meta-table td:last-child {
          text-align: right;
          font-weight: 600;
          color: #111827;
        }

        .invoice-divider {
          border: none;
          border-top: 2px solid #1d4ed8;
          margin-bottom: 28px;
        }

        .invoice-parties {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 32px;
          font-size: 13px;
        }

        .invoice-parties h4 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1d4ed8;
          margin-bottom: 8px;
        }

        .invoice-parties .name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .invoice-parties p {
          color: #4b5563;
          line-height: 1.6;
        }

        .invoice-items {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 28px;
        }

        .invoice-items thead tr {
          background: #1d4ed8;
          color: #fff;
        }

        .invoice-items th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .invoice-items th:nth-child(2),
        .invoice-items th:nth-child(3),
        .invoice-items td:nth-child(2),
        .invoice-items td:nth-child(3) {
          text-align: center;
        }

        .invoice-items th:last-child,
        .invoice-items td:last-child {
          text-align: right;
        }

        .invoice-items tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-items tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        .invoice-items td {
          padding: 10px 12px;
          color: #4b5563;
          vertical-align: top;
        }

        .invoice-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
        }

        .invoice-totals-box {
          width: 260px;
          font-size: 13px;
        }

        .invoice-totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }

        .invoice-totals-row strong {
          color: #111827;
        }

        .invoice-totals-row.total {
          border-bottom: none;
          border-top: 2px solid #1d4ed8;
          margin-top: 6px;
          padding-top: 10px;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .invoice-bottom {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          font-size: 13px;
        }

        .invoice-bottom h4 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1d4ed8;
          margin-bottom: 8px;
        }

        .invoice-bank-row {
          display: flex;
          gap: 8px;
          margin-bottom: 2px;
        }

        .invoice-bank-row span:first-child {
          color: #9ca3af;
          min-width: 80px;
        }

        .invoice-footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
        }

        .invoice-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .invoice-status.draft {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .invoice-status.generated {
          background: #e0f2fe;
          color: #0369a1;
        }
        .invoice-status.completed {
          background: #dcfce7;
          color: #15803d;
        }
        .invoice-status.cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }
      `}</style>

      <div
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "#e5e7eb", borderBottom: "1px solid #d1d5db",
          padding: "12px 20px", display: "flex", gap: "10px", justifyContent: "center",
        }}
      >
        <button
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontFamily: "sans-serif", fontSize: "14px", cursor: "pointer" }}
        >
          <Printer color="currentColor" size="15" /> Print
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", fontFamily: "sans-serif", fontSize: "14px", cursor: "pointer" }}
        >
          <X color="currentColor" size="14" className="rotate-45" /> Back
        </button>
      </div>

      <div className="invoice-shell">
        <div className="invoice-page">
          <div className="invoice-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, position: "relative", borderRadius: "999px", overflow: "hidden" }}>
                  <Image src={logo} alt="Sahel Jeddah" fill style={{ objectFit: "cover" }} />
                </div>
                <div className="invoice-brand-name">Sahel Jeddah</div>
              </div>
              <div className="invoice-brand-tagline">General Trading LLC</div>
            </div>
            <div style={{ textAlign: "right", minWidth: 220 }}>
              <div className="invoice-meta-label">Invoice</div>
              <table className="invoice-meta-table">
                <tbody>
                  <tr>
                    <td>Invoice No.</td>
                    <td>#{cart._id.slice(-8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td>Issue Date</td>
                    <td>{fmtDate(cart.createdAt || cart.updatedAt)}</td>
                  </tr>
                  <tr>
                    <td>Issue Time</td>
                    <td>{fmtTime(cart.createdAt || cart.updatedAt)}</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>
                      <span className={`invoice-status ${cart.status}`}>
                        {statusLabel[cart.status]}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <hr className="invoice-divider" />

          <div className="invoice-parties">
            <div>
              <h4>From</h4>
              <div className="name">Sahel Jeddah</div>
              <p>
                Al Fanar Building, Baghdad, Camp Sarah, Riyad District
                <br />
                info@saheljeddah.com
                <br />
                +964 781 4000 099
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h4>Bill To</h4>
              <div className="name">{uName(cart.user) || "Customer"}</div>
              <p>
                Phone: {uPhone(cart.user) || "—"}
                <br />
                Customer ID: {typeof cart.user === "object" ? cart.user._id : cart.user}
              </p>
            </div>
          </div>

          {/* Items */}
          <table className="invoice-items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.title || "Item"}
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      {item.specs}
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{fmtNum(item.itemPrice)}</td>
                  <td>{fmtNum(item.totalItemPrice)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "16px 12px", color: "#9ca3af" }}>
                    No items in this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="invoice-totals-box">
              <div className="invoice-totals-row">
                <span>Subtotal</span>
                <span>{fmtNum(subtotal)}</span>
              </div>
              <div className="invoice-totals-row total">
                <span>Total Due</span>
                <span>{fmtNum(totalDue)}</span>
              </div>
            </div>
          </div>

          {/* Bottom area */}
          <div className="invoice-bottom">
            <div>
              <h4>Payment Details</h4>
              <div className="invoice-bank-row">
                <span>Bank</span>
                <span>Iraq Bank</span>
              </div>
              <div className="invoice-bank-row">
                <span>IBAN</span>
                <span>1111111111111111111111</span>
              </div>
              <div className="invoice-bank-row">
                <span>Swift</span>
                <span>NNNNNNNNNN</span>
              </div>
            </div>
            <div>
              <h4>Notes</h4>
              <p style={{ color: "#4b5563", lineHeight: 1.7 }}>
                Thank you for your business. Please review all items and totals carefully.
                Payment terms and any additional conditions agreed with the sales representative apply.
              </p>
            </div>
          </div>

          <div className="invoice-footer">
            Sahel Jeddah · info@saheljeddah.com · +964 781 4000 099
          </div>
        </div>
      </div>
    </>
  );
}
