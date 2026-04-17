"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Download, Sparkles, Smartphone, AlertTriangle } from "lucide-react";

type Table = { id: number; number: number; name: string | null };

export default function QRMesasPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [qrImages, setQrImages] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/tables")
      .then((r) => r.json())
      .then((data) => { setTables(data); setLoadingTables(false); });
  }, []);

  const generateQRs = async () => {
    setGenerating(true);
    const result: Record<number, string> = {};
    for (const table of tables) {
      const url = `${origin}/recuerdos/subir?mesa=${table.number}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      });
      result[table.id] = dataUrl;
    }
    setQrImages(result);
    setGenerating(false);
    toast.success(`${tables.length} QR codes generados`);
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

    tables.forEach((table, idx) => {
      const img = qrImages[table.id];
      if (!img) return;

      if (idx > 0 && col === 0 && currentY + rowHeight > pageHeight - padding) {
        doc.addPage();
        currentY = padding;
      }

      const x = padding + col * colWidth + (colWidth - qrSize) / 2;
      doc.addImage(img, "PNG", x, currentY, qrSize, qrSize);

      doc.setFontSize(9);
      doc.setTextColor(30, 30, 60);
      doc.text(`Mesa ${table.number}`, x + qrSize / 2, currentY + qrSize + 5, { align: "center" });

      if (table.name) {
        doc.setFontSize(7);
        doc.setTextColor(120, 100, 180);
        doc.text(table.name, x + qrSize / 2, currentY + qrSize + 10, { align: "center" });
      }

      col++;
      if (col >= cols) {
        col = 0;
        currentY += rowHeight;
      }
    });

    doc.save("qr-mesas.pdf");
    setDownloading(false);
    toast.success("PDF descargado");
  };

  const qrCount = Object.keys(qrImages).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">5</span>
          <h2 className="text-2xl font-bold text-foreground">QR de Mesas</h2>
        </div>
        <p className="text-muted-foreground text-sm ml-10">
          Generá los QR para las mesas. Los invitados los escanean para subir fotos y mensajes.
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50/50 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <CardContent className="pt-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-semibold">Cómo funciona</p>
            <p>
              Cada QR abre la página de subida de recuerdos para esa mesa específica{origin && (
                <> (<code className="text-xs bg-blue-100 px-1 py-0.5 rounded">{origin}</code>)</>
              )}.
              Los invitados escanean el código con la <strong>cámara del celular</strong> y
              pueden subir fotos y mensajes sin necesidad de apps ni registros.
            </p>
          </div>
        </CardContent>
      </Card>

      {!loadingTables && tables.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Sin mesas</p>
              <p className="text-amber-700 text-sm mt-1">Primero creá mesas en el <strong>Paso 1</strong>.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-violet-600" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-violet-600" />
                Generar y descargar
              </CardTitle>
              <CardDescription>
                {loadingTables ? "Cargando..." : `${tables.length} mesas cargadas`}
                {qrCount > 0 && ` · ${qrCount} QRs generados`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button
                onClick={generateQRs}
                disabled={generating || loadingTables}
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
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Generando PDF..." : "Descargar PDF"}
                </Button>
              )}
            </CardContent>
          </Card>

          {generating && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(Math.min(tables.length, 8))].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          )}

          {qrCount > 0 && !generating && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Vista previa
                </h3>
                <Badge variant="secondary" className="text-xs">{qrCount} QRs</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {tables.map((table) => (
                  <Card
                    key={table.id}
                    className="hover:shadow-md transition-all overflow-hidden"
                  >
                    <CardContent className="p-3 flex flex-col items-center text-center">
                      {qrImages[table.id] ? (
                        <img
                          src={qrImages[table.id]}
                          alt={`QR Mesa ${table.number}`}
                          className="w-20 h-20 rounded"
                        />
                      ) : (
                        <Skeleton className="w-20 h-20 rounded" />
                      )}
                      <p className="text-xs font-medium text-foreground mt-2 leading-tight">
                        Mesa {table.number}
                      </p>
                      {table.name && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {table.name}
                        </Badge>
                      )}
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
