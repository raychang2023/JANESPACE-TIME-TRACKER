import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const siteUrl = `${origin}/site-scan`;
  const buffer = await QRCode.toBuffer(siteUrl, {
    type: "png",
    width: 900,
    margin: 2,
    color: { dark: "#0b1f3a", light: "#ffffff" }
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition":
        new URL(request.url).searchParams.get("inline") === "1"
          ? 'inline; filename="janespace-site-clock-qr.png"'
          : 'attachment; filename="janespace-site-clock-qr.png"'
    }
  });
}
