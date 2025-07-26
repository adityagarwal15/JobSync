require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email from Node.js",
      text: "If you're reading this, SMTP works!",
    });

    console.log("✅ Test email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
}

sendTestEmail();
