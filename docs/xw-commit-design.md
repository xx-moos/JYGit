# xw-commit 设计文档

## 1. 背景与目标

`xw-commit` 是一个全新的 VS Code 插件，只做一件事：

- 从电脑用户目录中的本地 JSON 配置文件读取 `baseURL`、`apiKey`、`model`、`prompt`
- 读取当前 Git 仓库中的全部改动
- 按 OpenAI Chat Completions 兼容协议请求后端生成提交信息
- 在返回结果后，自动填写到 VS Code Git 面板的提交输入框中
- 在 Git 面板提供一个名为 `xw-commit` 的自定义按钮作为触发入口

该插件不负责自动提交代码，不提供聊天界面，不做多协议抽象，不维护独立 Git 视图。


### 2 必做能力

- 插件名称固定为 `xw-commit`
- Git 面板提供可点击的 `xw-commit` 按钮
- 读取用户目录配置文件
- 获取当前仓库全部改动
- 向 OpenAI 兼容接口发送请求
- 将生成结果写回 Git 提交输入框
- 对关键失败场景给出明确提示
- 只要仓库存在文件改动，就根据这些改动生成提交信息


## 3. 用户流程

1. 用户在本机用户目录中创建配置文件
2. 用户在仓库中修改代码
3. 用户打开 VS Code 的 Git 面板
4. 用户点击 Git 面板中的 `xw-commit` 按钮
5. 插件读取配置文件并定位当前 Git 仓库
6. 插件收集当前仓库的全部改动
7. 插件组装 OpenAI 兼容请求并发送到后端
8. 插件从响应中提取提交信息文本
9. 插件将提交信息写入 Git 提交输入框

## 4. 总体方案

### 4.1 核心原则

- 只增强 VS Code 原生 Git 提交流程，不重建 Git UI
- 配置只存放在用户目录，不写入工作区
- 默认基于当前仓库全部改动生成，覆盖 `staged`、`unstaged`、`untracked`
- 默认使用 OpenAI Chat Completions 兼容协议
- 不引入第三方 AI SDK，直接使用 HTTP 请求实现

### 4.2 处理链路

```text
Git 面板按钮
  -> xwCommit.generateMessage 命令
  -> ConfigLoader 读取用户配置
  -> GitExtension 获取当前仓库
  -> DiffProvider 收集当前仓库全部改动
  -> PromptBuilder 生成 messages
  -> OpenAICompatibleClient 请求后端
  -> ResponseParser 提取提交信息
  -> CommitInputWriter 写入 Git 提交输入框
```

### 4.3 推荐目录结构

```text
xw-commit/
  package.json
  tsconfig.json
  .vscodeignore
  src/
    extension.ts
    commands/
      generateMessage.ts
    config/
      configLoader.ts
      configSchema.ts
    git/
      gitExtension.ts
      repositoryResolver.ts
      diffProvider.ts
    llm/
      promptBuilder.ts
      openaiCompatibleClient.ts
      responseParser.ts
    scm/
      commitInputWriter.ts
    ui/
      notifications.ts
    types/
      config.ts
      git.ts
      llm.ts
  test/
    unit/
```

## 5. 配置文件设计

### 5.1 配置文件路径

- Windows: `%USERPROFILE%/.xw-commit/config.json`

一期仅支持单一 JSON 配置文件，不做多文件合并与优先级覆盖。

### 5.2 字段定义

| 字段 | 类型 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- | --- |
| `baseURL` | `string` | 是 | OpenAI 兼容后端地址，不包含末尾斜杠更佳 | 无 |
| `apiKey` | `string` | 是 | Bearer Token | 无 |
| `model` | `string` | 是 | 请求使用的模型 ID | 无 |
| `prompt` | `string` | 是 | 作为 system message 的主提示词 | 无 |
| `timeoutMs` | `number` | 否 | 请求超时时间 | `30000` |
| `maxDiffChars` | `number` | 否 | 发送给模型的 diff 最大字符数 | `12000` |
| `temperature` | `number` | 否 | 生成温度 | `0.2` |
| `gitDiffMode` | `string` | 否 | 变更模式，一期仅支持 `allChanges` | `allChanges` |

### 5.3 配置示例

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

### 5.4 校验规则

- `baseURL` 不能为空，且必须是合法的 `http` 或 `https` 地址
- `apiKey` 不能为空
- `model` 不能为空
- `prompt` 不能为空
- `timeoutMs` 必须大于 `0`
- `maxDiffChars` 必须大于 `0`
- `temperature` 必须在合理数值范围内，建议限制为 `0` 到 `2`
- `gitDiffMode` 一期只接受 `allChanges`

如果配置校验失败，插件直接提示并终止，不发起后端请求。

## 6. OpenAI 兼容请求协议

