import nodemailer from "nodemailer";

const BRAND_NAME = "GetHired";
const BRAND_PURPLE = "#6A38C2";
const BRAND_ORANGE = "#F83002";
const BRAND_DARK = "#1a1a2e";
const APP_URL = process.env.CLIENT_URL || "http://localhost:5173";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER?.trim(),
      pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
    },
  });

const brandLogo = `
  <h1 style="margin:0;font-size:28px;font-weight:800;color:${BRAND_DARK};letter-spacing:-0.5px;">
    Get<span style="color:${BRAND_ORANGE};">Hired</span>
  </h1>
  <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
    Verified Talent Platform
  </p>
`;

const ctaButton = (href, label) => `
  <a href="${href}" style="display:inline-block;background:${BRAND_PURPLE};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">
    ${label}
  </a>
`;

const infoBox = (title, lines, accentColor = BRAND_PURPLE) => `
  <div style="background:#fafafa;border:1px solid #e5e7eb;border-left:4px solid ${accentColor};border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${accentColor};letter-spacing:1.5px;text-transform:uppercase;">${title}</p>
    ${lines}
  </div>
`;

// ── Shared wrapper ────────────────────────────────────────────────────────────
const emailWrapper = (content, year = new Date().getFullYear()) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <tr>
            <td align="center" style="padding-bottom:28px;">
              ${brandLogo}
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              <div style="background:linear-gradient(90deg,${BRAND_PURPLE},#5530a8);height:4px;"></div>
              ${content}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 16px 0;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.6;">
                This is an automated message from ${BRAND_NAME}. Please do not reply directly to this email.
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                © ${year} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── OTP Verification ──────────────────────────────────────────────────────────
const otpEmailContent = (otp, recipientEmail) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:48px 48px 40px;">

      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${BRAND_PURPLE};letter-spacing:1px;text-transform:uppercase;">Email Verification</p>
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${BRAND_DARK};line-height:1.3;">Verify your email address</h2>
      <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
        Use the verification code below to complete your email verification on ${BRAND_NAME}. This code expires in <strong>10 minutes</strong>.
      </p>

      <div style="background:#f8f7ff;border:1px solid #ddd6fe;border-radius:10px;padding:32px;text-align:center;margin-bottom:32px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${BRAND_PURPLE};letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
        <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:${BRAND_DARK};font-family:'Courier New',Consolas,monospace;">${otp}</p>
      </div>

      ${infoBox("How to verify", `
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.9;">
          1. Sign in to your ${BRAND_NAME} account<br/>
          2. Navigate to <strong>Profile → Verification</strong><br/>
          3. Enter the code above and confirm
        </p>
      `)}

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>Security notice:</strong> ${BRAND_NAME} will never ask for this code via phone, chat, or third-party links. Do not share it with anyone.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;"/>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Sent to <strong>${recipientEmail}</strong>. If you did not request this, you can safely ignore this email.
      </p>
    </td>
  </tr>
</table>
`;

// ── Welcome / Signup ──────────────────────────────────────────────────────────
const welcomeEmailContent = (fullname, email, role) => {
  const roleLabel = role === "student" ? "Candidate" : "Recruiter";
  const steps = role === "student"
    ? [
        ["Complete email verification", "Verify your account from Profile → Verification"],
        ["Build your professional profile", "Upload your resume, add skills, and improve your ATS score"],
        ["Discover and apply for roles", "Browse verified jobs and track applications in one place"],
      ]
    : [
        ["Register your organization", "Add company details and complete verification"],
        ["Publish job openings", "Reach qualified, verified candidates on ${BRAND_NAME}"],
      ];

  const stepsHtml = steps.map(([title, desc], i) => `
    <tr>
      <td style="padding:${i < steps.length - 1 ? "16px 0" : "16px 0 0"};${i < steps.length - 1 ? "border-bottom:1px solid #f3f4f6;" : ""}">
        <table width="100%"><tr>
          <td width="40" style="vertical-align:top;">
            <div style="width:32px;height:32px;background:#f3f0ff;border-radius:8px;text-align:center;line-height:32px;font-size:13px;font-weight:700;color:${BRAND_PURPLE};">${i + 1}</div>
          </td>
          <td style="vertical-align:top;padding-left:14px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND_DARK};">${title}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join("");

  return `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:48px 48px 40px;">

      <div style="background:linear-gradient(135deg,${BRAND_PURPLE},#5530a8);border-radius:10px;padding:36px 32px;text-align:center;margin-bottom:36px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#c4b5fd;letter-spacing:1px;text-transform:uppercase;">Welcome to ${BRAND_NAME}</p>
        <h2 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;">Hello, ${fullname}</h2>
        <p style="margin:0;font-size:14px;color:#ddd6fe;">Your ${roleLabel} account is now active</p>
      </div>

      <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.7;">
        Thank you for joining <strong>${BRAND_NAME}</strong>. We connect verified talent with trusted employers. Here are your recommended next steps:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
        ${stepsHtml}
      </table>

      <div style="text-align:center;margin-bottom:8px;">
        ${ctaButton(APP_URL, `Go to ${BRAND_NAME}`)}
      </div>

      <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;"/>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Account registered for <strong>${email}</strong>
      </p>
    </td>
  </tr>
</table>
`;
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPasswordEmailContent = (otp, recipientEmail, fullname) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:48px 48px 40px;">

      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${BRAND_ORANGE};letter-spacing:1px;text-transform:uppercase;">Password Reset</p>
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${BRAND_DARK};line-height:1.3;">Reset your password</h2>
      <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.7;">
        Dear <strong>${fullname}</strong>,
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
        We received a request to reset the password for your ${BRAND_NAME} account. Use the code below to proceed. It expires in <strong>10 minutes</strong>.
      </p>

      <div style="background:#fff7f5;border:1px solid #fecaca;border-radius:10px;padding:32px;text-align:center;margin-bottom:32px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${BRAND_ORANGE};letter-spacing:2px;text-transform:uppercase;">Reset Code</p>
        <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:${BRAND_DARK};font-family:'Courier New',Consolas,monospace;">${otp}</p>
      </div>

      ${infoBox("Next steps", `
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.9;">
          1. Return to the <strong>Forgot Password</strong> page on ${BRAND_NAME}<br/>
          2. Enter the reset code above<br/>
          3. Create a new secure password
        </p>
      `, BRAND_ORANGE)}

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>Did not request a reset?</strong> Your password has not been changed. You may ignore this email.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;"/>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Sent to <strong>${recipientEmail}</strong>
      </p>
    </td>
  </tr>
