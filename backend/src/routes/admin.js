import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adminReservationSchema, menuItemSchema, notificationSchema, offerSchema, roomSchema } from "../schemas.js";

export const adminRouter = express.Router();
adminRouter.use(requireAuth);

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [rooms, reservations, messages, menu] = await Promise.all([
      query("select count(*)::int as total, count(*) filter (where is_available)::int as available from rooms"),
      query("select count(*)::int as total, count(*) filter (where status = 'Pending')::int as pending from reservations"),
      query("select count(*)::int as total, count(*) filter (where status = 'Unread')::int as unread from guest_messages"),
      query("select count(*)::int as total, count(*) filter (where is_featured)::int as featured from menu_items")
    ]);
    res.json({
      rooms: rooms.rows[0],
      reservations: reservations.rows[0],
      messages: messages.rows[0],
      menu: menu.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/reservations", async (_req, res, next) => {
  try {
    const result = await query(
      `select id, guest_name as "guestName", phone, email, room_id as "roomId", room_name as "roomName",
       check_in as "checkIn", check_out as "checkOut", guests, status, notes, created_at as "createdAt"
       from reservations order by created_at desc`
    );
    res.json({ reservations: result.rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/reservations/:id/status", async (req, res, next) => {
  try {
    const allowed = ["Pending", "Confirmed", "Checked In", "Checked Out", "Cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid status" });
    const result = await query(
      "update reservations set status = $1, updated_at = now() where id = $2 returning *",
      [req.body.status, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Reservation not found" });
    res.json({ reservation: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/reservations", validate(adminReservationSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into reservations
       (guest_name, phone, email, room_id, room_name, check_in, check_out, guests, status, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       returning id, guest_name as "guestName", phone, email, room_id as "roomId", room_name as "roomName",
       check_in as "checkIn", check_out as "checkOut", guests, status, notes, created_at as "createdAt"`,
      [b.guestName, b.phone, b.email || null, b.roomId || null, b.roomName || null, b.checkIn, b.checkOut, b.guests, b.status, b.notes || ""]
    );
    res.status(201).json({ reservation: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/reservations/:id", validate(adminReservationSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `update reservations
       set guest_name = $1, phone = $2, email = $3, room_id = $4, room_name = $5,
           check_in = $6, check_out = $7, guests = $8, status = $9, notes = $10, updated_at = now()
       where id = $11
       returning id, guest_name as "guestName", phone, email, room_id as "roomId", room_name as "roomName",
       check_in as "checkIn", check_out as "checkOut", guests, status, notes, created_at as "createdAt"`,
      [b.guestName, b.phone, b.email || null, b.roomId || null, b.roomName || null, b.checkIn, b.checkOut, b.guests, b.status, b.notes || "", req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Reservation not found" });
    res.json({ reservation: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/reservations/:id", async (req, res, next) => {
  try {
    const result = await query("delete from reservations where id = $1 returning id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Reservation not found" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/rooms", async (_req, res, next) => {
  try {
    const result = await query("select * from rooms order by room_number nulls last, name asc");
    res.json({ rooms: result.rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/rooms", validate(roomSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into rooms (name, room_number, description, type, price, capacity, image_url, is_available)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [b.name, b.roomNumber || null, b.description || "", b.type || "", b.price, b.capacity, b.imageUrl || null, b.isAvailable]
    );
    res.status(201).json({ room: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/rooms/:id", validate(roomSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `update rooms
       set name = $1, room_number = $2, description = $3, type = $4, price = $5,
           capacity = $6, image_url = $7, is_available = $8, updated_at = now()
       where id = $9 returning *`,
      [b.name, b.roomNumber || null, b.description || "", b.type || "", b.price, b.capacity, b.imageUrl || null, b.isAvailable, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Room not found" });
    res.json({ room: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/rooms/:id", async (req, res, next) => {
  try {
    const result = await query("delete from rooms where id = $1 returning id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Room not found" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/menu", async (_req, res, next) => {
  try {
    const result = await query("select * from menu_items order by category asc, name asc");
    res.json({ menuItems: result.rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/menu", validate(menuItemSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into menu_items (name, description, category, price, image_url, is_available, is_featured)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [b.name, b.description || "", b.category, b.price, b.imageUrl || null, b.isAvailable, b.isFeatured]
    );
    res.status(201).json({ menuItem: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/menu/:id", validate(menuItemSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `update menu_items
       set name = $1, description = $2, category = $3, price = $4, image_url = $5,
           is_available = $6, is_featured = $7, updated_at = now()
       where id = $8 returning *`,
      [b.name, b.description || "", b.category, b.price, b.imageUrl || null, b.isAvailable, b.isFeatured, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Menu item not found" });
    res.json({ menuItem: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/menu/:id", async (req, res, next) => {
  try {
    const result = await query("delete from menu_items where id = $1 returning id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Menu item not found" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/offers", async (_req, res, next) => {
  try {
    const result = await query("select * from offers order by created_at desc");
    res.json({ offers: result.rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/offers", validate(offerSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into offers (title, description, discount_percent, code, starts_at, ends_at, is_active)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [b.title, b.description || "", b.discountPercent, b.code || null, b.startsAt, b.endsAt, b.isActive]
    );
    res.status(201).json({ offer: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/offers/:id", validate(offerSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `update offers
       set title = $1, description = $2, discount_percent = $3, code = $4,
           starts_at = $5, ends_at = $6, is_active = $7, updated_at = now()
       where id = $8 returning *`,
      [b.title, b.description || "", b.discountPercent, b.code || null, b.startsAt, b.endsAt, b.isActive, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json({ offer: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/offers/:id", async (req, res, next) => {
  try {
    const result = await query("delete from offers where id = $1 returning id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/notifications", async (_req, res, next) => {
  try {
    const result = await query(
      `select id, title, body, channel, audience, type, is_active as "isActive", created_at as "createdAt"
       from notifications order by created_at desc`
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/notifications", validate(notificationSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into notifications (title, body, channel, audience, type, is_active)
       values ($1,$2,$3,$4,$5,$6)
       returning id, title, body, channel, audience, type, is_active as "isActive", created_at as "createdAt"`,
      [b.title, b.body || "", b.channel || "Website", b.audience || "All Guests", b.type || "update", b.isActive]
    );
    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/notifications/:id", async (req, res, next) => {
  try {
    const result = await query("delete from notifications where id = $1 returning id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Notification not found" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/messages", async (_req, res, next) => {
  try {
    const result = await query("select * from guest_messages order by created_at desc");
    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
});
