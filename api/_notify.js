// Notification helper — sends instant alerts to the hotel admin
// Supports: Telegram Bot API (free, instant) and email via Resend (free tier)
// Configure via Vercel environment variables:
//   TELEGRAM_BOT_TOKEN  — from @BotFather
//   TELEGRAM_CHAT_ID    — your chat ID (from @userinfobot)
//   RESEND_API_KEY      — from resend.com (optional, for email)
//   ADMIN_EMAIL         — defaults to tropicalgardenshotel@gmail.com

const ADMIN_PHONE = "256782460683";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tropicalgardenshotel@gmail.com";

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      }),
      signal: AbortSignal.timeout(10000)
    });
    return res.ok;
  } catch (e) {
    console.error("[notify] Telegram error:", e.message);
    return null;
  }
}

async function sendEmail(subject, body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "notifications@tropicalgardenshotelkyenjojo.com",
        to: [ADMIN_EMAIL],
        subject: subject,
        text: body
      }),
      signal: AbortSignal.timeout(10000)
    });
    return res.ok;
  } catch (e) {
    console.error("[notify] Email error:", e.message);
    return null;
  }
}

// Main notification function — call after any admin-worthy action
async function notifyAdmin(type, details) {
  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Kampala",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  let telegramMsg = "";
  let emailSubject = "";
  let emailBody = "";

  if (type === "booking") {
    telegramMsg = [
      `🔔 *NEW BOOKING REQUEST*`,
      ``,
      `👤 *Guest:* ${details.guestName || "Unknown"}`,
      `📞 *Phone:* ${details.phone || "N/A"}`,
      `✉️ *Email:* ${details.email || "N/A"}`,
      `🏠 *Room:* ${details.roomName || "Not specified"}`,
      `📅 *Check-in:* ${details.checkIn || "N/A"}`,
      `📅 *Check-out:* ${details.checkOut || "N/A"}`,
      `👥 *Guests:* ${details.guests || 1}`,
      `📝 *Notes:* ${details.notes || "None"}`,
      ``,
      `⏰ ${timestamp}`,
      `🔗 Check admin dashboard: https://tropicalgardenshotelkyenjojo.com/admin.html`
    ].join("\n");

    emailSubject = `New Booking — ${details.guestName || "Guest"} (${details.roomName || "Room"})`;
    emailBody = [
      `New booking request received at ${timestamp}`,
      ``,
      `Guest: ${details.guestName || "Unknown"}`,
      `Phone: ${details.phone || "N/A"}`,
      `Email: ${details.email || "N/A"}`,
      `Room: ${details.roomName || "Not specified"}`,
      `Check-in: ${details.checkIn || "N/A"}`,
      `Check-out: ${details.checkOut || "N/A"}`,
      `Guests: ${details.guests || 1}`,
      `Notes: ${details.notes || "None"}`,
      ``,
      `View in admin dashboard: https://tropicalgardenshotelkyenjojo.com/admin.html`
    ].join("\n");
  } else if (type === "contact") {
    telegramMsg = [
      `💬 *NEW MESSAGE*`,
      ``,
      `👤 *From:* ${details.name || "Unknown"}`,
      `📞 *Phone:* ${details.phone || "N/A"}`,
      `✉️ *Email:* ${details.email || "N/A"}`,
      `📝 *Subject:* ${details.subject || "Website contact form"}`,
      `💬 *Message:*`,
      `${details.message || ""}`,
      ``,
      `⏰ ${timestamp}`,
      `🔗 Check admin dashboard: https://tropicalgardenshotelkyenjojo.com/admin.html`
    ].join("\n");

    emailSubject = `New Message — ${details.name || "Guest"}`;
    emailBody = [
      `New contact message received at ${timestamp}`,
      ``,
      `From: ${details.name || "Unknown"}`,
      `Phone: ${details.phone || "N/A"}`,
      `Email: ${details.email || "N/A"}`,
      `Subject: ${details.subject || "Website contact form"}`,
      ``,
      `Message:`,
      `${details.message || ""}`,
      ``,
      `View in admin dashboard: https://tropicalgardenshotelkyenjojo.com/admin.html`
    ].join("\n");
  } else if (type === "payment") {
    telegramMsg = [
      `💰 *PAYMENT RECEIVED*`,
      ``,
      `👤 *Guest:* ${details.guestName || "Unknown"}`,
      `💵 *Amount:* UGX ${details.amount || "N/A"}`,
      `✅ *Status:* ${details.status || "Completed"}`,
      `🔑 *Reference:* ${details.reference || "N/A"}`,
      ``,
      `⏰ ${timestamp}`,
      `🔗 Check admin dashboard: https://tropicalgardenshotelkyenjojo.com/admin.html`
    ].join("\n");

    emailSubject = `Payment Received — UGX ${details.amount || "N/A"}`;
    emailBody = `Payment received from ${details.guestName} at ${timestamp}\nAmount: UGX ${details.amount}\nStatus: ${details.status}\nReference: ${details.reference}`;
  }

  // Send both in parallel — fail silently if not configured
  const results = await Promise.allSettled([
    sendTelegram(telegramMsg),
    sendEmail(emailSubject, emailBody)
  ]);

  const telegramSent = results[0].status === "fulfilled" && results[0].value;
  const emailSent = results[1].status === "fulfilled" && results[1].value;

  console.log(`[notify] ${type}: Telegram=${telegramSent}, Email=${emailSent}`);
  return { telegram: telegramSent, email: emailSent };
}

module.exports = { notifyAdmin };
