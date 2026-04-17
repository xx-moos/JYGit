import * as vscode from 'vscode';

export function showInfo(message: string): void {
  vscode.window.showInformationMessage(`xw-commit：${message}`);
}

export function showWarn(message: string): void {
  vscode.window.showWarningMessage(`xw-commit：${message}`);
}

export function showError(message: string): void {
  vscode.window.showErrorMessage(`xw-commit：${message}`);
}

export async function confirmOverwrite(existing: string): Promise<boolean> {
  const preview = existing.length > 60 ? `${existing.slice(0, 60)}…` : existing;
  const choice = await vscode.window.showWarningMessage(
    `xw-commit：Git 提交输入框已有内容（${preview}），是否覆盖？`,
    { modal: true },
    '覆盖'
  );
  return choice === '覆盖';
}
