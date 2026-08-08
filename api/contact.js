const { method, query, readBody, send } = require("./_lib");
const { notifyAdmin } = require("./_notify");

module.exports = async (req, res) => {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const message = String(body.message || "").trim();
    if (!name || message.length < 5) return send(res, 400, { error: "Name and message are required" });
    const result = await query(
      `insert into guest_messages (name, phone, email, subject, message)
       values ($1,$2,$3,$4,$5)
       returning id, created_at as "createdAt"`,
      [name, body.phone || null, body.email || null, body.subject || "Website contact form", message]
    );

    // 🔔 Send instant notification to admin (Telegram + email)
    notifyAdmin("contact", {
      name,
      phone: body.phone || "",
      email: body.email || "",
      subject: body.subject || "Website contact form",
      message
    }).catch(e => console.error("[notify] Contact notification failed:", e.message));

    send(res, 201, { message: result.rows[0] });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
