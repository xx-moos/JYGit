# XAi

在 VS Code Git 面板中点击 `XAi` 按钮，基于当前仓库全部改动通过 OpenAI 兼容后端生成提交信息，并写入 Git 提交输入框。

## 配置

在用户目录创建 `~/.xai/config.json`（Windows 为 `%USERPROFILE%/.xai/config.json`）：

```json
{
  "baseURL": "https://example.com/v1",
  "apiKey": "sk-xxxxxx",
  "model": "gpt-4.1-mini",
  "prompt": "你是一个专业的 Git 提交信息生成助手。请基于提供的代码变更输出一条简洁、准确、可直接提交的中文 commit message，不要输出解释，不要加引号。",
  "timeoutMs": 30000,
  "maxDiffChars": 12000,
  "temperature": 0.2,
  "gitDiffMode": "allChanges"
}
```

## 使用

1. 在仓库中修改代码
2. 打开 VS Code Git 面板
3. 点击标题栏中的 `XAi` 按钮
4. 生成的提交信息将写入 Git 输入框，由用户手动确认提交
