import * as path from 'path';
import * as vscode from 'vscode';
import type { RepoChangeSummary } from '../types/git';
import type { GitChange, GitRepository } from './gitExtension';

const UNTRACKED_FILE_PREVIEW_BYTES = 2000;
const MAX_UNTRACKED_FILES_PREVIEW = 20;

function statusToLabel(status: number): string {
  switch (status) {
    case 0: return 'INDEX_MODIFIED';
    case 1: return 'INDEX_ADDED';
    case 2: return 'INDEX_DELETED';
    case 3: return 'INDEX_RENAMED';
    case 4: return 'INDEX_COPIED';
    case 5: return 'MODIFIED';
    case 6: return 'DELETED';
    case 7: return 'UNTRACKED';
    case 8: return 'IGNORED';
    case 9: return 'INTENT_TO_ADD';
    case 10: return 'TYPE_CHANGED';
    default: return `STATUS_${status}`;
  }
}

function toRelative(repoRoot: vscode.Uri, target: vscode.Uri): string {
  const rel = path.relative(repoRoot.fsPath, target.fsPath);
  return rel.length === 0 ? target.fsPath : rel.replace(/\\/g, '/');
}

async function buildUntrackedSummary(
  repo: GitRepository,
  changes: GitChange[]
): Promise<string> {
  if (changes.length === 0) {
    return '';
  }
  const lines: string[] = [];
  const limited = changes.slice(0, MAX_UNTRACKED_FILES_PREVIEW);
  for (const change of limited) {
    const rel = toRelative(repo.rootUri, change.uri);
    let preview = '';
    try {
      const stat = await vscode.workspace.fs.stat(change.uri);
      if (stat.type === vscode.FileType.File && stat.size <= UNTRACKED_FILE_PREVIEW_BYTES * 4) {
        const bytes = await vscode.workspace.fs.readFile(change.uri);
        const slice = bytes.slice(0, UNTRACKED_FILE_PREVIEW_BYTES);
        const text = Buffer.from(slice).toString('utf8');
        if (/[\x00-\x08\x0E-\x1F]/.test(text)) {
          preview = '[binary or non-text content]';
        } else {
          preview = text;
          if (bytes.length > UNTRACKED_FILE_PREVIEW_BYTES) {
            preview += '\n...[untracked file truncated]';
          }
        }
      } else {
        preview = `[skipped: size=${stat.size}]`;
      }
    } catch (err) {
      preview = `[unreadable: ${(err as Error).message}]`;
    }
    lines.push(`--- ${rel} (${statusToLabel(change.status)}) ---\n${preview}`);
  }
  if (changes.length > MAX_UNTRACKED_FILES_PREVIEW) {
    lines.push(`...还有 ${changes.length - MAX_UNTRACKED_FILES_PREVIEW} 个 untracked 文件未展示`);
  }
  return lines.join('\n\n');
}

export async function collectRepoChanges(repo: GitRepository): Promise<RepoChangeSummary> {
  const state = repo.state;

  const branch = state.HEAD?.name ?? '(detached)';
  const repoName = path.basename(repo.rootUri.fsPath);

  const [stagedDiff, unstagedDiff] = await Promise.all([
    state.indexChanges.length > 0 ? repo.diff(true).catch(() => '') : Promise.resolve(''),
    state.workingTreeChanges.length > 0 ? repo.diff(false).catch(() => '') : Promise.resolve(''),
  ]);

  const untrackedSummary = await buildUntrackedSummary(repo, state.untrackedChanges);

  const isEmpty =
    state.indexChanges.length === 0 &&
    state.workingTreeChanges.length === 0 &&
    state.untrackedChanges.length === 0;

  return {
    repoName,
    branch,
    stagedCount: state.indexChanges.length,
    unstagedCount: state.workingTreeChanges.length,
    untrackedCount: state.untrackedChanges.length,
    hasConflicts: false,
    stagedDiff,
    unstagedDiff,
    untrackedSummary,
    isEmpty,
  };
}
