import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Uploads go straight from the browser to Blob storage (see media-compress.ts / admin/tables
// page): serverless functions on Vercel cap the request body at ~4.5MB, which is too small
// for uncompressed videos like WhatsApp exports.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({}),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir el video" },
      { status: 400 },
    );
  }
}
