/**
 * Email service — Resend HTTP API (serverless-friendly) with SMTP fallback.
 *
 * Priority:
 *   1. RESEND_API_KEY set   → send via Resend HTTP API (best for Vercel)
 *   2. SMTP_USER/PASS set   → send via nodemailer SMTP (local dev / Gmail app password)
 *   3. Neither set          → log-only mode (order flow never breaks)
 */
const nodemailer = require("nodemailer");

// ---------- transport selection ----------
let resendKey = process.env.RESEND_API_KEY || null;
let smtpTransport = null;

if (!resendKey && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_EMAIL = process.env.FROM_EMAIL || "FORPETS <onboarding@resend.dev>";

// ---------- generic sender ----------
async function sendMail(to, subject, html) {
  try {
    // demo mode: route every email to the account owner's inbox
    // (Resend only delivers to your own address until a domain is verified)
    if (process.env.DEMO_EMAIL_OVERRIDE) {
      to = process.env.DEMO_EMAIL_OVERRIDE;
    }
    if (resendKey) {
      return await sendViaResend(to, subject, html);
    }
    if (smtpTransport) {
      await smtpTransport.sendMail({ from: FROM_EMAIL, to, subject, html });
      console.log(`📧 [SMTP] Email sent to ${to} — "${subject}"`);
      return true;
    }
    console.log(`📧 [LOG-ONLY] Would send to ${to} — "${subject}" (no RESEND_API_KEY / SMTP creds)`);
    return false;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    return false;
  }
}

// ---------- Resend via fetch (no SDK needed) ----------
async function sendViaResend(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    // invalid key → disable for process lifetime, fall through to SMTP next time
    if (res.status === 401 || res.status === 403) {
      console.error("❌ [Resend] key rejected, disabling for this instance");
      resendKey = null;
    }
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }

  console.log(`📧 [Resend] Email sent to ${to} — "${subject}"`);
  return true;
}

// ---------- ORDER PLACED EMAIL ----------
function orderPlacedTemplate(user, order) {
  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${i.productId ? i.productId.name : "Product"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${i.subtotal}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
    <div style="background:#ff8c42;color:#fff;padding:20px;text-align:center;">
      <h2>🐾 FORPETS</h2>
      <p style="margin:0;">Order Confirmation</p>
    </div>
    <div style="padding:20px;color:#333;">
      <p>Hi <b>${user.name}</b>,</p>
      <p>Thanks for your order! 🎉 Your order has been placed successfully and is being processed.</p>

      <h3 style="margin-bottom:6px;">Order #${order._id}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f9f9f9;">
          <th style="padding:8px;text-align:left;">Product</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
        </tr>
        ${rows}
        <tr>
          <td colspan="2" style="padding:10px;text-align:right;"><b>Grand Total:</b></td>
          <td style="padding:10px;text-align:right;"><b>₹${order.totalAmount}</b></td>
        </tr>
      </table>

      <h3 style="margin-bottom:4px;">Shipping to</h3>
      <p style="margin:0;line-height:1.6;">
        ${order.shippingAddress?.fullName || "—"}<br>
        ${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""} — ${order.shippingAddress?.pincode || ""}<br>
        📞 ${order.shippingAddress?.phone || "—"}
      </p>

      <p style="margin-top:20px;">Payment Method: <b>${order.paymentMethod}</b></p>
      <p>You can track your order anytime from your <b>Order History</b> page.</p>
      <p style="color:#888;font-size:13px;">— Team FORPETS</p>
    </div>
  </div>`;
}

// ---------- ORDER STATUS UPDATE EMAIL ----------
function statusUpdateTemplate(user, order, newStatus) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
    <div style="background:#ff8c42;color:#fff;padding:20px;text-align:center;">
      <h2>🐾 FORPETS</h2>
      <p style="margin:0;">Order Status Update</p>
    </div>
    <div style="padding:20px;color:#333;">
      <p>Hi <b>${user.name}</b>,</p>
      <p>Your order <b>#${order._id}</b> status has been updated:</p>
      <p style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;background:#e8f7ee;color:#1c9c54;padding:10px 24px;border-radius:24px;font-size:18px;font-weight:bold;">
          ${newStatus}
        </span>
      </p>
      ${
        newStatus === "Out for Delivery"
          ? "<p>🚚 Your order is on its way! Keep your phone nearby.</p>"
          : ""
      }
      ${
        newStatus === "Delivered"
          ? "<p>🎉 Your order has been delivered! We hope your pet loves it. Happy shopping!</p>"
          : ""
      }
      <p style="color:#888;font-size:13px;">— Team FORPETS</p>
    </div>
  </div>`;
}

module.exports = { sendMail, orderPlacedTemplate, statusUpdateTemplate };
