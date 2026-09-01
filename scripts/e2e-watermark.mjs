// 端到端验证：截图(中文水印) -> 保存PNG -> 回传提取 -> 比对
const BASE = 'http://localhost:3456';
const customText = '证据编号：测试-20260901 公司：某某科技';

const shotRes = await fetch(`${BASE}/api/screenshot`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com', customText }),
});
const shot = await shotRes.json();
if (!shot.success) { console.log('screenshot FAIL:', JSON.stringify(shot)); process.exit(1); }
console.log('screenshot OK, customText echo:', shot.customText);

const png = Buffer.from(shot.imageUrl.split(',')[1], 'base64');
console.log('PNG size:', (png.length / 1024 / 1024).toFixed(2), 'MB');

const form = new FormData();
form.append('image', new Blob([png], { type: 'image/png' }), 'shot.png');
const exRes = await fetch(`${BASE}/api/extract-watermark`, { method: 'POST', body: form });
const extracted = await exRes.json();
console.log('extract response:', JSON.stringify(extracted, null, 2));

const ok = extracted.success === true &&
  extracted.customText === customText &&
  extracted.url === 'https://example.com' &&
  extracted.timestamp === shot.timestamp;
console.log(ok ? 'E2E PASS' : 'E2E FAIL');
process.exit(ok ? 0 : 1);
