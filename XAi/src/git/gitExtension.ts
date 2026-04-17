import * as vscode from 'vscode';

export interface GitInputBox {
  value: string;
}

export interface GitChange {
  uri: vscode.Uri;
  originalUri: vscode.Uri;
  renameUri?: vscode.Uri;
  status: number;
}

export interface GitRepositoryState {
  readonly HEAD: { name?: string; commit?: string; type?: number } | undefined;
  readonly indexChanges: GitChange[];
  readonly workingTreeChanges: GitChange[];
  readonly untrackedChanges: GitChange[];
  readonly mergeChanges: GitChange[];
}

export interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: GitInputBox;
  readonly state: GitRepositoryState;
  diff(cached?: boolean): Promise<string>;
  diffWithHEAD(): Promise<string>;
  diffIndexWithHEAD(): Promise<string>;
  status(): Promise<void>;
}

export interface GitAPI {
  readonly repositories: GitRepository[];
  getRepository(uri: vscode.Uri): GitRepository | null;
}

export interface GitExtensionExports {
  getAPI(version: 1): GitAPI;
  enabled: boolean;
}

export class GitExtensionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitExtensionUnavailableError';
  }
}

export async function getGitAPI(): Promise<GitAPI> {
  const extension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
  if (!extension) {
    throw new GitExtensionUnavailableError('未找到 VS Code 内置 Git 扩展，无法访问 Git 能力');
  }
  const exports = extension.isActive ? extension.exports : await extension.activate();
  if (!exports.enabled) {
    throw new GitExtensionUnavailableError('VS Code 内置 Git 扩展未启用，请先启用 git.enabled');
  }
  return exports.getAPI(1);
}
