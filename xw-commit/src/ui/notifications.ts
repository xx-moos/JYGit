import * as vscode from 'vscode';

export function showInfo(message: string): void {
  vscode.window.showInformationMessage(`XAi: ${message}`);
}

export function showWarn(message: string): void {
  vscode.window.showWarningMessage(`XAi: ${message}`);
}

export function showError(message: string): void {
  vscode.window.showErrorMessage(`XAi: ${message}`);
}

