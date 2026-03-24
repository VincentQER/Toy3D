import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    addresses.map((a) => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      address: a.address,
      isDefault: a.isDefault,
    }))
  );
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = body.id as string | undefined;
  const name = (body.name as string | undefined)?.trim();
  const phone = (body.phone as string | undefined)?.trim();
  const address = (body.address as string | undefined)?.trim();
  const isDefault = body.isDefault as boolean | undefined;

  if (!id && (!name || !phone || !address)) {
    return NextResponse.json(
      { error: "name, phone and address are required for new address" },
      { status: 400 }
    );
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  if (id) {
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
        address: address ?? existing.address,
        isDefault: isDefault ?? existing.isDefault,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      isDefault: updated.isDefault,
    });
  }

  const created = await prisma.address.create({
    data: {
      userId: user.id,
      name: name!,
      phone: phone!,
      address: address!,
      isDefault: isDefault ?? false,
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      name: created.name,
      phone: created.phone,
      address: created.address,
      isDefault: created.isDefault,
    },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

