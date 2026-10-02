import React from "react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

export type PrinterSize = "A4" | "thermal_80mm" | "thermal_58mm" | "thermal_4x6" | "label_100x150";

export interface ParcelLabelData {
  parcelId: string;
  barCode?: string;
  senderName?: string;
  senderPhoneNumber?: string;
  receiverName?: string;
  recieverPhoneNumber?: string;
  receiverAddress?: string;
  parcelDescription?: string;
  driverName?: string;
  driverPhoneNumber?: string;
  vehicleNumber?: string;
  inboundCost?: number;
  deliveryCost?: number;
  pickUpCost?: number;
  ItemCost?: number;
  pod?: boolean;
  POD?: boolean;
}

export const PRINTER_SIZES: { value: PrinterSize; label: string; description: string }[] = [
  { value: "A4",           label: "A4 Paper",       description: "Standard A4 (210 × 297mm)" },
  { value: "thermal_80mm", label: "Thermal 80mm",   description: "80mm wide thermal roll" },
  { value: "thermal_58mm", label: "Thermal 58mm",   description: "58mm wide thermal roll" },
  { value: "thermal_4x6",  label: "Thermal 4×6\"",  description: "4×6 inch shipping label" },
  { value: "label_100x150", label: "100 × 150mm",   description: "100×150mm shipping label" },
];

export const getPrintPageStyle = (size: PrinterSize): string => {
  switch (size) {
    case "thermal_80mm":   return "@page { size: 80mm auto; margin: 2mm; }";
    case "thermal_58mm":   return "@page { size: 58mm auto; margin: 1mm; }";
    case "thermal_4x6":    return "@page { size: 4in 6in; margin: 3mm; }";
    case "label_100x150":  return "@page { size: 100mm 150mm; margin: 3mm; }";
    default:               return "@page { size: A4 portrait; margin: 6mm; }";
  }
};

interface ParcelLabelProps {
  parcel: ParcelLabelData;
  size?: PrinterSize;
}

