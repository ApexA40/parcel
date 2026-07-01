import { useRef } from "react";
import { X, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { formatCurrency, type PartnerParcel } from "./partnerData";

interface Props {
  parcel: PartnerParcel;
  onClose: () => void;
}

// ─── The actual label (rendered on screen + cloned into print window) ──────────
export function PartnerParcelLabel({ parcel }: { parcel: PartnerParcel }) {
  const total = parcel.itemCost + parcel.deliveryFee;

  // QR code value — compact JSON with key parcel info
  const qrValue = JSON.stringify({
    id:       parcel.trackingId,
    receiver: parcel.receiverName,
    phone:    parcel.receiverPhone,
    station:  parcel.station,
    total:    total.toFixed(2),
    pod:      parcel.pod,
  });

  return (
    <div
      id="partner-label"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "white",
        border: "2px solid black",
        padding: "16px",
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "10px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo-1.png" alt="M&M" crossOrigin="anonymous"
            style={{ height: "56px", width: "56px", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "black" }}>Mealex &amp; Mailex (M&amp;M)</div>
            <div style={{ fontSize: "12px", color: "#555" }}>Parcel Delivery System</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Partner Parcel</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            {new Date(parcel.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Tracking ID block */}
      <div style={{ background: "black", color: "white", textAlign: "center", padding: "10px 16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", letterSpacing: "2px" }}>TRACKING NUMBER</div>
        <div style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "4px", fontFamily: "monospace" }}>{parcel.trackingId}</div>
      </div>

      {/* QR + Barcode row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
        {/* QR Code */}
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px", textAlign: "center" }}>
          <QRCodeSVG
            value={qrValue}
            size={110}
            level="M"
            includeMargin={false}
          />
          <div style={{ fontSize: "9px", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Scan to Track</div>
        </div>

        {/* Barcode */}
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px", textAlign: "center" }}>
          <Barcode
            value={parcel.trackingId}
            width={1.6}
            height={60}
            fontSize={12}
            margin={0}
            displayValue={true}
            background="white"
            lineColor="black"
          />
          <div style={{ fontSize: "9px", color: "#888", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Parcel Barcode</div>
        </div>
      </div>

      {/* Sender + Receiver */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div style={{ border: "2px solid black", padding: "8px" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "4px" }}>From (Sender)</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "black" }}>{parcel.senderName || "—"}</div>
        </div>
        <div style={{ border: "2px solid black", padding: "8px" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "4px" }}>To (Receiver)</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "black" }}>{parcel.receiverName}</div>
          <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>{parcel.receiverPhone}</div>
          {parcel.receiverAltPhone && (
            <div style={{ fontSize: "11px", color: "#666" }}>Alt: {parcel.receiverAltPhone}</div>
          )}
        </div>
      </div>

      {/* Address + Description */}
      {(parcel.receiverAddress || parcel.description) && (
        <div style={{ display: "grid", gridTemplateColumns: parcel.receiverAddress && parcel.description ? "1fr 1fr" : "1fr", gap: "10px", marginBottom: "10px" }}>
          {parcel.receiverAddress && (
            <div style={{ border: "1px solid #ccc", padding: "8px" }}>
              <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "3px" }}>Delivery Address</div>
              <div style={{ fontSize: "13px", color: "black" }}>{parcel.receiverAddress}</div>
            </div>
          )}
          {parcel.description && (
            <div style={{ border: "1px solid #ccc", padding: "8px" }}>
              <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "3px" }}>Item Description</div>
              <div style={{ fontSize: "13px", color: "black" }}>{parcel.description}</div>
              {(parcel.weight || parcel.itemCount) && (
                <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                  {parcel.weight && `Weight: ${parcel.weight}kg`}
                  {parcel.weight && parcel.itemCount && " · "}
                  {parcel.itemCount && `Items: ${parcel.itemCount}`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Station */}
      <div style={{ border: "2px solid black", padding: "8px", marginBottom: "10px", background: "#f9f9f9" }}>
        <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "3px" }}>Destination Station</div>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{parcel.station}</div>
      </div>

      {/* Payment */}
      <div style={{ border: "2px solid black", padding: "8px", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "6px" }}>Payment Details</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "black", marginBottom: "3px" }}>
          <span>Delivery Fee:</span>
          <span style={{ fontWeight: "600" }}>{formatCurrency(parcel.deliveryFee)}</span>
        </div>
        {parcel.pod && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "black", marginBottom: "3px" }}>
            <span>Item Cost (POD):</span>
            <span style={{ fontWeight: "600" }}>{formatCurrency(parcel.itemCost)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", color: "black", borderTop: "2px solid black", paddingTop: "6px", marginTop: "4px" }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* POD badge */}
      {parcel.pod && (
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <span style={{ display: "inline-block", background: "black", color: "white", padding: "5px 20px", fontSize: "13px", fontWeight: "bold", letterSpacing: "2px" }}>
            PAYMENT ON DELIVERY
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "#555" }}>
          Printed: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          &nbsp;·&nbsp; For inquiries contact M&amp;M Parcel Services
        </div>
      </div>
    </div>
  );
}

// ─── Print preview modal ───────────────────────────────────────────────────────
export const ParcelLabelModal = ({ parcel, onClose }: Props) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = labelRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parcel Label — ${parcel.trackingId}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; background: white; padding: 8mm; }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4; margin: 8mm; }
          }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-4">

        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-base font-bold text-neutral-800">Parcel Label</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{parcel.trackingId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint}
              className="flex items-center gap-2 bg-[#ea690c] text-white hover:bg-[#d45e0a] h-9 px-4">
              <Printer className="w-4 h-4" /> Print Label
            </Button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-800 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Label preview */}
        <div className="p-5" ref={labelRef}>
          <PartnerParcelLabel parcel={parcel} />
        </div>
      </div>
    </div>
  );
};
