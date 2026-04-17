import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { RawConfig, XwCommitConfig } from '../types/config';
import { ConfigValidationError, validateConfig } from './configSchema';

export class ConfigNotFoundError extends Error {
  constructor(public readonly configPath: string) {
    super(`未找到配置文件：${configPath}`);
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigParseError extends Error {
  constructor(public readonly configPath: string, public readonly cause: Error) {
    super(`配置文件 JSON 解析失败：${configPath}`);
    this.name = 'ConfigParseError';
  }
}

export function getConfigPath(): string {
  return path.join(os.homedir(), '.xai', 'config.json');
}

export function getPromptDocPath(): string {
  return path.join(os.homedir(), '.xai', 'doc.md');
}

async function loadPromptFromDoc(): Promise<string | null> {
  const docPath = getPromptDocPath();
  try {
    const content = await fs.promises.readFile(docPath, 'utf8');
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<XwCommitConfig> {
  const configPath = getConfigPath();
  let raw: string;
  try {
    raw = await fs.promises.readFile(configPath, 'utf8');
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      throw new ConfigNotFoundError(configPath);
    }
    throw new Error(`读取配置文件失败：${e.message}`);
  }

  let parsed: RawConfig;
  try {
    parsed = JSON.parse(raw) as RawConfig;
  } catch (err) {
    throw new ConfigParseError(configPath, err as Error);
  }

  let config: import('../types/config').XwCommitConfig;
  try {
    config = validateConfig(parsed);
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      throw err;
    }
    throw new ConfigValidationError((err as Error).message);
  }

  const docPrompt = await loadPromptFromDoc();
  if (docPrompt) {
    config = { ...config, prompt: docPrompt };
  }

  if (!config.prompt) {
    throw new ConfigValidationError(
      '未找到提示词：请在 ~/.xai/doc.md 中编写提示词，或在 config.json 中配置 prompt 字段'
    );
  }

  return config;
}
