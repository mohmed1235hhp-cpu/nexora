const required = [
  'GEMINI_API_KEY',
  'OPENROUTER_MEDIA_API_KEY',
  'OPENROUTER_CODE_API_KEY',
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is missing`);
}

async function get(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  return { ok: res.ok, status: res.status, body };
}

const gemini = await get(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`);
console.log(`Gemini auth: ${gemini.ok ? 'OK' : `FAILED (${gemini.status})`}`);
if (!gemini.ok) console.log(gemini.body?.error?.message || gemini.body?.raw || 'unknown error');

const media = await get('https://openrouter.ai/api/v1/models', { Authorization: `Bearer ${process.env.OPENROUTER_MEDIA_API_KEY}` });
console.log(`OpenRouter media key: ${media.ok ? 'OK' : `FAILED (${media.status})`}`);
if (!media.ok) console.log(media.body?.error?.message || media.body?.raw || 'unknown error');
else {
  const ids = new Set((media.body?.data || []).map(m => m.id));
  for (const id of [process.env.OPENROUTER_QWEN_CHAT_MODEL || 'qwen/qwen3.5-122b-a10b', process.env.OPENROUTER_QWEN_IMAGE_MODEL || 'qwen/qwen-image-3-pro']) {
    console.log(`  ${id}: ${ids.has(id) ? 'available' : 'not listed (check current model slug)'}`);
  }
}

const code = await get('https://openrouter.ai/api/v1/models', { Authorization: `Bearer ${process.env.OPENROUTER_CODE_API_KEY}` });
console.log(`OpenRouter code key: ${code.ok ? 'OK' : `FAILED (${code.status})`}`);
if (!code.ok) console.log(code.body?.error?.message || code.body?.raw || 'unknown error');
else {
  const ids = new Set((code.body?.data || []).map(m => m.id));
  const id = process.env.OPENROUTER_CODE_MODEL || 'anthropic/claude-sonnet-5';
  console.log(`  ${id}: ${ids.has(id) ? 'available' : 'not listed (check current model slug)'}`);
}

if (!gemini.ok || !media.ok || !code.ok) process.exitCode = 1;
