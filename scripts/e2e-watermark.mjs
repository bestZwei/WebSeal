// 端到端验证：截图(中文水印) -> 保存PNG -> 回传提取 -> 比对
const BASE = process.env.BASE_URL || 'http://localhost:3456';
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
console.log('signature status: signed =', extracted.signed, ', verified =', extracted.signatureVerified);
console.log('imageHash:', (extracted.imageHash ?? '').slice(0, 16) + '...');
const sigOk = extracted.signed ? extracted.signatureVerified === true : true;

// TSA 凭证回传验证（若服务配置了 TSA 且返回了凭证）
let tsaOk = true;
if (shot.tsa) {
  console.log('TSA genTime:', shot.tsa.genTime);
  const form2 = new FormData();
  form2.append('image', new Blob([png], { type: 'image/png' }), 'shot.png');
  form2.append('tsaTokenFile', new Blob([
    JSON.stringify({ token: shot.tsa.token, genTime: shot.tsa.genTime, hashHex: shot.tsa.hashHex }),
  ], { type: 'application/json' }), 'shot.tsa.json');
  const res2 = await fetch(`${BASE}/api/extract-watermark`, { method: 'POST', body: form2 });
  const j2 = await res2.json();
  console.log('TSA verify response:', JSON.stringify(j2.tsa));
  tsaOk = j2.tsa?.hashMatch === true && !!j2.tsa?.genTime;
} else {
  console.log('TSA: 未配置或未返回凭证（best-effort 模式）');
}

console.log(ok && sigOk && tsaOk ? 'E2E PASS' : 'E2E FAIL');
process.exit(ok && sigOk && tsaOk ? 0 : 1);
