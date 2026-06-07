import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Shared header/footer ──────────────────────────────────────────────────────
const emailWrapper = (content, year = new Date().getFullYear()) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#1a1a2e;">
                Job<span style="color:#F83002;">Portal</span>
              </h1>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">Verified Talent Platform</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,0.08);overflow:hidden;">
              <div style="background:linear-gradient(135deg,#6A38C2 0%,#4f28a0 100%);height:5px;"></div>
              ${content}
              <div style="background:linear-gradient(135deg,#6A38C2 0%,#4f28a0 100%);height:3px;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 0 0;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                © ${year} JobPortal &nbsp;·&nbsp;
                <a href="#" style="color:#6A38C2;text-decoration:none;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="#" style="color:#6A38C2;text-decoration:none;">Terms of Service</a>
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

// ── OTP Verification Template ─────────────────────────────────────────────────
const otpEmailContent = (otp, recipientEmail) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:40px 40px 32px;">

      <!-- Icon -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#f0ebff;border-radius:50%;padding:16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#6A38C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="#6A38C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;">Verify Your Email</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
        Use the OTP below to verify your email address. Valid for <strong>10 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="background:#f0ebff;border:2px dashed #6A38C2;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6A38C2;letter-spacing:3px;text-transform:uppercase;">One-Time Password</p>
        <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:16px;color:#1a1a2e;font-family:'Courier New',monospace;">${otp}</p>
      </div>

      <!-- Steps -->
      <div style="background:#fafafa;border-left:3px solid #6A38C2;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#374151;line-height:1.8;">
          1. Go to <strong>Profile → Verification</strong><br/>
          2. Click <strong>"Verify now"</strong><br/>
          3. Enter this OTP
        </p>
      </div>

      <!-- Warning -->
      <div style="background:#fff8ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#92400e;">
          ⚠️ <strong>Never share this OTP.</strong> JobPortal will never ask for it over chat or phone.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 16px;"/>
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
        Sent to <strong>${recipientEmail}</strong>. Didn't request this? Ignore this email.
      </p>
    </td>
  </tr>
</table>
`;

// ── Welcome / Signup Template ─────────────────────────────────────────────────
const welcomeEmailContent = (fullname, email, role) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:40px 40px 32px;">

      <!-- Hero banner -->
      <div style="background:linear-gradient(135deg,#6A38C2,#4f28a0);border-radius:12px;padding:32px 24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome, ${fullname}!</h2>
        <p style="margin:0;font-size:14px;color:#c4b5fd;">Your JobPortal account is ready</p>
      </div>

      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
        Hi <strong>${fullname}</strong>, you've successfully created your
        <strong style="color:#6A38C2;">JobPortal</strong> account as a
        <strong>${role === "student" ? "Candidate" : "Recruiter"}</strong>.
        Here's what you can do next:
      </p>

      <!-- Next steps -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${role === "student" ? `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <table width="100%"><tr>
              <td width="36" style="vertical-align:top;">
                <div style="width:28px;height:28px;background:#f0ebff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">1</div>
              </td>
              <td style="vertical-align:top;padding-left:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e;">Verify your email</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Go to Profile → Verification → Verify now</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <table width="100%"><tr>
              <td width="36" style="vertical-align:top;">
                <div style="width:28px;height:28px;background:#f0ebff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">2</div>
              </td>
              <td style="vertical-align:top;padding-left:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e;">Upload your resume</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Get your ATS score and boost your trust score</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <table width="100%"><tr>
              <td width="36" style="vertical-align:top;">
                <div style="width:28px;height:28px;background:#f0ebff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">3</div>
              </td>
              <td style="vertical-align:top;padding-left:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e;">Browse & apply for jobs</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Explore portal jobs and global remote opportunities</p>
              </td>
            </tr></table>
          </td>
        </tr>
        ` : `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <table width="100%"><tr>
              <td width="36" style="vertical-align:top;">
                <div style="width:28px;height:28px;background:#f0ebff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">1</div>
              </td>
              <td style="vertical-align:top;padding-left:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e;">Register your company</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Add your company details and get verified</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <table width="100%"><tr>
              <td width="36" style="vertical-align:top;">
                <div style="width:28px;height:28px;background:#f0ebff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">2</div>
              </td>
              <td style="vertical-align:top;padding-left:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e;">Post your first job</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Reach thousands of verified candidates</p>
              </td>
            </tr></table>
          </td>
        </tr>
        `}
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="http://localhost:5173" style="display:inline-block;background:linear-gradient(135deg,#6A38C2,#4f28a0);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 36px;border-radius:8px;">
          Go to JobPortal →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 16px;"/>
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
        Account created for <strong>${email}</strong>
      </p>
    </td>
  </tr>
</table>
`;

// ── Forgot Password OTP Template ─────────────────────────────────────────────
const forgotPasswordEmailContent = (otp, recipientEmail, fullname) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:40px 40px 32px;">

      <!-- Icon -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fff0f0;border-radius:50%;padding:16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#F83002" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#F83002" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;">Reset Your Password</h2>
      <p style="margin:0 0 6px;font-size:14px;color:#6b7280;text-align:center;">Hi <strong>${fullname}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
        We received a request to reset your password. Use the OTP below. Valid for <strong>10 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="background:#fff0f0;border:2px dashed #F83002;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#F83002;letter-spacing:3px;text-transform:uppercase;">Password Reset OTP</p>
        <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:16px;color:#1a1a2e;font-family:'Courier New',monospace;">${otp}</p>
      </div>

      <!-- Steps -->
      <div style="background:#fafafa;border-left:3px solid #F83002;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#374151;line-height:1.8;">
          1. Go back to the <strong>Forgot Password</strong> page<br/>
          2. Enter this OTP<br/>
          3. Set your new password
        </p>
      </div>

      <!-- Warning -->
      <div style="background:#fff8ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#92400e;">
          ⚠️ <strong>Didn't request this?</strong> Your password has NOT been changed. You can safely ignore this email.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 16px;"/>
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
        Sent to <strong>${recipientEmail}</strong>
      </p>
    </td>
  </tr>
</table>
`;

// ── Send OTP Email ────────────────────────────────────────────────────────────
export const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"JobPortal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${otp} — Your JobPortal verification code`,
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
    const roleLabel = role === "student" ? "Candidate" : "Recruiter";
    await transporter.sendMail({
      from: `"JobPortal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to JobPortal, ${fullname}! 🎉`,
      html: emailWrapper(welcomeEmailContent(fullname, to, role)),
    });
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email:`, error.message);
    // Non-critical — don't throw, registration should still succeed
  }
};

// ── Send Forgot Password OTP Email ───────────────────────────────────────────
export const sendForgotPasswordEmail = async (to, otp, fullname) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"JobPortal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${otp} — Reset your JobPortal password`,
      html: emailWrapper(forgotPasswordEmailContent(otp, to, fullname)),
    });
    console.log(`✅ Forgot password email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send forgot password email:`, error.message);
    console.log(`\n📧 Dev fallback reset OTP for ${to}: ${otp}\n`);
    throw error;
  }
};
