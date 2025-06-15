export function downloadImage(dataUrl: string, filename: string = 'webseal-screenshot.png') {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('下载失败，请稍后重试');
  }
}

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Shanghai'
    });
  } catch (error) {
    return timestamp;
  }
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function generateFilename(url?: string, timestamp?: string): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  if (url) {
    try {
      const domain = new URL(url).hostname.replace(/\./g, '-');
      return `webseal-${domain}-${dateStr}-${timeStr}.png`;
    } catch {
      return `webseal-${dateStr}-${timeStr}.png`;
    }
  }
  
  return `webseal-screenshot-${dateStr}-${timeStr}.png`;
}