### 6.1 请求地址

默认将请求发送到：

```text
{baseURL}/chat/completions
```

若 `baseURL` 已经包含 `/chat/completions`，实现阶段可做轻量规整，但设计上推荐统一由插件拼接固定路径。

### 6.2 请求头

```http
Authorization: Bearer {apiKey}
Content-Type: application/json
```

### 6.3 请求体结构

插件默认发送 Chat Completions 兼容格式：

```json
{
  "model": "gpt-4.1-mini",
  "temperature": 0.2,
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的 Git 提交信息生成助手。请基于提供的代码变更输出一条简洁、准确、可直接提交的中文 commit message，不要输出解释，不要加引号。"
    },
    {
      "role": "user",
      "content": "仓库: demo-repo\n分支: feature/xw-commit\n模式: allChanges\n统计: staged=2, unstaged=1, untracked=1\n以下是当前仓库改动，请生成一条提交信息：\n\n[staged diff]\n<staged diff 内容>\n\n[unstaged diff]\n<unstaged diff 内容>\n\n[untracked files]\n<untracked 文件列表或内容片段>"
    }
  ]
}
```

### 6.4 prompt 拼装规则

- `config.prompt` 直接作为 `system` 消息
- 插件内部固定拼装一个 `user` 消息，包含：
  - 仓库名
  - 当前分支名
  - diff 模式
  - `staged`、`unstaged`、`untracked` 的改动内容或摘要
- 一期不支持 prompt 模板变量替换
- 为避免超长请求，改动内容在进入 `messages` 前执行截断

### 6.5 diff 截断规则

- 默认以 `maxDiffChars` 为上限
- 按 `staged`、`unstaged`、`untracked` 的顺序累计改动内容
- 超出部分直接截断
- 截断时保留已拼装的头部内容，并在尾部追加截断说明，例如：

```text
...[diff truncated]
```

### 6.6 响应提取规则

默认从以下路径取值：

```text
choices[0].message.content
```

