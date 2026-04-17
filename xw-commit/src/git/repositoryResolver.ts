import * as vscode from 'vscode';
import type { GitAPI, GitRepository } from './gitExtension';

export class NoRepositoryError extends Error {
  constructor() {
    super('当前窗口没有可用的 Git 仓库');
    this.name = 'NoRepositoryError';
  }
}

export function resolveCurrentRepository(
  api: GitAPI,
  scmSourceControl?: vscode.SourceControl
): GitRepository {
  if (api.repositories.length === 0) {
    throw new NoRepositoryError();
  }

  if (scmSourceControl?.rootUri) {
    const matched = api.getRepository(scmSourceControl.rootUri);
    if (matched) {
      return matched;
    }
  }

  const activeDoc = vscode.window.activeTextEditor?.document;
  if (activeDoc) {
    const matched = api.getRepository(activeDoc.uri);
    if (matched) {
      return matched;
    }
  }

  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    for (const folder of folders) {
      const matched = api.getRepository(folder.uri);
      if (matched) {
        return matched;
      }
    }
  }

  return api.repositories[0];
}
