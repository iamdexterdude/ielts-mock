// Minimal Telegram Bot API client. Reads TELEGRAM_BOT_TOKEN and
// TELEGRAM_CHAT_ID from the environment. With DRY_RUN=1 (or no token) it
// prints messages to the console instead of sending them.

const LIMIT = 4000; // Telegram caps messages at 4096 characters

function config() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const dry = process.env.DRY_RUN === '1' || !token || !chatId;
  return { token, chatId, dry };
}

async function call(method, init) {
  const { token } = config();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    const err = new Error(`Telegram ${method} failed: ${res.status} ${body.description || ''}`.trim());
    err.status = res.status;
    throw err;
  }
  return body.result;
}

// Split long text on paragraph, then line, then word boundaries.
export function chunk(text, limit = LIMIT) {
  const out = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n\n', limit);
    if (cut < limit * 0.5) cut = rest.lastIndexOf('\n', limit);
    if (cut < limit * 0.5) cut = rest.lastIndexOf(' ', limit);
    if (cut <= 0) cut = limit;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\s+/, '');
  }
  if (rest) out.push(rest);
  return out;
}

export async function sendMessage(html) {
  const { chatId, dry } = config();
  for (const part of chunk(html)) {
    if (dry) {
      console.log(`\n[telegram:dry-run] message\n${part}\n`);
      continue;
    }
    const payload = { chat_id: chatId, text: part, parse_mode: 'HTML', link_preview_options: { is_disabled: true } };
    try {
      await call('sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (err) {
      // A malformed-HTML rejection shouldn't lose the content: resend as plain text.
      if (err.status !== 400) throw err;
      const plain = part.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      await call('sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: plain }) });
    }
  }
}

export async function sendDocument(filename, content, captionHtml) {
  const { chatId, dry } = config();
  if (dry) {
    console.log(`\n[telegram:dry-run] document ${filename} (${content.length} bytes)\n${captionHtml}\n`);
    return;
  }
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption', captionHtml.slice(0, 1000));
  form.append('parse_mode', 'HTML');
  form.append('document', new Blob([content], { type: 'text/html' }), filename);
  await call('sendDocument', { method: 'POST', body: form });
}

export const escapeHtml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
