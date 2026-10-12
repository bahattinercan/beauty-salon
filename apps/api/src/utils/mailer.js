const nodemailer = require('nodemailer');

const isTest = process.env.NODE_ENV === 'test';
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test veya SMTP'siz dev ortamında mail fiilen gönderilmez; akışın 500 dönmesi önlenir.
const deliver = async (payload) => {
  if (isTest || !smtpConfigured) {
    console.log('[mailer:noop] ' + payload.to + ' | ' + payload.subject);
    return;
  }
  await transporter.sendMail(payload);
};

const sendEmailChangeOtp = async (toEmail, salonName, otp) => {
  await deliver({
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
  await deliver({
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
  await deliver({
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
