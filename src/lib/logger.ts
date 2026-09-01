/**
 * 结构化日志：单行 JSON 输出，便于容器环境采集与检索。
 * 约定：
 * - error → console.error（触发监控告警）
 * - info/warn → console.log
 * - 只记录事件名 + 必要元数据，不打印完整用户输入（URL 仅记 hostname，避免敏感信息入日志）
 */

type Level = 'info' | 'warn' | 'error';

function emit(level: Level, event: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => emit('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => emit('error', event, meta),
};

/** 从 URL 提取用于日志的主机名，解析失败返回原始截断字符串 */
export function logSafeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 100);
  }
}
