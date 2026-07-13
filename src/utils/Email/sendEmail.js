import nodemailer from "nodemailer"


export const sendEmail=async({to,subject,html})=>{
  try {
    console.log("sendEmail received 'to':", JSON.stringify(to))
    const transporter = nodemailer.createTransport({
      host: "",
      port: 1500,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });


    const info = await transporter.sendMail({
      from: `"Saraha App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });


    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send email:", err.message);
    throw err;
  }
};