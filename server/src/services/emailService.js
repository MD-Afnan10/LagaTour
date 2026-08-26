import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let etherealTransporter = null;

/**
 * Creates and returns the email transporter based on environment variables
 */
async function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 1. Official Gmail / SMTP Configuration
  if (user && pass && pass.trim() !== "" && !pass.includes("your_")) {
    const isGmail = (host && host.includes("gmail")) || (user && user.includes("gmail"));
    
    if (isGmail) {
      return {
        transporter: nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: user.trim(),
            pass: pass.trim().replace(/\s+/g, "") // remove any spaces from app password
          }
        }),
        isReal: true,
        from: process.env.SMTP_FROM || `"Laga Tour Official" <${user.trim()}>`
      };
    }

    return {
      transporter: nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || "465", 10),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: user.trim(),
          pass: pass.trim()
        }
      }),
      isReal: true,
      from: process.env.SMTP_FROM || `"Laga Tour Official" <${user.trim()}>`
    };
  }

  // 2. Fallback to dynamic Ethereal Test Account if credentials not yet supplied
  if (!etherealTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log("🧪 Generated dynamic test email account (SMTP pending):", testAccount.user);
    } catch (e) {
      // Offline fallback
    }
  }

  if (etherealTransporter) {
    return {
      transporter: etherealTransporter,
      isReal: false,
      from: `"Laga Tour Official" <verify@lagatour.com>`
    };
  }

  return null;
}

/**
 * Automatically sends a 6-digit verification code email from official account to user
 * @param {string} toEmail - Recipient user email
 * @param {string} code - 6-digit OTP code
 * @param {'signup' | 'forgot_password'} purpose - Context of verification
 */
export async function sendVerificationEmail(toEmail, code, purpose = "signup") {
  const isSignup = purpose === "signup";
  const subject = isSignup 
    ? "✈️ Your Laga Tour Verification Code" 
    : "🔒 Your Laga Tour Password Reset Code";

  const title = isSignup ? "Verify Your Email Address" : "Reset Your Password";
  const desc = isSignup
    ? "Welcome to Laga Tour! Use the 6-digit verification code below to verify your email ownership and activate your traveler account."
    : "We received a request to reset your Laga Tour password. Use the 6-digit verification code below to proceed.";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #e2e8f0; margin: 0; padding: 20px; }
          .card { max-width: 520px; margin: 20px auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 30px 24px; text-align: center; color: #ffffff; }
          .brand { font-size: 32px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
          .subbrand { font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .body { padding: 36px 28px; text-align: center; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
          .text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { background: #0f172a; border: 2px dashed #f59e0b; border-radius: 18px; padding: 20px 28px; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #fbbf24; font-family: monospace; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }
          .footer { border-top: 1px solid #334155; padding: 20px; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="brand">Laga Tour ✈️</h1>
            <div class="subbrand">Official Traveler Verification</div>
          </div>
          <div class="body">
            <div class="title">${title}</div>
            <div class="text">${desc}</div>
            <div class="otp-box">${code}</div>
            <div class="text" style="font-size: 12px; margin-bottom: 0;">
              This code will expire in <strong>10 minutes</strong>. If you did not initiate this request, please disregard this message.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Laga Tour Platform. Sent from official mail system.
          </div>
        </div>
      </body>
    </html>
  `;

  let previewUrl = null;

  try {
    const config = await getTransporter();

    if (config && config.transporter) {
      const info = await config.transporter.sendMail({
        from: config.from,
        to: toEmail,
        subject: subject,
        text: `Your Laga Tour verification code is: ${code}. It expires in 10 minutes.`,
        html: htmlContent
      });

      if (config.isReal) {
        console.log(`\n✅ [REAL EMAIL DISPATCHED] From: ${config.from} ➔ To: ${toEmail} (Message ID: ${info.messageId})`);
      } else {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 Test Email processed for ${toEmail}. Preview: ${previewUrl}`);
      }
    }
  } catch (err) {
    console.warn("⚠️ Email transporter send notice:", err.message);
  }

  // Console output
  console.log("\n=======================================================");
  console.log(`✉️ [LAGATOUR OFFICIAL EMAIL] To: ${toEmail}`);
  console.log(`🎯 Purpose: ${purpose.toUpperCase()}`);
  console.log(`🔑 VERIFICATION CODE: >>  ${code}  <<`);
  console.log(`⏱️ Expires in: 10 minutes`);
  console.log("=======================================================\n");

  return {
    success: true,
    code,
    previewUrl
  };
}

export default {
  sendVerificationEmail
};
