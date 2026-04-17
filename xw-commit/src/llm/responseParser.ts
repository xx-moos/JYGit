import type { ChatCompletionResponse } from '../types/llm';

export class ResponseParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseParseError';
  }
}

const PARAGRAPH_MARKERS = ['：', ':', '。', '.'];

function looksLikeExplanation(line: string): boolean {
  if (line.length > 200) return true;
  for (const prefix of ['说明', '解释', '以下是', '这是', 'Here is', 'Here\'s', 'Explanation', 'Note:', 'NOTE:']) {
    if (line.startsWith(prefix)) return true;
  }
  return false;
}

function stripWrappingQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'') || (first === '`' && last === '`')) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

export function extractCommitMessage(response: ChatCompletionResponse): string {
  if (!response.choices || response.choices.length === 0) {
    throw new ResponseParseError('后端响应缺少 choices 字段');
  }
  const first = response.choices[0];
  if (!first.message || typeof first.message.content !== 'string') {
    throw new ResponseParseError('后端响应缺少 choices[0].message.content');
  }
  const content = first.message.content;
  const cleaned = stripWrappingQuotes(content).trim();
  if (cleaned.length === 0) {
    throw new ResponseParseError('后端返回的提交信息为空');
  }

  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new ResponseParseError('后端返回的提交信息为空');
  }

  if (lines.length === 1) {
    const only = lines[0];
    if (looksLikeExplanation(only)) {
      throw new ResponseParseError('后端返回的是解释性段落，不是可用的提交信息');
    }
    return only;
  }

  const first_line = lines[0];
  if (looksLikeExplanation(first_line)) {
    for (const line of lines.slice(1)) {
      if (!looksLikeExplanation(line) && line.length > 0 && line.length <= 200) {
        return line;
      }
    }
    throw new ResponseParseError('后端返回的是解释性段落，不是可用的提交信息');
  }
  const hasBreak = lines.some((l) => PARAGRAPH_MARKERS.some((m) => l.endsWith(m)));
  if (hasBreak || lines.length > 4) {
    return first_line;
  }
  return lines.join('\n');
}
