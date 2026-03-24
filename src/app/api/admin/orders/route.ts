import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { sendOrderShippedEmail } from "@/lib/order-email";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const status = body.status as string | undefined;
    const trackingNumber = body.trackingNumber as string | null | undefined;
    const carrier = body.carrier as string | null | undefined;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data: {
      status?: string;
      trackingNumber?: string | null;
      carrier?: string | null;
    } = {};

    if (status) data.status = status;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
    if (carrier !== undefined) data.carrier = carrier;

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { user: { select: { email: true } } },
    });

    const becameShipped =
      updated.status === "shipped" && existing.status !== "shipped";
    if (becameShipped && updated.user?.email) {
      const emailResult = await sendOrderShippedEmail(updated.user.email, {
        orderId: updated.id,
        shippingName: updated.shippingName,
        trackingNumber: updated.trackingNumber,
        carrier: updated.carrier,
      });
      return NextResponse.json({
        ok: true,
        shippedEmailSent: emailResult.sent,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

