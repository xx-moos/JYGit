import * as vscode from 'vscode';
import { ConfigNotFoundError, ConfigParseError, loadConfig } from '../config/configLoader';
import { ConfigValidationError } from '../config/configSchema';
import { UnresolvedConflictError, collectRepoChanges } from '../git/diffProvider';
import { GitExtensionUnavailableError, getGitAPI } from '../git/gitExtension';
import { NoRepositoryError, resolveCurrentRepository } from '../git/repositoryResolver';
import {
  LLMRequestError,
  LLMTimeoutError,
  requestChatCompletion,
} from '../llm/openaiCompatibleClient';
import { buildMessages } from '../llm/promptBuilder';
import { ResponseParseError, extractCommitMessage } from '../llm/responseParser';
import { writeCommitMessage } from '../scm/commitInputWriter';
import { showError, showInfo, showWarn } from '../ui/notifications';

let running = false;

export async function generateMessageCommand(scm?: vscode.SourceControl): Promise<void> {
  if (running) {
    showWarn('已有一次生成任务进行中，请稍候');
    return;
  }
  running = true;
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: 'XAi 正在生成提交信息',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: '读取配置' });
        const config = await loadConfig();

        progress.report({ message: '定位仓库' });
        const api = await getGitAPI();
        const repo = resolveCurrentRepository(api, scm);

        progress.report({ message: '收集改动' });
        const summary = await collectRepoChanges(repo);
        if (summary.isEmpty) {
          showWarn('当前仓库没有可用于生成提交信息的改动');
          return;
        }

        progress.report({ message: '请求后端' });
        const messages = buildMessages(config, summary);
        const response = await requestChatCompletion(config, messages);

        progress.report({ message: '解析响应' });
        const commitMessage = extractCommitMessage(response);

        progress.report({ message: '写入输入框' });
        const result = await writeCommitMessage(repo, commitMessage);
        if (result === 'written') {
          showInfo('已写入提交信息');
        } else {
          showWarn('已取消写入，保留原有内容');
        }
      }
    );
  } catch (err) {
    handleError(err);
  } finally {
    running = false;
  }
}

function handleError(err: unknown): void {
  if (err instanceof ConfigNotFoundError) {
    showError(`${err.message}，请先在该路径创建配置文件`);
    return;
  }
  if (err instanceof ConfigParseError) {
    showError(`${err.message}（${err.cause.message}）`);
    return;
  }
  if (err instanceof ConfigValidationError) {
    showError(`配置校验失败：${err.message}`);
    return;
  }
  if (err instanceof GitExtensionUnavailableError) {
    showError(err.message);
    return;
  }
  if (err instanceof NoRepositoryError) {
    showError(err.message);
    return;
  }
  if (err instanceof UnresolvedConflictError) {
    showError(err.message);
    return;
  }
  if (err instanceof LLMTimeoutError) {
    showError(err.message);
    return;
  }
  if (err instanceof LLMRequestError) {
    showError(err.message);
    return;
  }
  if (err instanceof ResponseParseError) {
    showError(`生成失败：${err.message}`);
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  showError(`未知错误：${message}`);
}
