const { method, query, readBody, send } = require("./_lib");

module.exports = async (req, res) => {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = await readBody(req);
    const guestName = String(body.guestName || "").trim();
    const phone = String(body.phone || "").trim();
    if (!guestName || phone.length < 7 || !body.checkIn || !body.checkOut) {
      return send(res, 400, { error: "Guest name, phone, check-in and check-out are required" });
    }
    const result = await query(
      `insert into reservations
       (guest_name, phone, email, room_id, room_name, check_in, check_out, guests, notes, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending')
       returning id, status, created_at as "createdAt"`,
      [guestName, phone, body.email || null, body.roomId || null, body.roomName || null, body.checkIn, body.checkOut, Number(body.guests) || 1, body.notes || ""]
    );
    send(res, 201, { reservation: result.rows[0] });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
