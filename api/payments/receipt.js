const { method, query, send } = require("../_lib");

function receiptNumber(payment) {
  const date = new Date(payment.paid_at || payment.updated_at || payment.created_at || Date.now());
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = String(payment.id || payment.merchant_reference || "").replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TGH-RCPT-${ymd}-${shortId}`;
}

module.exports = async (req, res) => {
  if (!method(req, res, ["GET"])) return;
  try {
    const params = req.query || {};
    const reference = params.reference || params.merchantReference || "";
    const trackingId = params.trackingId || params.orderTrackingId || "";
    if (!reference && !trackingId) return send(res, 400, { error: "Payment reference is required" });

    const result = await query(
      `select
         p.id,
         p.merchant_reference,
         p.provider_tracking_id,
         p.amount,
         p.currency,
         p.status,
         p.payment_method,
         p.payment_account,
         p.confirmation_code,
         p.paid_at,
         p.created_at,
         p.updated_at,
         r.guest_name,
         r.phone,
         r.email,
         r.room_name,
         r.check_in,
         r.check_out,
         r.guests,
         r.payment_status,
         r.payment_reference
       from payments p
       left join reservations r on r.id = p.reservation_id
       where p.merchant_reference = $1 or p.provider_tracking_id = $2
       order by p.created_at desc
       limit 1`,
      [reference, trackingId]
    );

    if (!result.rowCount) return send(res, 404, { error: "Payment receipt was not found" });
    const payment = result.rows[0];
    send(res, 200, {
      receipt: {
        number: receiptNumber(payment),
        hotelName: "Tropical Gardens Hotel Kyenjojo",
        hotelEmail: "tropicalgardenshotel@gmail.com",
        hotelPhone: "0782460683",
        hotelAddress: "Hoima Road, Kyenjojo, Uganda",
        issuedAt: payment.paid_at || payment.updated_at || payment.created_at,
        customer: {
          name: payment.guest_name || "Guest",
          phone: payment.phone || "",
          email: payment.email || ""
        },
        reservation: {
          room: payment.room_name || "Hotel reservation",
          checkIn: payment.check_in || "",
          checkOut: payment.check_out || "",
          guests: payment.guests || 1
        },
        payment: {
          amount: Number(payment.amount) || 0,
          currency: payment.currency || "UGX",
          status: payment.status || "UNKNOWN",
          method: payment.payment_method || "Pesapal",
          account: payment.payment_account || "",
          merchantReference: payment.merchant_reference || "",
          trackingId: payment.provider_tracking_id || "",
          confirmationCode: payment.confirmation_code || payment.payment_reference || ""
        }
      }
    });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
