'use strict';

/**
 * #30 — Kullanıcı e-posta değişikliği ile şifre sıfırlama aynı kolonu eziyordu.
 *
 * Sorun: `User` modelinde `pendingEmail` / `emailChangeToken` alanları olmadığı için
 * `src/controllers/user.controller.js` → `requestEmailChange`, `passwordResetToken`
 * kolonunu repurpose ediyordu (token'ın içine OTP hash'i + base64 hedef adres
 * gömülüyordu). Aynı kolonu `auth.controller.js` → `forgotPassword` da yazdığı için iki
 * akış birbirini bozuyordu: kullanıcı e-posta değişikliği isteyip sonra "şifremi
 * unuttum" derse (veya tersi) önceki akış sessizce geçersizleşiyordu.
 *
 * Karar: **ayrı kolonlar** (`salons` tablosundaki aynı desen — `…15` migration'ı
 * `salons` için `pending_email`, `email_change_token`, `email_change_token_expiry`
 * eklemişti). Şifre sıfırlama akışının kolonlarına (`password_reset_token`,
 * `password_reset_token_expiry`) dokunulmaz; davranışı değişmez.
 *
 *   users.pending_email              → onay bekleyen hedef adres
 *   users.email_change_token         → OTP'nin bcrypt hash'i (yalnız hash saklanır)
 *   users.email_change_token_expiry  → 10 dakikalık geçerlilik
 *
 * Idempotent: kolonlar `describeTable` ile kontrol edilir; kısmen uygulanmış şemada
 * tekrar çalıştırmak hata vermez.
 *
 * Geri alma (`db:migrate:undo`): üç kolonu `removeColumn` ile **geri alır**. Kolonlar
 * yalnız bu akış tarafından yazıldığı için DROP, işlevsel veri kaybı üretmez; akış
 * kolonlar yokken `requestEmailChange`'te hata verir (sessiz yanlış davranış yok).
 */

const COLUMNS = {
  pending_email: {
    type: 'STRING',
    allowNull: true,
  },
  email_change_token: {
    type: 'STRING',
    allowNull: true,
  },
  email_change_token_expiry: {
    type: 'DATE',
    allowNull: true,
  },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.describeTable('users');

    for (const [name, definition] of Object.entries(COLUMNS)) {
      if (existing[name]) continue;
      await queryInterface.addColumn('users', name, {
        type: Sequelize[definition.type],
        allowNull: definition.allowNull,
      });
    }
  },

  async down(queryInterface) {
    const existing = await queryInterface.describeTable('users');

    for (const name of Object.keys(COLUMNS).reverse()) {
      if (!existing[name]) continue;
      await queryInterface.removeColumn('users', name);
    }
  },
};
