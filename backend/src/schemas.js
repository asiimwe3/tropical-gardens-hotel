import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const reservationSchema = z.object({
  guestName: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal("")),
  roomId: z.string().uuid().optional(),
  roomName: z.string().max(120).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  notes: z.string().max(1000).optional().or(z.literal(""))
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(5).max(2000)
});

export const paymentCheckoutSchema = z.object({
  reservationId: z.string().uuid().optional(),
  amount: z.number().min(1000),
  currency: z.string().length(3).default("UGX"),
  description: z.string().min(3).max(100).default("Tropical Gardens Hotel booking"),
  customer: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().max(80).optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(7).max(40).optional().or(z.literal(""))
  }).refine((data) => data.email || data.phone, {
    message: "Either customer email or phone is required"
  })
});

export const roomSchema = z.object({
  name: z.string().min(2).max(120),
  roomNumber: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  type: z.string().max(80).optional().or(z.literal("")),
  price: z.number().int().min(0),
  capacity: z.number().int().min(1).max(20),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true)
});

export const menuItemSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.enum(["Breakfast", "Lunch", "Dinner", "Drinks", "Desserts", "Snacks"]),
  price: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false)
});

export const offerSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional().or(z.literal("")),
  discountPercent: z.number().int().min(0).max(100).default(0),
  code: z.string().max(40).optional().or(z.literal("")),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive: z.boolean().default(true)
});
