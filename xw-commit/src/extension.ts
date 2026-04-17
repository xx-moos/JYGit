import * as vscode from 'vscode';
import { generateMessageCommand } from './commands/generateMessage';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'xwCommit.generateMessage',
    (scm?: vscode.SourceControl) => generateMessageCommand(scm)
  );
  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // no-op
}
