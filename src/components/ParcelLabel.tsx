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
  return (
    <div className="bg-white border-2 border-black p-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1.5">
        <div className="w-10" />
        <div className="flex items-center gap-2">
          <img src="/logo-1.png" alt="M&M Logo" className="h-8 w-8 object-contain" crossOrigin="anonymous" />
          <div>
            <h1 className="text-sm font-bold text-black leading-tight">Mealex &amp; Mailex (M&amp;M)</h1>
            <p className="text-xs text-black">Parcel Delivery System</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <QRCodeSVG value={qrValue} size={72} level="H" includeMargin={false} />
          <p className="text-[9px] text-black mt-0.5">Scan to Track</p>
        </div>
      </div>

      {/* Tracking Number */}
      <div className="text-center mb-1.5 bg-black text-white py-1 px-3">
        <p className="text-[9px] font-semibold">TRACKING NUMBER</p>
        <p className="text-sm font-bold tracking-wider">{trackingId}</p>
      </div>

      {/* Sender & Receiver */}
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <div className="border-2 border-black p-1">
          <p className="text-xs text-black"><span className="font-bold">SENDER:</span> {parcel.senderName || "—"}</p>
          <p className="text-xs text-black"><span className="font-bold">CONTACT:</span> {parcel.senderPhoneNumber || "—"}</p>
        </div>
        <div className="border-2 border-black p-1">
          <p className="text-xs text-black"><span className="font-bold">RECEIVER:</span> {parcel.receiverName || "—"}</p>
          <p className="text-xs text-black"><span className="font-bold">CONTACT:</span> {parcel.recieverPhoneNumber || "—"}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {parcel.receiverAddress && (
        <div className="border-2 border-black p-1 mb-1.5">
          <p className="text-xs text-black"><span className="font-bold">DELIVERY ADDRESS:</span> {parcel.receiverAddress}</p>
        </div>
      )}

      {/* Item Description */}
      {parcel.parcelDescription && (
        <div className="border-2 border-black p-1 mb-1.5">
          <p className="text-xs text-black"><span className="font-bold">ITEM DESCRIPTION:</span> {parcel.parcelDescription}</p>
        </div>
      )}

      {/* Driver / Vehicle */}
      {(parcel.driverName || parcel.vehicleNumber) && (
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {parcel.vehicleNumber && (
            <div className="border-2 border-black p-1">
              <p className="text-xs text-black"><span className="font-bold">VEHICLE:</span> {parcel.vehicleNumber}</p>
            </div>
          )}
          {parcel.driverName && (
            <div className="border-2 border-black p-1">
              <p className="text-xs text-black"><span className="font-bold">DRIVER:</span> {parcel.driverName}</p>
              {parcel.driverPhoneNumber && <p className="text-xs text-black">{parcel.driverPhoneNumber}</p>}
            </div>
          )}
        </div>
      )}

      {/* Payment Details */}
      <div className="border-2 border-black p-1 mb-1.5">
        <p className="text-xs font-bold text-black mb-0.5">PAYMENT DETAILS</p>
        <div className="text-xs">
          {(parcel.inboundCost || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Transportation Cost:</span>
              <span className="font-semibold text-black">GHC {(parcel.inboundCost || 0).toFixed(2)}</span>
            </div>
          )}
          {(parcel.deliveryCost || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Delivery Cost:</span>
              <span className="font-semibold text-black">GHC {(parcel.deliveryCost || 0).toFixed(2)}</span>
            </div>
          )}
          {(parcel.pickUpCost || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Pickup Cost:</span>
              <span className="font-semibold text-black">GHC {(parcel.pickUpCost || 0).toFixed(2)}</span>
            </div>
          )}
          {isPOD && (parcel.ItemCost || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Item Cost (POD):</span>
              <span className="font-semibold text-black">GHC {(parcel.ItemCost || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-0.5 mt-0.5">
            <span className="font-bold text-black">TOTAL AMOUNT:</span>
            <span className="font-bold text-black">GHC {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* POD Badge */}
      {isPOD && (
        <div className="text-center mb-1.5">
          <span className="inline-block bg-black text-white px-3 py-0.5 text-xs font-bold">POD PARCEL</span>
        </div>
      )}

      {/* Barcode */}
      <div className="flex justify-center mb-1">
        <Barcode
          value={trackingId}
          width={1.4}
          height={36}
          fontSize={9}
          margin={0}
          displayValue
          background="white"
          lineColor="black"
        />
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-black text-center">
        <p className="text-[9px] text-black">
          Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()} | M&amp;M Parcel Services
        </p>
      </div>
    </div>
  );
};
