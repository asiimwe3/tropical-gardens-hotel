const { readBody, send, syncPayment } = require("../../_lib");

module.exports = async (req, res) => {
  try {
    const body = req.method === "POST" ? await readBody(req) : {};
    const query = req.query || {};
    const orderTrackingId = body.OrderTrackingId || body.orderTrackingId || query.OrderTrackingId || query.orderTrackingId;
    const merchantReference = body.OrderMerchantReference || body.orderMerchantReference || query.OrderMerchantReference || query.orderMerchantReference;
    if (!orderTrackingId) return send(res, 400, { orderNotificationType: "IPNCHANGE", status: 500 });
    await syncPayment(orderTrackingId, merchantReference);
    send(res, 200, {
      orderNotificationType: "IPNCHANGE",
      orderTrackingId,
      orderMerchantReference: merchantReference,
      status: 200
    });
  } catch (error) {
    send(res, 500, { orderNotificationType: "IPNCHANGE", status: 500, error: error.message });
  }
};
