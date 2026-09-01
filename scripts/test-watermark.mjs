// 临时验证脚本：中文水印 嵌入->提取 闭环测试
import sharp from 'sharp';
import { addWatermark, extractWatermark } from '../src/lib/watermark.ts';

const cases = [
  { timestamp: '2026-09-01T10:00:00.000Z', customText: '', url: 'https://example.com' },
  { timestamp: '2026-09-01T10:00:00.000Z', customText: '公司名称：某某科技有限公司 证据编号：#20260901', url: 'https://example.com/page?x=1' },
  { timestamp: '2026-09-01T10:00:00.000Z', customText: 'Mixed 中英混合 test 123', url: 'https://例え.jp/路径' },
];

let failed = 0;
for (const [i, data] of cases.entries()) {
  const img = await sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 100, g: 150, b: 200 } },
  }).png().toBuffer();

  const watermarked = await addWatermark(img, data);
  const extracted = await extractWatermark(watermarked);

  const ok = extracted !== null &&
    extracted.timestamp === data.timestamp &&
    extracted.customText === data.customText &&
    extracted.url === data.url;
  if (!ok) failed++;
  console.log(`case ${i + 1}: ${ok ? 'PASS' : 'FAIL'}`);
  console.log('  expected:', JSON.stringify(data));
  console.log('  extracted:', JSON.stringify(extracted));
}
process.exit(failed ? 1 : 0);
