const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailChangeOtp = async (toEmail, salonName, otp) => {
  await transporter.sendMail({
    from: `"Beauty Salon" <${process.env.SMTP_FROM || 'noreply@beautysalon.com'}>`,
    to: toEmail,
    subject: 'E-posta Değişikliği Doğrulama Kodu',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#c47f8e;">Merhaba ${salonName} 👋</h2>
        <p>E-posta adresinizi değiştirmek için aşağıdaki <strong>6 haneli doğrulama kodunu</strong> kullanın:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#fdf0f2;border-radius:8px;color:#c47f8e;">
          ${otp}
        </div>
        <p style="color:#999;font-size:13px;margin-top:16px;">Bu kod <strong>10 dakika</strong> geçerlidir. Eğer bu isteği siz yapmadıysanız görmezden gelebilirsiniz.</p>
      </div>
    `,
  });
};

const sendPasswordChangedEmail = async (toEmail, fullName) => {
  await transporter.sendMail({
    from: `"Beauty Salon" <${process.env.SMTP_FROM || 'noreply@beautysalon.com'}>`,
    to: toEmail,
    subject: 'Şifreniz Değiştirildi',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#c47f8e;">Merhaba ${fullName} 👋</h2>
        <p>Hesabınızın şifresi başarıyla değiştirildi.</p>
        <p style="color:#999;font-size:13px;margin-top:16px;">Bu işlemi siz yapmadıysanız lütfen hemen destek ekibimizle iletişime geçin.</p>
        <p style="color:#c47f8e;font-weight:bold;margin-top:8px;">Beauty Salon Ekibi</p>
      </div>
    `,
  });
};

const sendPasswordResetOtp = async (toEmail, fullName, otp) => {
  await transporter.sendMail({
    from: `"Beauty Salon" <${process.env.SMTP_FROM || 'noreply@beautysalon.com'}>`,
    to: toEmail,
    subject: 'Şifre Sıfırlama Kodu',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#c47f8e;">Merhaba ${fullName} 👋</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki <strong>6 haneli kodu</strong> kullanın:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#fdf0f2;border-radius:8px;color:#c47f8e;">
          ${otp}
        </div>
        <p style="color:#999;font-size:13px;margin-top:16px;">Bu kod <strong>10 dakika</strong> geçerlidir. Eğer bu isteği siz yapmadıysanız görmezden gelebilirsiniz.</p>
      </div>
    `,
  });
};

module.exports = { sendEmailChangeOtp, sendPasswordChangedEmail, sendPasswordResetOtp };