兼容响应示例：

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "feat: 新增 xw-commit 提交信息生成功能"
      },
      "finish_reason": "stop"
    }
  ]
}
```

### 6.7 返回内容清洗规则

- 去除首尾空白
- 如果返回是多行文本，优先保留第一条有效提交语句
- 如果响应为空字符串，视为失败
- 如果响应是解释性段落而非提交信息，仍按失败处理并提示用户

## 7. Git 集成设计

### 7.1 Git 能力来源

优先通过 VS Code 内置 Git 扩展 API 获取仓库与输入框能力：

- `vscode.extensions.getExtension('vscode.git')`
- 激活后获取导出 API
- 从 Git API 中获取仓库列表与目标仓库对象

### 7.2 当前仓库判定规则

推荐实现顺序：

1. 优先使用当前活动仓库
2. 如果无法明确活动仓库，则回退到第一个可用仓库
3. 如果当前窗口没有 Git 仓库，直接提示并终止

### 7.3 diff 获取策略

一期默认处理当前仓库全部改动：

- 纳入 `staged`、`unstaged`、`untracked`
- 不纳入 `ignored`
- 若存在未解决冲突，直接提示用户先处理冲突后再生成
- 对二进制文件或超大文件只保留文件名与状态摘要，不传完整内容

这样设计的原因：

- 只要仓库中有文件改动，就可以直接生成提交信息
- 用户不需要先执行 stage，操作路径更短
- 生成内容更贴近用户当前工作区状态

如果当前仓库没有任何改动：

- 不发起请求
- 直接提示用户当前没有可用于生成提交信息的改动

### 7.4 Git 提交输入框写入规则

- 目标是写入当前仓库对应的 Git 提交输入框
- 若输入框为空，直接写入生成结果
- 若输入框已有内容，推荐首版行为为二选一：
  - 弹确认后覆盖
  - 或直接覆盖并提示

为了避免误伤手工输入内容，推荐首版采用“已有内容先确认再覆盖”。

## 8. Git 面板自定义按钮设计

### 8.1 设计目标

在 VS Code Git 面板提供一个名为 `xw-commit` 的自定义按钮，用户点击后直接触发提交流程。

### 8.2 实现方式

采用 VS Code 原生 SCM 菜单命令贡献：

- 命令 ID：`xwCommit.generateMessage`
- 命令标题：`xw-commit`
- 菜单位置：`scm/title`
- 必要时补充：`scm/repository`

### 8.3 说明

这里的“自定义按钮”是基于 VS Code 原生命令入口实现的 Git 面板按钮，不是完全自由布局的自绘组件。

这意味着：

- 按钮会出现在 Git 面板原生允许的位置
- 展示样式受 VS Code SCM 容器控制
- 插件可控制命令名称、图标、tooltip、显示条件
- 插件不应尝试在 Git 面板中嵌入自定义 HTML 或 Webview 按钮

### 8.4 菜单贡献示意

```json
{
  "contributes": {
    "commands": [
      {
        "command": "xwCommit.generateMessage",
        "title": "xw-commit"
      }
    ],
    "menus": {
      "scm/title": [
        {
          "command": "xwCommit.generateMessage",
          "group": "navigation"
        }
      ]
    }
  }
}
```

### 8.5 运行态要求

点击按钮后应有明确的运行反馈：

- 生成中时禁止重复触发
- 显示 loading 状态或进度提示
- 成功后提示“已写入提交信息”
- 失败后提示失败原因

## 9. 错误处理设计

### 9.1 配置错误

场景：

- 配置文件不存在
- JSON 格式非法
- 必填字段缺失
- 字段类型不合法

处理：

- 直接终止流程
- 使用可读提示告诉用户缺什么
- 不回显 `apiKey`

### 9.2 Git 错误

场景：

- 当前窗口无 Git 仓库
- 无法解析当前仓库
- 当前仓库没有任何改动
- 当前仓库存在未解决冲突
- 无法访问 Git 输入框

处理：

- 直接终止
- 明确指出当前失败位置

### 9.3 后端请求错误

场景：

- 网络失败
- 超时
- 401 未授权
- 403 禁止访问
- 500 服务异常
- 返回非 JSON

处理：

- 统一包装成用户可读提示
- 记录必要的错误上下文，但不记录敏感信息

### 9.4 响应解析错误

场景：

- 缺少 `choices`
- 缺少 `message`
- `content` 为空
- 返回内容不是可用的提交信息

处理：

- 视为生成失败
- 不写入 Git 提交框
- 提示用户检查后端返回格式

## 10. 安全要求

- `apiKey` 只能从本地配置文件读取，不能写入日志
- 请求日志中禁止打印完整请求头
- 不在工作区内生成配置文件
- 不自动提交代码
- 不自动上传未限制的超长 diff
- 对发送给模型的 diff 做长度控制
- 所有错误消息都必须脱敏

## 11. 验收标准

### 11.1 功能验收

以下场景全部通过，视为一期设计满足实现条件：

- 用户配置合法时，插件可成功读取配置
- 当前仓库存在文件改动时，可成功生成提交信息
- 返回结果可自动写入 Git 提交输入框
- Git 面板中可见 `xw-commit` 按钮
- 点击按钮可触发完整流程

### 11.2 边界验收

以下场景必须有明确行为：

- 配置文件不存在
- 配置 JSON 非法
- `baseURL`、`apiKey`、`model`、`prompt` 缺失
- 当前没有 Git 仓库
- 当前没有任何改动
- 当前只有 `unstaged` 改动
- 当前只有 `untracked` 改动
- 当前同时存在 `staged`、`unstaged`、`untracked` 改动
- 当前存在未解决冲突
- 后端超时或报错
- 响应缺少 `choices[0].message.content`
- 提交输入框已有内容

### 11.3 回归验收

- 插件不会自动执行提交
- 插件不会修改工作区文件
- 插件失败时不会清空已有提交内容
- 快速连续点击不会导致并发写入异常

## 12. 实施顺序

### 第一步：文档落地

先完成当前设计文档，作为后续开发依据。

### 第二步：扩展骨架初始化

创建 `xw-commit` 扩展目录与最小可运行结构。

### 第三步：配置层实现

完成配置读取、路径解析、字段校验。

### 第四步：Git 接入层实现

完成 Git API 获取、仓库识别、当前仓库全部改动读取。

### 第五步：OpenAI 兼容客户端实现

完成请求发送、超时控制、响应解析。

### 第六步：Git 面板按钮与写回实现

完成 SCM 命令按钮注册、点击流程、输入框写回。

### 第七步：验证与调试

完成类型检查、手动验证和边界场景验证。

## 13. 一期默认行为汇总

为避免实现阶段反复摇摆，一期默认行为固定如下：

- 插件名称：`xw-commit`
- 配置文件路径：用户目录 `~/.xw-commit/config.json`
- 后端协议：OpenAI Chat Completions 兼容协议
- 请求路径：`{baseURL}/chat/completions`
- 变更范围：当前仓库全部改动（`staged`、`unstaged`、`untracked`）
- 变更模式：`allChanges`
- 触发入口：Git 面板 `scm/title` 自定义按钮
- 写入目标：Git 提交输入框
- 提交动作：用户手动完成
- 超时默认值：`30000ms`
- diff 长度默认值：`12000` 字符
- temperature 默认值：`0.2`

---

这份文档是 `xw-commit` 一期实现的唯一设计基线。后续如果实现细节需要调整，应优先更新本文件，再进入代码阶段。