</table>
`;

// ── Application Accepted ────────────────────────────────────────────────────────
const applicationAcceptedEmailContent = (fullname, jobTitle, companyName, profileUrl) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:48px 48px 40px;">

      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#059669;letter-spacing:1px;text-transform:uppercase;">Application Update</p>
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${BRAND_DARK};line-height:1.3;">Congratulations, ${fullname}</h2>
      <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
        We are pleased to inform you that your application has been reviewed and you have been <strong style="color:#059669;">selected</strong> for the following opportunity.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:28px 32px;margin-bottom:32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#059669;letter-spacing:1.5px;text-transform:uppercase;">Position</p>
              <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_DARK};line-height:1.3;">${jobTitle}</p>
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Company</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#374151;">${companyName}</p>
            </td>
          </tr>
        </table>
      </div>

      ${infoBox("What happens next", `
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.9;">
          • The hiring team may contact you directly for further steps<br/>
          • Keep your profile and contact details up to date on ${BRAND_NAME}<br/>
          • You can track this application status anytime from your dashboard
        </p>
      `, "#059669")}

      <div style="text-align:center;margin-bottom:8px;">
        ${ctaButton(profileUrl, "View Application Status")}
      </div>

      <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;"/>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
        We wish you the very best in the next stage of your hiring journey.<br/>
        — The ${BRAND_NAME} Team
      </p>
    </td>
  </tr>
</table>
`;

const mailFrom = () => `"${BRAND_NAME}" <${process.env.EMAIL_USER.trim()}>`;

// ── Send OTP Email ────────────────────────────────────────────────────────────
export const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom(),
      to,
      subject: `${otp} — Your ${BRAND_NAME} verification code`,
      html: emailWrapper(otpEmailContent(otp, to)),
    });
    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email:`, error.message);
    console.log(`\n📧 Dev fallback OTP for ${to}: ${otp}\n`);
    throw error;
  }
};

// ── Send Welcome Email on Signup ──────────────────────────────────────────────
export const sendWelcomeEmail = async (to, fullname, role) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom(),
      to,
      subject: `Welcome to ${BRAND_NAME}, ${fullname}`,
      html: emailWrapper(welcomeEmailContent(fullname, to, role)),
    });
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email:`, error.message);
  }
};

// ── Send Application Accepted Email ───────────────────────────────────────────
export const sendApplicationAcceptedEmail = async (to, fullname, jobTitle, companyName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email not configured — set EMAIL_USER and EMAIL_PASS in .env");
    return false;
  }

  try {
    const transporter = createTransporter();
    const profileUrl = `${APP_URL}/profile`;

    await transporter.sendMail({
      from: mailFrom(),
      to,
      subject: `You are selected — ${jobTitle} at ${companyName} | ${BRAND_NAME}`,
      html: emailWrapper(applicationAcceptedEmailContent(fullname, jobTitle, companyName, profileUrl)),
    });
    console.log(`✅ Selection email sent to ${to} for ${jobTitle}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send selection email to ${to}:`, error.message);
    return false;
  }
};

// ── Send Forgot Password OTP Email ───────────────────────────────────────────
export const sendForgotPasswordEmail = async (to, otp, fullname) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom(),
      to,
      subject: `${otp} — Reset your ${BRAND_NAME} password`,
      html: emailWrapper(forgotPasswordEmailContent(otp, to, fullname)),
    });
    console.log(`✅ Forgot password email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send forgot password email:`, error.message);
    console.log(`\n📧 Dev fallback reset OTP for ${to}: ${otp}\n`);
    throw error;
  }
};
