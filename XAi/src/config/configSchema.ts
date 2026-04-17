import type { GitDiffMode, RawConfig, XwCommitConfig } from '../types/config';

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_DIFF_CHARS = 12000;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_DIFF_MODE: GitDiffMode = 'allChanges';

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ConfigValidationError(`配置字段 ${field} 必须是非空字符串`);
  }
  return value.trim();
}

function validateBaseURL(value: unknown): string {
  const str = requireNonEmptyString(value, 'baseURL');
  let parsed: URL;
  try {
    parsed = new URL(str);
  } catch {
    throw new ConfigValidationError('配置字段 baseURL 不是合法的 URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigValidationError('配置字段 baseURL 必须使用 http 或 https 协议');
  }
  return str.replace(/\/+$/, '');
}

function validatePositiveNumber(value: unknown, field: string, fallback: number): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ConfigValidationError(`配置字段 ${field} 必须是大于 0 的数字`);
  }
  return value;
}

function validateTemperature(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_TEMPERATURE;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2) {
    throw new ConfigValidationError('配置字段 temperature 必须在 0 到 2 之间');
  }
  return value;
}

function validateDiffMode(value: unknown): GitDiffMode {
  if (value === undefined || value === null) {
    return DEFAULT_DIFF_MODE;
  }
  if (value !== 'allChanges') {
    throw new ConfigValidationError('配置字段 gitDiffMode 一期仅支持 allChanges');
  }
  return 'allChanges';
}

export function validateConfig(raw: RawConfig): XwCommitConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new ConfigValidationError('配置内容必须是 JSON 对象');
  }
  return {
    baseURL: validateBaseURL(raw.baseURL),
    apiKey: requireNonEmptyString(raw.apiKey, 'apiKey'),
    model: requireNonEmptyString(raw.model, 'model'),
    prompt: raw.prompt !== undefined && raw.prompt !== null
      ? requireNonEmptyString(raw.prompt, 'prompt')
      : '',
    timeoutMs: validatePositiveNumber(raw.timeoutMs, 'timeoutMs', DEFAULT_TIMEOUT_MS),
    maxDiffChars: validatePositiveNumber(raw.maxDiffChars, 'maxDiffChars', DEFAULT_MAX_DIFF_CHARS),
    temperature: validateTemperature(raw.temperature),
    gitDiffMode: validateDiffMode(raw.gitDiffMode),
  };
}
