const { config, syncPayment } = require("../../_lib");

module.exports = async (req, res) => {
  try {
    const query = req.query || {};
    const orderTrackingId = query.OrderTrackingId || query.orderTrackingId;
    const merchantReference = query.OrderMerchantReference || query.orderMerchantReference;
    if (!orderTrackingId) {
      res.statusCode = 400;
      return res.end("Missing OrderTrackingId");
    }
    const synced = await syncPayment(orderTrackingId, merchantReference);
    const url = new URL(config.paymentSuccessUrl);
    url.searchParams.set("status", synced.status.payment_status_description || synced.status.status || "UNKNOWN");
    url.searchParams.set("reference", merchantReference || "");
    res.statusCode = 302;
    res.setHeader("Location", url.toString());
    res.end();
  } catch (error) {
    res.statusCode = 500;
    res.end(error.message);
  }
};
