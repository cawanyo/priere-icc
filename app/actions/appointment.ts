"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addMinutes, startOfDay, endOfDay } from "date-fns";

async function getSession() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  return session.user as { id: string; role: string };
}

async function checkLeaderAccess() {
  const user = await getSession();
  const db = await prisma.user.findUnique({ where: { id: user.id } });
  if (!db || !["LEADER", "ADMIN"].includes(db.role)) throw new Error("Accès refusé");
  return db;
}

// ── LEADER ──────────────────────────────────────────────────────

// Ajouter des créneaux pour une plage horaire (génère des slots de 30 min)
export async function addAvailabilityRange(startISO: string, endISO: string) {
  const leader = await checkLeaderAccess();

  const start = new Date(startISO);
  const end   = new Date(endISO);

  const slots: { leaderId: string; startTime: Date; endTime: Date }[] = [];
  let cursor = start;
  while (cursor < end) {
    const slotEnd = addMinutes(cursor, 30);
    if (slotEnd > end) break;
    slots.push({ leaderId: leader.id, startTime: new Date(cursor), endTime: new Date(slotEnd) });
    cursor = slotEnd;
  }

  if (slots.length === 0) throw new Error("La plage doit couvrir au moins 30 minutes.");

  await prisma.appointmentSlot.createMany({ data: slots, skipDuplicates: true });
  revalidatePath("/dashboard/mobile/leader/rdv");
  return { count: slots.length };
}

// Supprimer un créneau libre
export async function deleteSlot(slotId: string) {
  const leader = await checkLeaderAccess();
  const slot = await prisma.appointmentSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.leaderId !== leader.id) throw new Error("Créneau introuvable");
  if (slot.isBooked) throw new Error("Ce créneau est déjà réservé — annulez le RDV d'abord.");
  await prisma.appointmentSlot.delete({ where: { id: slotId } });
  revalidatePath("/dashboard/mobile/leader/rdv");
}

// Récupérer les créneaux du leader (passés + futurs)
export async function getMySlots(fromISO?: string) {
  const leader = await checkLeaderAccess();
  const from = fromISO ? new Date(fromISO) : new Date();
  return prisma.appointmentSlot.findMany({
    where: { leaderId: leader.id, startTime: { gte: startOfDay(from) } },
    include: {
      appointment: {
        include: { user: { select: { id: true, name: true, image: true, phone: true } } },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

// Annuler un RDV (côté leader)
export async function cancelAppointmentLeader(appointmentId: string, reason: string) {
  const leader = await checkLeaderAccess();
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.leaderId !== leader.id) throw new Error("RDV introuvable");
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancelReason: reason },
  });
  await prisma.appointmentSlot.update({
    where: { id: appt.slotId },
    data: { isBooked: false },
  });
  revalidatePath("/dashboard/mobile/leader/rdv");
}

// ── USER ─────────────────────────────────────────────────────────

// Tous les créneaux libres de tous les leaders (à partir d'aujourd'hui)
export async function getAvailableSlots() {
  const now = new Date();
  return prisma.appointmentSlot.findMany({
    where: { isBooked: false, startTime: { gte: now } },
    include: {
      leader: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

// Prendre un RDV
export async function bookSlot(slotId: string) {
  const user = await getSession();

  const slot = await prisma.appointmentSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Créneau introuvable");
  if (slot.isBooked) throw new Error("Ce créneau est déjà pris.");

  const existing = await prisma.appointment.findFirst({
    where: { userId: user.id, status: "CONFIRMED" },
  });
  if (existing) throw new Error("Tu as déjà un RDV confirmé.");

  await prisma.$transaction([
    prisma.appointmentSlot.update({ where: { id: slotId }, data: { isBooked: true } }),
    prisma.appointment.create({
      data: {
        slotId,
        leaderId: slot.leaderId,
        userId: user.id,
      },
    }),
  ]);

  revalidatePath("/dashboard/mobile/rdv");
  return { success: true };
}

// Mes RDV (user)
export async function getMyAppointments() {
  const user = await getSession();
  return prisma.appointment.findMany({
    where: { userId: user.id },
    include: {
      slot: true,
      leader: { select: { id: true, name: true, image: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Annuler un RDV (côté user)
export async function cancelAppointmentUser(appointmentId: string) {
  const user = await getSession();
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.userId !== user.id) throw new Error("RDV introuvable");
  if (appt.status !== "CONFIRMED") throw new Error("Ce RDV ne peut pas être annulé.");
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancelReason: "Annulé par l'utilisateur" },
  });
  await prisma.appointmentSlot.update({
    where: { id: appt.slotId },
    data: { isBooked: false },
  });
  revalidatePath("/dashboard/mobile/rdv");
}
