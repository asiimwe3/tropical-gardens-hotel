import express from "express";
import { config } from "../config.js";
import { query } from "../db.js";
import { validate } from "../middleware/validate.js";
import { paymentCheckoutSchema } from "../schemas.js";
import { getPesapalTransactionStatus, submitPesapalOrder } from "../services/pesapal.js";

export const paymentsRouter = express.Router();

function merchantReference() {
  return `TGH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function syncPesapalPayment(orderTrackingId, merchantReferenceValue) {
  const status = await getPesapalTransactionStatus(orderTrackingId);
  const paymentStatus = String(status.payment_status_description || status.status || "UNKNOWN").toUpperCase();
  const paid = ["COMPLETED", "PAID"].includes(paymentStatus);

  const result = await query(
    `update payments
     set status = $1,
         payment_method = $2,
         payment_account = $3,
         confirmation_code = $4,
         raw_status = $5::jsonb,
         paid_at = case when $6 then coalesce(paid_at, now()) else paid_at end,
         updated_at = now()
     where provider_tracking_id = $7 or merchant_reference = $8
     returning *`,
    [
      paymentStatus,
      status.payment_method || null,
      status.payment_account || null,
      status.confirmation_code || null,
      JSON.stringify(status),
      paid,
      orderTrackingId,
      merchantReferenceValue
    ]
  );

  const payment = result.rows[0];
  if (payment?.reservation_id && paid) {
    await query(
      `update reservations
       set payment_status = 'Paid', amount_paid = $1, payment_reference = $2, updated_at = now()
       where id = $3`,
      [payment.amount, payment.confirmation_code || payment.provider_tracking_id, payment.reservation_id]
    );
  }

  return { payment, status };
}

paymentsRouter.post("/pesapal/checkout", validate(paymentCheckoutSchema), async (req, res, next) => {
  try {
    const reference = merchantReference();
    const { customer } = req.body;

    const order = {
      id: reference,
      currency: req.body.currency,
      amount: req.body.amount,
      description: req.body.description,
      redirect_mode: "TOP_WINDOW",
      callback_url: config.pesapal.callbackUrl,
      cancellation_url: config.pesapal.cancellationUrl,
      notification_id: config.pesapal.ipnId,
      branch: "Tropical Gardens Hotel",
      billing_address: {
        email_address: customer.email || "",
        phone_number: customer.phone || "",
        country_code: "UG",
        first_name: customer.firstName,
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
      [
        req.body.reservationId || null,
        reference,
        pesapal.order_tracking_id,
        req.body.amount,
        req.body.currency,
        pesapal.redirect_url
      ]
    );

    res.status(201).json({
      ok: true,
      merchantReference: reference,
      orderTrackingId: pesapal.order_tracking_id,
      redirectUrl: pesapal.redirect_url
    });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/pesapal/callback", async (req, res, next) => {
  try {
    const orderTrackingId = req.query.OrderTrackingId;
    const merchantReferenceValue = req.query.OrderMerchantReference;
    if (!orderTrackingId) return res.status(400).send("Missing OrderTrackingId");

    const synced = await syncPesapalPayment(orderTrackingId, merchantReferenceValue);
    if (config.paymentSuccessUrl) {
      const url = new URL(config.paymentSuccessUrl);
      url.searchParams.set("status", synced.status.payment_status_description || synced.status.status || "UNKNOWN");
      url.searchParams.set("reference", merchantReferenceValue || "");
      return res.redirect(url.toString());
    }

    return res.json(synced);
  } catch (error) {
    next(error);
  }
});

paymentsRouter.all("/pesapal/ipn", async (req, res) => {
  try {
    const orderTrackingId = req.body.OrderTrackingId || req.body.orderTrackingId || req.query.OrderTrackingId;
    const merchantReferenceValue = req.body.OrderMerchantReference || req.body.orderMerchantReference || req.query.OrderMerchantReference;
    if (!orderTrackingId) {
      return res.status(400).json({ orderNotificationType: "IPNCHANGE", status: 500 });
    }
    await syncPesapalPayment(orderTrackingId, merchantReferenceValue);
    return res.json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId,
      orderMerchantReference: merchantReferenceValue,
      status: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ orderNotificationType: "IPNCHANGE", status: 500 });
  }
});
