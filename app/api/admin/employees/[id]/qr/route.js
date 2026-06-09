import QRCode from "qrcode";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const employee = getDb().prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const scanUrl = `${origin}/scan/${employee.token}`;
  const buffer = await QRCode.toBuffer(scanUrl, {
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
          ? `inline; filename="${employee.employeeCode}-qr.png"`
          : `attachment; filename="${employee.employeeCode}-qr.png"`
    }
  });
}
