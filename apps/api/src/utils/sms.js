/**
 * SMS gönderimi.
 * TWILIO_* env değişkenleri tanımlıysa gerçek SMS gönderir,
 * yoksa OTP'yi terminale yazar (geliştirme modu).
 */
const sendSmsOtp = async (toPhone, otp) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Beauty Salon doğrulama kodunuz: ${otp} (10 dakika geçerli)`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toPhone,
      });
    } catch (err) {
      console.error('[SMS] Gönderim hatası:', err.message);
      throw new Error('SMS gönderilemedi');
    }
  } else {
    // Geliştirme ortamı — terminalde OTP'yi göster
    console.log(`\n📱 [SMS DEV] Alıcı: ${toPhone}  |  OTP: ${otp}\n`);
  }
};

module.exports = { sendSmsOtp };
