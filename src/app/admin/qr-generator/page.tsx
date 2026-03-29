"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QrCode, Download, Sparkles, AlertTriangle } from "lucide-react";

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
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [origin, setOrigin] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const o = window.location.origin;
    setOrigin(o);
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
    fetch("/api/guests")
      .then((r) => r.json())
      .then((data) => { setGuests(data); setLoadingGuests(false); });
  }, []);

  const generateQRs = async () => {
    if (isLocalhost) {
      toast.error("Accedé al admin por IP antes de generar los QRs");
      return;
    }
    setGenerating(true);
    const result: Record<string, string> = {};
    for (const guest of guests) {
      // QR encodes a full URL so any phone camera can scan without extra apps
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Paso 3 · QR Codes</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Generá los códigos QR y descargalos en PDF para imprimir en las pulseras.
        </p>
      </div>

      {/* Warning: localhost detected */}
      {isLocalhost && (
        <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-4 pb-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Estás accediendo por <code>localhost</code></p>
              <p>
                Los QRs se generarían con una URL que los celulares no pueden abrir.
                <br />
                Antes de generar los QRs, abrí el admin usando la <strong>IP de esta PC</strong>:
              </p>
              <p className="font-mono bg-amber-100 dark:bg-amber-900 rounded px-2 py-1 text-xs mt-1">
                http://&lt;IP-de-esta-PC&gt;:3000/admin/qr-generator
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Para saber la IP: abrí <strong>cmd</strong> → escribí <code>ipconfig</code> → buscá <strong>IPv4 Address</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info: how scanning works */}
      {!isLocalhost && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-4 flex gap-3 items-start">
            <span className="text-xl shrink-0">📱</span>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Cómo escanear el día de la fiesta</p>
              <p>
                Los QRs contienen la URL del servidor (<code className="text-xs">{origin}</code>).
                Apuntá la <strong>cámara del celular</strong> a la pulsera —
                aparece una notificación para abrir el link. Funciona en cualquier dispositivo sin apps ni permisos especiales.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingGuests && guests.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-amber-700 text-sm">
            ⚠️ Primero agregá invitados en el <strong>Paso 2</strong>.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Generar y descargar
              </CardTitle>
              <CardDescription>
                {loadingGuests ? "Cargando..." : `${guests.length} invitados cargados`}
                {qrCount > 0 && ` · ${qrCount} QRs generados`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={generateQRs}
                disabled={generating || loadingGuests || isLocalhost}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "Generando..." : "Generar QRs"}
              </Button>

              {qrCount > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Generando PDF..." : "Descargar PDF"}
                </Button>
              )}
            </CardContent>
          </Card>

          {generating && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {[...Array(Math.min(guests.length, 8))].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          )}

          {qrCount > 0 && !generating && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Vista previa
                </h3>
                <Badge variant="secondary">{qrCount} QRs</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {guests.map((guest) => (
                  <Card
                    key={guest.id}
                    className="hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <CardContent className="p-3 flex flex-col items-center text-center">
                      {qrImages[guest.id] ? (
                        <img
                          src={qrImages[guest.id]}
                          alt={`QR ${guest.name}`}
                          className="w-20 h-20 rounded"
                        />
                      ) : (
                        <Skeleton className="w-20 h-20 rounded" />
                      )}
                      <p className="text-xs font-medium text-foreground mt-2 leading-tight">
                        {guest.name} {guest.lastName}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Mesa {guest.table.number}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
