const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const app = express();

const token = '7755272037:AAEOZ9e-3pC8y2SbSxLRXgMfp35F-aeo9EY'; // Ganti dengan token bot kamu
const telegramApiUrl = `https://api.telegram.org/bot${token}/`;

app.use(express.json());

app.post(`/webhook/${token}`, async (req, res) => {
  const update = req.body;

  if (update.message && update.message.photo) {
    const chatId = update.message.chat.id;

    try {
      // Dapatkan file_id gambar yang dikirim
      const fileId = update.message.photo[update.message.photo.length - 1].file_id;
      const fileUrl = await getTelegramFileUrl(fileId);

      // Ambil gambar dari Telegram
      const buffer = await fetch(fileUrl).then((res) => res.buffer());
      const randomFilename = generateRandomFilename();

      // Persiapkan form-data untuk kirim gambar
      const form = new FormData();
      form.append('file', buffer, { filename: randomFilename });

      const apiUrl = 'https://nitahai.vercel.app/asisten';
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      const apiResult = await apiResponse.json();

      // Jika API berhasil
      if (apiResult.ok) {
        await sendMessage(chatId, '✨ Nitah sudah menemukan jawabannya.');
        await sendMessage(chatId, apiResult.text || 'Gambar berhasil diproses!');
      }

      // Jika terdapat error pada API
      if (apiResult.error) {
        if (apiResult.error === 'Request timed out. Please try again later.') {
          await sendMessage(
            chatId,
            'Terjadi kesalahan pada server, tidak dapat menghubungi asisten untuk memproses gambar. Silakan kirim foto soal yang lain.'
          );
        } else {
          await sendMessage(chatId, `Error: ${apiResult.error}`);
        }
        return res.sendStatus(200); // Stop respon di sini jika ada error
      }
    } catch (error) {
      console.error('Error:', error);
      return res.sendStatus(200); // Jangan kirim pesan pada error umum
    }
  }

  res.sendStatus(200);
});

// Fungsi untuk mendapatkan URL file gambar dari Telegram
async function getTelegramFileUrl(fileId) {
  const response = await fetch(`${telegramApiUrl}getFile?file_id=${fileId}`);
  const data = await response.json();
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

// Fungsi untuk mengirim pesan ke Telegram
async function sendMessage(chatId, text) {
  await fetch(`${telegramApiUrl}sendMessage`, {
    method: 'POST',
    body: JSON.stringify({ chat_id: chatId, text }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Fungsi untuk menghasilkan nama file acak
function generateRandomFilename() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + '.jpg';
}

// Fungsi untuk mengatur webhook Telegram
async function setWebhook() {
  const url = `https://nitah.vercel.app/webhook/${token}`; // Ganti dengan domain Vercel kamu
  try {
    const response = await fetch(`${telegramApiUrl}setWebhook?url=${url}`);
    const result = await response.json();
    if (result.ok) {
      console.log(`Webhook set to: ${url}`);
    } else {
      console.log('Webhook setup failed:', result.description);
    }
  } catch (error) {
    console.error('Failed to set webhook:', error);
  }
}

setWebhook();

module.exports = app; // Ekspor app untuk Vercel
