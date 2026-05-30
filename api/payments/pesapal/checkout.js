const { config, method, merchantReference, query, readBody, send, submitPesapalOrder } = require("../../_lib");

module.exports = async (req, res) => {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = await readBody(req);
    const customer = body.customer || {};
    const amount = Number(body.amount);
    if (!amount || amount < 1000) return send(res, 400, { error: "Valid amount is required" });
    if (!customer.email && !customer.phone) return send(res, 400, { error: "Customer email or phone is required" });

    const reference = merchantReference();
    const order = {
      id: reference,
      currency: body.currency || "UGX",
      amount,
      description: body.description || "Tropical Gardens Hotel booking deposit",
      redirect_mode: "TOP_WINDOW",
      callback_url: config.pesapalCallbackUrl,
      cancellation_url: config.pesapalCancellationUrl,
      branch: "Tropical Gardens Hotel",
      billing_address: {
        email_address: customer.email || "",
        phone_number: customer.phone || "",
        country_code: "UG",
        first_name: customer.firstName || "Guest",
        last_name: customer.lastName || "",
        line_1: "Tropical Gardens Hotel",
        city: "Kyenjojo"
      }
    };
    const pesapal = await submitPesapalOrder(order);
    await query(
      `insert into payments
       (reservation_id, merchant_reference, provider, provider_tracking_id, amount, currency, status, checkout_url)
       values ($1,$2,'pesapal',$3,$4,$5,'PENDING',$6)`,
      [body.reservationId || null, reference, pesapal.order_tracking_id, amount, body.currency || "UGX", pesapal.redirect_url]
    );
    send(res, 201, {
      ok: true,
      merchantReference: reference,
      orderTrackingId: pesapal.order_tracking_id,
      redirectUrl: pesapal.redirect_url
    });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
