const { method, query, send, readBody } = require("./_lib");
const { notifyAdmin } = require("./_notify");

module.exports = async (req, res) => {
  // POST — send admin notification (used by frontend Supabase fallback)
  if (req.method === "POST") {
    try {
      const body = await readBody(req);
      const type = body.type || "booking";
      const details = body.details || {};
      const result = await notifyAdmin(type, details);
      return send(res, 200, { success: true, telegram: result.telegram, email: result.email });
    } catch (error) {
      return send(res, 500, { error: error.message });
    }
  }

  // GET — fetch public notifications (existing behavior)
  if (!method(req, res, ["GET"])) return;
  try {
    const result = await query(
      `select id, title, body, channel, audience, type, created_at
       from notifications
       where is_active = true
       order by created_at desc
       limit 20`
    );
    send(res, 200, {
      notifications: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        channel: row.channel,
        audience: row.audience,
        type: row.type,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
