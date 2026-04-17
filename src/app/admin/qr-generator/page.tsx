"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Download, Sparkles, Smartphone, AlertTriangle } from "lucide-react";

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
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/guests")
      .then((r) => r.json())
      .then((data) => { setGuests(data); setLoadingGuests(false); });
  }, []);

  const generateQRs = async () => {
    setGenerating(true);
    const result: Record<string, string> = {};
    for (const guest of guests) {
      const url = `${origin}/api/scan?id=${guest.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      });
      result[guest.id] = dataUrl;
    }
    setQrImages(result);
    setGenerating(false);
    toast.success(`${guests.length} QR codes generados`);
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
    const rowHeight = qrSize + 20;

    let col = 0;
    let currentY = padding;

    guests.forEach((guest, idx) => {
      const img = qrImages[guest.id];
      if (!img) return;

      if (idx > 0 && col === 0 && currentY + rowHeight > pageHeight - padding) {
        doc.addPage();
        currentY = padding;
      }

      const x = padding + col * colWidth + (colWidth - qrSize) / 2;
      doc.addImage(img, "PNG", x, currentY, qrSize, qrSize);

      doc.setFontSize(8);
      doc.setTextColor(30, 30, 60);
      doc.text(`${guest.name} ${guest.lastName}`, x + qrSize / 2, currentY + qrSize + 5, { align: "center" });
      doc.setFontSize(7);
      doc.setTextColor(120, 100, 180);
      doc.text(`Mesa ${guest.table.number}`, x + qrSize / 2, currentY + qrSize + 10, { align: "center" });

      col++;
      if (col >= cols) {
        col = 0;
        currentY += rowHeight;
      }
    });

    doc.save("qr-invitados.pdf");
    setDownloading(false);
    toast.success("PDF descargado");
  };

  const qrCount = Object.keys(qrImages).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 text-xs font-bold flex items-center justify-center">3</span>
          <h2 className="text-2xl font-bold text-white">QR Codes</h2>
        </div>
        <p className="text-slate-300 text-sm ml-10">
          Generá los códigos QR y descargalos en PDF para imprimir en las pulseras.
        </p>
      </div>

      <div className="glass glow-blue overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] to-transparent pointer-events-none" />
        <div className="relative pt-6 pb-5 px-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p className="font-semibold text-blue-300">Cómo escanear el día del evento</p>
            <p>
              Los QRs contienen la URL del servidor{origin && (
                <> (<code className="text-xs bg-blue-500/15 text-blue-300 px-1 py-0.5 rounded">{origin}</code>)</>
              )}.
              Apuntá la <strong className="text-white">cámara del celular</strong> a la pulsera —
              funciona en cualquier dispositivo sin apps ni permisos especiales.
            </p>
          </div>
        </div>
      </div>

      {!loadingGuests && guests.length === 0 ? (
        <div className="glass glow-amber overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent pointer-events-none" />
          <div className="relative pt-6 pb-5 px-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">Sin invitados</p>
              <p className="text-amber-400/80 text-sm mt-1">Primero agregá invitados en el <strong className="text-amber-300">Paso 2</strong>.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Card className="glass glow-violet overflow-hidden relative border-white/[0.14]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-violet-600" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <QrCode className="w-5 h-5 text-violet-400" />
                Generar y descargar
              </CardTitle>
              <CardDescription className="text-slate-300">
                {loadingGuests ? "Cargando..." : `${guests.length} invitados cargados`}
                {qrCount > 0 && ` · ${qrCount} QRs generados`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button
                onClick={generateQRs}
                disabled={generating || loadingGuests}
                className="gap-2 w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "Generando..." : "Generar QRs"}
              </Button>

              {qrCount > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Generando PDF..." : "Descargar PDF"}
                </Button>
              )}
            </CardContent>
          </Card>

          {generating && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(Math.min(guests.length, 8))].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl bg-white/[0.12]" />
              ))}
            </div>
          )}

          {qrCount > 0 && !generating && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Vista previa
                </h3>
                <Badge className="text-xs bg-violet-500/15 text-violet-400 border-0">{qrCount} QRs</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {guests.map((guest) => (
                  <Card
                    key={guest.id}
                    className="glass glass-hover overflow-hidden border-white/[0.14]"
                  >
                    <CardContent className="p-3 flex flex-col items-center text-center">
                      {qrImages[guest.id] ? (
                        <img
                          src={qrImages[guest.id]}
                          alt={`QR ${guest.name}`}
                          className="w-20 h-20 rounded"
                        />
                      ) : (
                        <Skeleton className="w-20 h-20 rounded bg-white/[0.12]" />
                      )}
                      <p className="text-xs font-medium text-white mt-2 leading-tight">
                        {guest.name} {guest.lastName}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1 border-white/[0.16] text-slate-300">
                        Mesa {guest.table.number}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
