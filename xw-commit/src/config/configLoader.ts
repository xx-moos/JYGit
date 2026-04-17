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
  return path.join(os.homedir(), '.xw-commit', 'config.json');
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

  try {
    return validateConfig(parsed);
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      throw err;
    }
    throw new ConfigValidationError((err as Error).message);
  }
}
