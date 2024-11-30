const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const app = express();

const token = '7755272037:AAEOZ9e-3pC8y2SbSxLRXgMfp35F-aeo9EY'; // Ganti dengan token bot kamu
const telegramApiUrl = `https://api.telegram.org/bot${token}/`;

app.use(express.json());

app.post(`/webhook/${token}`, async (req, res) => {
  const update = req.body;

  if (update.message) {
    const chatId = update.message.chat.id;

    // Menangani perintah teks
    if (update.message.text) {
      const command = update.message.text;

      if (command === '/start') {
        await sendMessage(chatId, '👋 Hallo pelajar, Selamat datang di bot Nitah! Silahkan kirim foto soal pelajaran sekolah kamu.');
      } else if (command === '/informasi') {
        await sendMessage(chatId, 'Bot Nitah ini dirancang untuk membantu memproses gambar soal pelajaran sekolah kamu dan mencari jawaban dengan cepat. Cukup kirimkan gambar soalmu, dan Nitah akan memproses untuk memberikan jawaban yang cepat dan tepat!');
      } else if (command === '/tentang') {
        await sendMessage(chatId, 'Bot Nitah ini dibuat oleh Zakia dengan tujuan untuk membantu pelajar dalam menyelesaikan soal pelajaran secara cepat dan tepat. Cukup kirimkan foto soal, dan Nitah akan mencari jawaban untuk kamu.\n\n' +
          'Untuk informasi lebih lanjut, kunjungi situs kami: 🌐 https://nitah.web.id\n' +
          'Dukung kami melalui: ✨ https://saweria.co/zakiakaidzan');
      }
    }

    // Menangani pengiriman gambar
    if (update.message.photo) {
      try {
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
            await sendPhoto(chatId, 'https://img-9gag-fun.9cache.com/photo/ayNeMQb_460swp.webp');
          } else {
            
          }
          // Stop respon di sini jika ada error
        }
      } catch (error) {
        console.error('Error:', error);
        return res.sendStatus(200); // Jangan kirim pesan pada error umum
      }
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

// Fungsi untuk mengirim foto ke Telegram
async function sendPhoto(chatId, photoUrl) {
  await fetch(`${telegramApiUrl}sendPhoto`, {
    method: 'POST',
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl }),
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
