export const generateHTML = ({ name, otp, expiryMinutes = 10 }) => {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, Helvetica, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background-color:#4f46e5; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">Saraha App</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px 0; color:#111827; font-size:20px;">Verify Your Email</h2>
              <p style="margin:0 0 24px 0; color:#4b5563; font-size:15px; line-height:1.6;">
                Hi ${name},<br><br>
                Thanks for signing up! Please use the verification code below to confirm your email address. This code will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0 24px 0;">
                    <div style="display:inline-block; background-color:#f3f4f6; border:1px dashed #4f46e5; border-radius:6px; padding:16px 32px;">
                      <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#4f46e5;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0; color:#4b5563; font-size:14px; line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb; padding:20px 32px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                &copy; ${year} Saraha App. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
