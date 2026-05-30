import express from "express";
import { query } from "../db.js";
import { validate } from "../middleware/validate.js";
import { contactSchema, reservationSchema } from "../schemas.js";

export const publicRouter = express.Router();

publicRouter.get("/rooms", async (_req, res, next) => {
  try {
    const result = await query(
      "select id, name, room_number as \"roomNumber\", description, type, price, capacity, image_url as \"imageUrl\", is_available as \"isAvailable\" from rooms order by price asc"
    );
    res.json({ rooms: result.rows });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/menu", async (req, res, next) => {
  try {
    const category = req.query.category;
    const params = [];
    let sql = "select id, name, description, category, price, image_url as \"imageUrl\", is_available as \"isAvailable\", is_featured as \"isFeatured\" from menu_items";
    if (category) {
      params.push(category);
      sql += " where category = $1";
    }
    sql += " order by is_featured desc, category asc, name asc";
    const result = await query(sql, params);
    res.json({ menuItems: result.rows });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/offers", async (_req, res, next) => {
  try {
    const result = await query(
      "select id, title, description, discount_percent as \"discountPercent\", code, starts_at as \"startsAt\", ends_at as \"endsAt\" from offers where is_active = true and current_date between starts_at and ends_at order by ends_at asc"
    );
    res.json({ offers: result.rows });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/notifications", async (_req, res, next) => {
  try {
    const result = await query(
      `select id, title, body, channel, audience, type, created_at as "createdAt"
       from notifications
       where is_active = true
       order by created_at desc
       limit 20`
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/reservations", validate(reservationSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into reservations
       (guest_name, phone, email, room_id, room_name, check_in, check_out, guests, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id, status, created_at as "createdAt"`,
      [b.guestName, b.phone, b.email || null, b.roomId || null, b.roomName || null, b.checkIn, b.checkOut, b.guests, b.notes || ""]
    );
    res.status(201).json({ reservation: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/contact", validate(contactSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const result = await query(
      `insert into guest_messages (name, phone, email, subject, message)
       values ($1,$2,$3,$4,$5)
       returning id, created_at as "createdAt"`,
      [b.name, b.phone || null, b.email || null, b.subject || null, b.message]
    );
    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
