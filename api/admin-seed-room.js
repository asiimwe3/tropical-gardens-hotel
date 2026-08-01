const { query, send, method, readBody } = require("./_lib");

module.exports = async (req, res) => {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = await readBody(req);
    const secret = body.secret || "";
    if (secret !== "tgh-seed-2026") {
      return send(res, 403, { error: "Unauthorized" });
    }
    const result = await query(
      `insert into rooms (name, description, price, currency, capacity, is_available, sort_order, type, room_number, amenities, image_url)
       values ($1, $2, $3, 'UGX', $4, true, $5, $6, $7, '[]'::jsonb, $8)
       on conflict (room_number) do update set name = $1, description = $2, price = $3, capacity = $4, type = $6, image_url = $8
       returning id, name, price, type`,
      [body.name, body.description, body.price, body.capacity, body.sortOrder, body.type, body.roomNumber, body.imageUrl]
    );
    send(res, 201, { success: true, room: result.rows[0] });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
