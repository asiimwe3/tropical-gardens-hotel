const { method, query, send } = require("./_lib");

module.exports = async (req, res) => {
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
