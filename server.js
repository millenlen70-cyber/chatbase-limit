const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());

// load data counter user
let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
const LIMIT = 3;

// helper save
function save() {
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

// WhatsApp webhook
app.post('/webhook', async (req, res) => {
  const wa = req.body.from;               // nomor WA pengirim
  const message = req.body.message || ''; // pesan user

  if (!wa) return res.sendStatus(200);

  // pastikan ada counter
  if (!data[wa]) data[wa] = 0;

  // jika sudah lewat limit
  if (data[wa] >= LIMIT) {
    // bot harus benar-benar diam
    return res.sendStatus(204);
  }

  // tambahkan counter
  data[wa] += 1;
  save();

  // PANGGIL CHATBASE DI SINI
  const reply = await callChatbase(message, wa);

  // KIRIM balik ke WhatsApp Provider (Twilio/360/etc)
  await sendToWhatsApp(wa, reply);

  return res.sendStatus(200);
});

// --- Dummy function: isi sesuai API Chatbase ---
async function callChatbase(text, wa) {
  // sesuaikan endpoint Chatbase kamu
  return "jawaban dari bot";
}

// --- Dummy function: sesuaikan provider WA ---
async function sendToWhatsApp(to, text) {
  console.log("Balas ke WA:", to, text);
}

app.listen(3000, () => console.log("Bot WA jalan di port 3000"));
