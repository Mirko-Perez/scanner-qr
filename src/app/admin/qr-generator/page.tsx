"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";

type Guest = {
  id: string;
  name: string;
  lastName: string;
  table: { number: number; name: string | null };
};

export default function QRGeneratorPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/guests")
      .then((r) => r.json())
      .then(setGuests);
  }, []);

  const generateQRs = async () => {
    setGenerating(true);
    const result: Record<string, string> = {};
    for (const guest of guests) {
      const dataUrl = await QRCode.toDataURL(guest.id, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      });
      result[guest.id] = dataUrl;
    }
    setQrImages(result);
    setGenerating(false);
  };

  const downloadPDF = async () => {
    if (Object.keys(qrImages).length === 0) return;
    setDownloading(true);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = 210;
    const pageHeight = 297;
    const qrSize = 60;
    const padding = 10;
    const cols = 3;
    const colWidth = (pageWidth - padding * 2) / cols;
    const rowHeight = qrSize + 18;

    let col = 0;
    let row = 0;

    guests.forEach((guest, idx) => {
      const img = qrImages[guest.id];
      if (!img) return;

      const x = padding + col * colWidth + (colWidth - qrSize) / 2;
      const y = padding + row * rowHeight;

      if (y + rowHeight > pageHeight - padding && idx > 0) {
        doc.addPage();
        row = 0;
        col = 0;
      }

      const freshY = padding + row * rowHeight;
      doc.addImage(img, "PNG", x, freshY, qrSize, qrSize);

      doc.setFontSize(8);
      doc.setTextColor(30, 30, 60);
      const fullName = `${guest.name} ${guest.lastName}`;
      doc.text(fullName, x + qrSize / 2, freshY + qrSize + 4, { align: "center" });
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 140);
      doc.text(`Mesa ${guest.table.number}`, x + qrSize / 2, freshY + qrSize + 9, {
        align: "center",
      });

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    });

    doc.save("qr-invitados.pdf");
    setDownloading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 3 · QR Codes</h2>
        <p className="text-gray-500 text-sm mt-1">
          Generá los códigos QR para cada invitado y descargalos en PDF para imprimir en las pulseras.
        </p>
      </div>

      {guests.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-700 text-sm">
          ⚠️ Primero agregá invitados en el <strong>Paso 2</strong>.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold text-gray-700">{guests.length} invitados cargados</p>
              <p className="text-sm text-gray-400">
                {Object.keys(qrImages).length > 0
                  ? `${Object.keys(qrImages).length} QRs generados`
                  : "Hacé clic en Generar para crear los QRs"}
              </p>
            </div>
            <button
              onClick={generateQRs}
              disabled={generating}
              className="bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generando..." : "Generar QRs"}
            </button>
            {Object.keys(qrImages).length > 0 && (
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {downloading ? "Generando PDF..." : "⬇ Descargar PDF"}
              </button>
            )}
          </div>

          {Object.keys(qrImages).length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center text-center"
                >
                  {qrImages[guest.id] ? (
                    <img
                      src={qrImages[guest.id]}
                      alt={`QR ${guest.name}`}
                      className="w-20 h-20"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded" />
                  )}
                  <p className="text-xs font-medium text-gray-700 mt-2 leading-tight">
                    {guest.name} {guest.lastName}
                  </p>
                  <p className="text-xs text-gray-400">Mesa {guest.table.number}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
