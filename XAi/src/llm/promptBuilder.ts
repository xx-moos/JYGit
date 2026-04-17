import type { XwCommitConfig } from '../types/config';
import type { RepoChangeSummary } from '../types/git';
import type { ChatMessage } from '../types/llm';

const TRUNCATION_SUFFIX = '\n...[diff truncated]';

interface Section {
  header: string;
  body: string;
}

function composeSections(summary: RepoChangeSummary): Section[] {
  const sections: Section[] = [];
  if (summary.stagedDiff.trim().length > 0) {
    sections.push({ header: '[staged diff]', body: summary.stagedDiff });
  }
  if (summary.unstagedDiff.trim().length > 0) {
    sections.push({ header: '[unstaged diff]', body: summary.unstagedDiff });
  }
  if (summary.untrackedSummary.trim().length > 0) {
    sections.push({ header: '[untracked files]', body: summary.untrackedSummary });
  }
  return sections;
}

export function buildUserContent(summary: RepoChangeSummary, maxDiffChars: number): string {
  const header =
    `仓库: ${summary.repoName}\n` +
    `分支: ${summary.branch}\n` +
    `模式: allChanges\n` +
    `统计: staged=${summary.stagedCount}, unstaged=${summary.unstagedCount}, untracked=${summary.untrackedCount}\n` +
    `以下是当前仓库改动，请生成一条提交信息：\n`;

  const sections = composeSections(summary);
  if (sections.length === 0) {
    return `${header}\n(no textual diff available)`;
  }

  const parts: string[] = [];
  let used = 0;
  let truncated = false;

  for (const section of sections) {
    if (truncated) break;
    const headerBlock = `\n${section.header}\n`;
    if (used + headerBlock.length >= maxDiffChars) {
      truncated = true;
      break;
    }
    parts.push(headerBlock);
    used += headerBlock.length;

    const remaining = maxDiffChars - used;
    if (section.body.length <= remaining) {
      parts.push(section.body);
      used += section.body.length;
    } else {
      parts.push(section.body.slice(0, Math.max(0, remaining)));
      truncated = true;
      break;
    }
  }

  let content = header + parts.join('');
  if (truncated) {
    content += TRUNCATION_SUFFIX;
  }
  return content;
}

export function buildMessages(config: XwCommitConfig, summary: RepoChangeSummary): ChatMessage[] {
  return [
    { role: 'system', content: config.prompt },
    { role: 'user', content: buildUserContent(summary, config.maxDiffChars) },
  ];
}
