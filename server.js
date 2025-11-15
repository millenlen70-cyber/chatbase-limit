// server.js (safe version for Render)
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');
const LIMIT = parseInt(process.env.INTERACTION_LIMIT || '3', 10);
const CHATBASE_KEY = process.env.CHATBASE_KEY || '';

// ensure data.json exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');

// load/save helpers
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}'); }
  catch (e) { console.error('read data error', e); return {}; }
}
function saveData(obj) {
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) { console.error('save data error', e); }
}

// placeholder: call Chatbase (ganti endpoint/body sesuai dokumentasi akunmu)
async function callChatbase(text, wa) {
  if (!CHATBASE_KEY) return { text: `Mock reply: ${text}` };
  try {
    const resp = await axios.post(
      'https://api.chatbase.co/v1/message', // sesuaikan kalau berbeda
      { messages: [{ role: 'user', content: text }], user: wa },
      { headers: { Authorization: `Bearer ${CHATBASE_KEY}` }, timeout: 8000 }
    );
    return resp.data;
  } catch (err) {
    console.error('Chatbase error', err?.response?.data || err.message || err);
    return { text: 'Maaf, layanan chat bermasalah.' };
  }
}

// placeholder: kirim balasan ke WA provider (implementasikan sesuai provider kamu)
async function sendToWhatsApp(to, reply) {
  // contoh: axios.post(providerUrl, { to, text: reply.text }, { headers: {...} })
  console.log('SEND_TO_WA', to, reply);
}

app.post('/webhook', async (req, res) => {
  try {
    // terima beberapa format body yang umum
    const wa = (req.body && (req.body.from || req.body.sender || req.body.wa)) || req.query?.sender;
    const message = (req.body && (req.body.message || req.body.text || req.body.body)) || req.query?.message || '';

    if (!wa) {
      console.warn('Webhook dipanggil tanpa nomor WA, ignore');
      return res.sendStatus(200);
    }

    const data = loadData();
    data[wa] = data[wa] || 0;

    if (data[wa] >= LIMIT) {
      console.log(`User ${wa} sudah mencapai limit (${data[wa]}). Returning 204.`);
      return res.sendStatus(204); // silent
    }

    data[wa] += 1;
    saveData(data);

    const reply = await callChatbase(message, wa);
    await sendToWhatsApp(wa, reply);

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error', err);
    // fallback: jangan crash server — kembalikan 200 + pesan error (atau 204 sesuai kebijakan)
    return res.status(200).json({ reply: { text: 'Server error, coba lagi nanti.' } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
