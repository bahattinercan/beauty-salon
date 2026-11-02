/**
 * SMS gönderimi.
 * - TWILIO_* env tanımlı değilse: geliştirme modu, OTP terminale yazılır.
 * - TWILIO_* tanımlı ama `twilio` paketi yüklenemiyor ya da gönderim başarısız:
 *   hata FIRLATILMAZ; loglanır ve `null` döner. Böylece OTP akışı 500 üretmez (#21).
 */
const devLog = (toPhone, otp) => {
  console.log(`\n📱 [SMS DEV] Alıcı: ${toPhone}  |  OTP: ${otp}\n`);
};

const sendSmsOtp = async (toPhone, otp) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    // Geliştirme ortamı — terminalde OTP'yi göster
    devLog(toPhone, otp);
    return null;
  }

  let twilio;
  try {
    twilio = require('twilio');
  } catch (err) {
    console.warn(`[SMS] twilio paketi yüklü değil, SMS devre dışı: ${err.message}`);
    return null;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: `Beauty Salon doğrulama kodunuz: ${otp} (10 dakika geçerli)`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
    return message && message.sid ? message.sid : null;
  } catch (err) {
    console.error('[SMS] Gönderim hatası (akış devam eder):', err.message);
    return null;
  }
};

module.exports = { sendSmsOtp };
