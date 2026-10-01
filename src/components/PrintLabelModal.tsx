import React, { useRef, useState } from "react";
import { PrinterIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import { ParcelLabel, ParcelLabelData, PrinterSize, PRINTER_SIZES, getPrintPageStyle } from "./ParcelLabel";

interface PrintLabelModalProps {
  parcels: ParcelLabelData[];
  onClose: () => void;
  title?: string;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({ parcels, onClose, title }) => {
  const [printerSize, setPrinterSize] = useState<PrinterSize>("A4");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Parcel Label</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { background: white; font-family: Arial, sans-serif; }
            .page-break { page-break-after: always; break-after: page; }
            ${getPrintPageStyle(printerSize)}
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-3xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d1d1d1] flex-shrink-0">
          <h3 className="text-base font-bold text-neutral-800">
            {title || `Print ${parcels.length} Label${parcels.length > 1 ? "s" : ""}`}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-[#9a9a9a] hover:text-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printer size selector */}
        <div className="px-5 py-3 border-b border-[#d1d1d1] flex-shrink-0">
          <p className="text-xs font-semibold text-neutral-700 mb-2">Printer Size</p>
          <div className="flex flex-wrap gap-2">
            {PRINTER_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setPrinterSize(s.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  printerSize === s.value
                    ? "border-[#ea690c] bg-orange-50 text-[#ea690c]"
                    : "border-[#d1d1d1] text-neutral-600 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold">{s.label}</span>
                <span className="ml-1 text-[10px] opacity-70">({s.description})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto flex-1 p-5 bg-gray-50">
          <div ref={printRef} className="space-y-4">
            {parcels.map((parcel, idx) => (
              <div key={parcel.parcelId}>
                <ParcelLabel parcel={parcel} size={printerSize} />
                {idx < parcels.length - 1 && (
                  <div className="page-break border-t border-dashed border-gray-300 my-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#d1d1d1] flex-shrink-0 flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" className="border border-[#d1d1d1]">Close</Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
            <PrinterIcon className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
