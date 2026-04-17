import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import type { XwCommitConfig } from '../types/config';
import type { ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from '../types/llm';

export class LLMRequestError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'LLMRequestError';
  }
}

export class LLMTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`请求后端超时（${timeoutMs}ms）`);
    this.name = 'LLMTimeoutError';
  }
}

function resolveEndpoint(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, '');
  if (/\/chat\/completions$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}/chat/completions`;
}

function postJson(
  endpoint: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      reject(new LLMRequestError(`后端地址非法：${endpoint}`));
      return;
    }

    const transport = url.protocol === 'http:' ? http : https;
    const req = transport.request(
      {
        method: 'POST',
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'http:' ? 80 : 443),
        path: `${url.pathname}${url.search}`,
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body).toString(),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    const timer = setTimeout(() => {
      req.destroy(new LLMTimeoutError(timeoutMs));
    }, timeoutMs);
    timer.unref?.();

    req.on('error', (err) => {
      clearTimeout(timer);
      if (err instanceof LLMTimeoutError) {
        reject(err);
      } else {
        reject(new LLMRequestError(`请求后端失败：${err.message}`));
      }
    });
    req.on('close', () => clearTimeout(timer));

    req.write(body);
    req.end();
  });
}

export async function requestChatCompletion(
  config: XwCommitConfig,
  messages: ChatMessage[]
): Promise<ChatCompletionResponse> {
  const endpoint = resolveEndpoint(config.baseURL);
  const payload: ChatCompletionRequest = {
    model: config.model,
    temperature: config.temperature,
    messages,
  };
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const { statusCode, body: respBody } = await postJson(endpoint, body, headers, config.timeoutMs);

  if (statusCode < 200 || statusCode >= 300) {
    let hint = '';
    if (statusCode === 401) hint = '后端返回 401 未授权，请检查 apiKey';
    else if (statusCode === 403) hint = '后端返回 403 禁止访问，请检查账号权限';
    else if (statusCode >= 500) hint = `后端返回 ${statusCode} 服务异常`;
    else hint = `后端返回 HTTP ${statusCode}`;
    throw new LLMRequestError(hint, statusCode);
  }

  try {
    return JSON.parse(respBody) as ChatCompletionResponse;
  } catch {
    throw new LLMRequestError('后端响应不是合法 JSON');
  }
}