export const ParcelLabel: React.FC<ParcelLabelProps> = ({ parcel, size = "A4" }) => {
  const isThermal = size !== "A4" && size !== "label_100x150";
  const is58mm = size === "thermal_58mm";
  const trackingId = parcel.barCode || parcel.parcelId;
  const qrValue = `${window.location.origin}/p/${parcel.parcelId}`;
  const isPOD = parcel.pod || parcel.POD;
  const totalAmount =
    (parcel.inboundCost || 0) +
    (parcel.deliveryCost || 0) +
    (parcel.pickUpCost || 0) +
    (isPOD ? (parcel.ItemCost || 0) : 0);

  if (isThermal) {
    // Compact thermal layout — single column, no grid
    return (
      <div
        className="bg-white border border-black"
        style={{ width: is58mm ? "54mm" : "76mm", padding: "2mm", fontFamily: "monospace" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "1px solid black", paddingBottom: "2mm", marginBottom: "2mm" }}>
          <img src="/logo-1.png" alt="M&M" style={{ height: "20px", margin: "0 auto 2px" }} />
          <div style={{ fontSize: is58mm ? "8px" : "9px", fontWeight: "bold" }}>Mealex &amp; Mailex (M&amp;M)</div>
          <div style={{ fontSize: "7px" }}>Parcel Delivery System</div>
        </div>

        {/* Tracking */}
        <div style={{ textAlign: "center", background: "black", color: "white", padding: "2mm", marginBottom: "2mm" }}>
          <div style={{ fontSize: "7px" }}>TRACKING NUMBER</div>
          <div style={{ fontSize: is58mm ? "9px" : "11px", fontWeight: "bold", letterSpacing: "0.05em" }}>{trackingId}</div>
        </div>

        {/* Sender */}
        <div style={{ fontSize: "8px", borderBottom: "1px solid black", paddingBottom: "1mm", marginBottom: "1mm" }}>
          <div><strong>SENDER:</strong> {parcel.senderName || "—"}</div>
          <div><strong>TEL:</strong> {parcel.senderPhoneNumber || "—"}</div>
        </div>

        {/* Receiver */}
        <div style={{ fontSize: "8px", borderBottom: "1px solid black", paddingBottom: "1mm", marginBottom: "1mm" }}>
          <div><strong>RECEIVER:</strong> {parcel.receiverName || "—"}</div>
          <div><strong>TEL:</strong> {parcel.recieverPhoneNumber || "—"}</div>
          {parcel.receiverAddress && <div><strong>ADDR:</strong> {parcel.receiverAddress}</div>}
        </div>

        {/* Description */}
        {parcel.parcelDescription && (
          <div style={{ fontSize: "8px", borderBottom: "1px solid black", paddingBottom: "1mm", marginBottom: "1mm" }}>
            <strong>ITEM:</strong> {parcel.parcelDescription}
          </div>
        )}

        {/* Payment */}
        <div style={{ fontSize: "8px", borderBottom: "1px solid black", paddingBottom: "1mm", marginBottom: "1mm" }}>
          {(parcel.inboundCost || 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Transport:</span><span>GHC {(parcel.inboundCost || 0).toFixed(2)}</span>
            </div>
          )}
          {(parcel.deliveryCost || 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery:</span><span>GHC {(parcel.deliveryCost || 0).toFixed(2)}</span>
            </div>
          )}
          {isPOD && (parcel.ItemCost || parcel.pickUpCost || 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Item (POD):</span><span>GHC {(parcel.ItemCost || parcel.pickUpCost || 0).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px solid black", paddingTop: "1mm", marginTop: "1mm" }}>
            <span>TOTAL:</span><span>GHC {totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {isPOD && (
          <div style={{ textAlign: "center", background: "black", color: "white", fontSize: "8px", fontWeight: "bold", padding: "1mm", marginBottom: "2mm" }}>
            POD PARCEL
          </div>
        )}

        {/* Barcode */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1mm" }}>
          <Barcode
            value={trackingId}
            width={is58mm ? 1 : 1.2}
            height={28}
            fontSize={7}
            margin={0}
            displayValue
            background="white"
            lineColor="black"
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "7px", borderTop: "1px solid black", paddingTop: "1mm" }}>
          {new Date().toLocaleDateString()} | M&amp;M Parcel Services
        </div>
      </div>
    );
  }

  // A4 / 4×6 layout — full featured with QR code
  const a: Record<string, React.CSSProperties> = {
    wrap:       { backgroundColor: '#fff', border: '2px solid #000', padding: '8px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000' },
    header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' },
    headerMid:  { display: 'flex', alignItems: 'center', gap: '8px' },
    logo:       { height: '32px', width: '32px', objectFit: 'contain' },
    h1:         { fontSize: '13px', fontWeight: 'bold', color: '#000', margin: 0 },
    sub:        { fontSize: '11px', color: '#000', margin: 0 },
    qrWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    qrLabel:    { fontSize: '9px', color: '#000', marginTop: '2px' },
    trackBar:   { textAlign: 'center', backgroundColor: '#000', color: '#fff', padding: '4px 12px', marginBottom: '8px' },
    trackLabel: { fontSize: '9px', fontWeight: 'bold', margin: 0 },
    trackNum:   { fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 },
    grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' },
    box:        { border: '2px solid #000', padding: '4px' },
    boxFull:    { border: '2px solid #000', padding: '4px', marginBottom: '6px' },
    row:        { display: 'flex', justifyContent: 'space-between' },
    txt:        { fontSize: '11px', color: '#000', margin: '1px 0' },
    bold:       { fontWeight: 'bold' },
    divider:    { borderTop: '2px solid #000', paddingTop: '2px', marginTop: '2px' },
    podBadge:   { textAlign: 'center', marginBottom: '6px' },
    podSpan:    { display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '2px 12px', fontSize: '11px', fontWeight: 'bold' },
    bcWrap:     { display: 'flex', justifyContent: 'center', marginBottom: '4px' },
    footer:     { borderTop: '1px solid #000', paddingTop: '4px', textAlign: 'center' },
    footerTxt:  { fontSize: '9px', color: '#000', margin: 0 },
  };

  return (
    <div style={a.wrap}>
      {/* Header */}
      <div style={a.header}>
        <div style={{ width: '40px' }} />
        <div style={a.headerMid}>
          <img src="/logo-1.png" alt="M&M Logo" style={a.logo} crossOrigin="anonymous" />
          <div>
            <p style={a.h1}>Mealex &amp; Mailex (M&amp;M)</p>
            <p style={a.sub}>Parcel Delivery System</p>
          </div>
        </div>
        <div style={a.qrWrap}>
          <QRCodeSVG value={qrValue} size={72} level="H" includeMargin={false} />
          <p style={a.qrLabel}>Scan to Track</p>
        </div>
      </div>

      {/* Tracking Number */}
      <div style={a.trackBar}>
        <p style={a.trackLabel}>TRACKING NUMBER</p>
        <p style={a.trackNum}>{trackingId}</p>
      </div>

      {/* Sender & Receiver */}
      <div style={a.grid2}>
        <div style={a.box}>
          <p style={a.txt}><span style={a.bold}>SENDER:</span> {parcel.senderName || '—'}</p>
          <p style={a.txt}><span style={a.bold}>CONTACT:</span> {parcel.senderPhoneNumber || '—'}</p>
        </div>
        <div style={a.box}>
          <p style={a.txt}><span style={a.bold}>RECEIVER:</span> {parcel.receiverName || '—'}</p>
          <p style={a.txt}><span style={a.bold}>CONTACT:</span> {parcel.recieverPhoneNumber || '—'}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {parcel.receiverAddress && (
        <div style={a.boxFull}>
          <p style={a.txt}><span style={a.bold}>DELIVERY ADDRESS:</span> {parcel.receiverAddress}</p>
        </div>
      )}

      {/* Item Description */}
      {parcel.parcelDescription && (
        <div style={a.boxFull}>
          <p style={a.txt}><span style={a.bold}>ITEM DESCRIPTION:</span> {parcel.parcelDescription}</p>
        </div>
      )}

      {/* Driver / Vehicle */}
      {(parcel.driverName || parcel.vehicleNumber) && (
        <div style={a.grid2}>
          {parcel.vehicleNumber && (
            <div style={a.box}>
              <p style={a.txt}><span style={a.bold}>VEHICLE:</span> {parcel.vehicleNumber}</p>
            </div>
          )}
          {parcel.driverName && (
            <div style={a.box}>
              <p style={a.txt}><span style={a.bold}>DRIVER:</span> {parcel.driverName}</p>
              {parcel.driverPhoneNumber && <p style={a.txt}>{parcel.driverPhoneNumber}</p>}
            </div>
          )}
        </div>
      )}

      {/* Payment Details */}
      <div style={{ ...a.boxFull, marginTop: '6px' }}>
        <p style={{ ...a.txt, ...a.bold, marginBottom: '2px' }}>PAYMENT DETAILS</p>
        {(parcel.inboundCost || 0) > 0 && (
          <div style={a.row}><span style={a.txt}>Transportation Cost:</span><span style={{ ...a.txt, ...a.bold }}>GHC {(parcel.inboundCost || 0).toFixed(2)}</span></div>
        )}
        {(parcel.deliveryCost || 0) > 0 && (
          <div style={a.row}><span style={a.txt}>Delivery Cost:</span><span style={{ ...a.txt, ...a.bold }}>GHC {(parcel.deliveryCost || 0).toFixed(2)}</span></div>
        )}
        {(parcel.pickUpCost || 0) > 0 && (
          <div style={a.row}><span style={a.txt}>Pickup Cost:</span><span style={{ ...a.txt, ...a.bold }}>GHC {(parcel.pickUpCost || 0).toFixed(2)}</span></div>
        )}
        {isPOD && (parcel.ItemCost || 0) > 0 && (
          <div style={a.row}><span style={a.txt}>Item Cost (POD):</span><span style={{ ...a.txt, ...a.bold }}>GHC {(parcel.ItemCost || 0).toFixed(2)}</span></div>
        )}
        <div style={{ ...a.row, ...a.divider }}>
          <span style={{ ...a.txt, ...a.bold }}>TOTAL AMOUNT:</span>
          <span style={{ ...a.txt, ...a.bold }}>GHC {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* POD Badge */}
      {isPOD && (
        <div style={a.podBadge}>
          <span style={a.podSpan}>POD PARCEL</span>
        </div>
      )}

      {/* Barcode */}
      <div style={a.bcWrap}>
        <Barcode value={trackingId} width={1.4} height={36} fontSize={9} margin={0} displayValue background="white" lineColor="black" />
      </div>

      {/* Footer */}
      <div style={a.footer}>
        <p style={a.footerTxt}>Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()} | M&amp;M Parcel Services</p>
      </div>
    </div>
  );
};
