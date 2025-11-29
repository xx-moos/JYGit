# Git操作SDK API接口文档

> 作者:老王  
> 日期:2025-11-30  
> 版本:v1.0

**艹,这个SDK是整个项目的核心,所有Git操作都得经过它!**

---

## 一、SDK架构设计

### 1.1 核心类结构

```
GitClient (单例模式)
├── RepositoryManager   - 仓库管理
├── BranchManager       - 分支管理
├── CommitManager       - 提交管理
├── DiffManager         - 差异对比
├── MergeManager        - 合并管理
├── RemoteManager       - 远程仓库管理
└── TagManager          - 标签管理
```

### 1.2 SDK文件结构

```
src/sdk/
├── index.ts                    // SDK入口
├── GitClient.ts                // 主客户端
├── types/                      // 类型定义
│   ├── common.ts
│   ├── repository.ts
│   ├── commit.ts
│   ├── branch.ts
│   ├── diff.ts
│   └── merge.ts
├── managers/                   // 管理器
│   ├── RepositoryManager.ts
│   ├── BranchManager.ts
│   ├── CommitManager.ts
│   ├── DiffManager.ts
│   ├── MergeManager.ts
│   ├── RemoteManager.ts
│   └── TagManager.ts
├── utils/                      // 工具函数
│   ├── parser.ts               // Git输出解析
│   ├── validator.ts            // 参数校验
│   ├── error.ts                // 错误处理
│   └── logger.ts               // 日志
└── __tests__/                  // 测试
    └── ...
```

---

## 二、GitClient 主类

### 2.1 类定义

```typescript
/**
 * Git客户端主类
 * 艹,这是整个SDK的入口,必须是单例模式!
 * 
 * @example
 * ```ts
 * const gitClient = GitClient.getInstance();
 * await gitClient.repository.clone(url, path);
 * ```
 */
export class GitClient {
  private static instance: GitClient;
  
  // 管理器实例
  public readonly repository: RepositoryManager;
  public readonly branch: BranchManager;
  public readonly commit: CommitManager;
  public readonly diff: DiffManager;
  public readonly merge: MergeManager;
  public readonly remote: RemoteManager;
  public readonly tag: TagManager;

  private constructor() {
    // 艹,构造函数私有化,只能通过getInstance获取实例
    this.repository = new RepositoryManager(this);
    this.branch = new BranchManager(this);
    this.commit = new CommitManager(this);
    this.diff = new DiffManager(this);
    this.merge = new MergeManager(this);
    this.remote = new RemoteManager(this);
    this.tag = new TagManager(this);
  }

  /**
   * 获取GitClient单例
   */
  public static getInstance(): GitClient {
    if (!GitClient.instance) {
      GitClient.instance = new GitClient();
    }
    return GitClient.instance;
  }
}

// 导出单例
export const gitClient = GitClient.getInstance();
```

---

## 三、RepositoryManager (仓库管理器)

### 3.1 克隆仓库

```typescript
/**
 * 克隆远程仓库
 * 艹,这个函数会下载整个仓库,别tm传错地址!
 * 
 * @param url - 远程仓库地址
 * @param localPath - 本地目标路径
 * @param options - 克隆选项
 * @returns Promise&lt;CloneResult&gt;
 * 
 * @example
 * ```ts
 * await gitClient.repository.clone(
 *   'https://github.com/user/repo.git',
 *   '/Users/laowang/repos/repo',
 *   {
 *     depth: 1,  // 浅克隆
 *     branch: 'main',
 *     onProgress: (progress) => {
 *       console.log(`进度: ${progress.percent}%`);
 *     },
 *   }
 * );
 * ```
 */
async clone(
  url: string,
  localPath: string,
  options?: CloneOptions
): Promise&lt;CloneResult&gt; {
  // 参数校验
  validateUrl(url);
  validatePath(localPath);

  // 构建git命令
  const git = simpleGit();
  const cloneOptions: string[] = [];

  if (options?.depth) {
    cloneOptions.push(`--depth=${options.depth}`);
  }

  if (options?.branch) {
    cloneOptions.push('--branch', options.branch);
  }

  // 执行克隆
  try {
    const result = await git.clone(url, localPath, cloneOptions);
    
    return {
      success: true,
      path: localPath,
      branch: options?.branch || 'main',
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.CLONE_FAILED,
      `克隆仓库失败: ${error.message}`,
      { url, localPath, error }
    );
  }
}

/**
 * 克隆选项
 */
interface CloneOptions {
  /** 克隆深度(浅克隆) */
  depth?: number;
  /** 指定分支 */
  branch?: string;
  /** 认证信息 */
  auth?: GitAuth;
  /** 进度回调 */
  onProgress?: (progress: CloneProgress) => void;
}

interface CloneProgress {
  phase: 'receiving' | 'resolving' | 'done';
  processed: number;
  total: number;
  percent: number;
}

interface CloneResult {
  success: boolean;
  path: string;
  branch: string;
}
```

### 3.2 初始化仓库

```typescript
/**
 * 初始化新的Git仓库
 * 
 * @param localPath - 本地路径
 * @param options - 初始化选项
 * 
 * @example
 * ```ts
 * await gitClient.repository.init('/Users/laowang/new-repo', {
 *   bare: false,
 * });
 * ```
 */
async init(
  localPath: string,
  options?: InitOptions
): Promise&lt;InitResult&gt; {
  validatePath(localPath);

  const git = simpleGit();
  
  try {
    await git.init(localPath, options?.bare ? ['--bare'] : []);
    
    return {
      success: true,
      path: localPath,
      bare: options?.bare || false,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.INIT_FAILED,
      `初始化仓库失败: ${error.message}`,
      { localPath, error }
    );
  }
}

interface InitOptions {
  /** 是否创建裸仓库 */
  bare?: boolean;
}

interface InitResult {
  success: boolean;
  path: string;
  bare: boolean;
}
```

### 3.3 获取仓库状态

```typescript
/**
 * 获取仓库当前状态
 * 艹,这个函数返回所有变更文件,很重要!
 * 
 * @param repoPath - 仓库路径
 * @returns Promise&lt;GitStatus&gt;
 * 
 * @example
 * ```ts
 * const status = await gitClient.repository.status('/Users/laowang/repo');
 * console.log(`当前分支: ${status.branch}`);
 * console.log(`有${status.files.length}个文件修改`);
 * ```
 */
async status(repoPath: string): Promise&lt;GitStatus&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const status = await git.status();
    
    // 解析文件状态
    const files: FileStatus[] = [
      ...status.modified.map(file => ({
        path: file,
        status: 'modified' as const,
        staged: false,
      })),
      ...status.created.map(file => ({
        path: file,
        status: 'added' as const,
        staged: false,
      })),
      ...status.deleted.map(file => ({
        path: file,
        status: 'deleted' as const,
        staged: false,
      })),
      ...status.renamed.map(rename => ({
        path: rename.to,
        oldPath: rename.from,
        status: 'renamed' as const,
        staged: false,
      })),
      ...status.not_added.map(file => ({
        path: file,
        status: 'untracked' as const,
        staged: false,
      })),
    ];

    // 已暂存的文件
    const stagedFiles: FileStatus[] = status.staged.map(file => ({
      path: file,
      status: 'modified' as const,
      staged: true,
    }));

    return {
      branch: status.current || '',
      ahead: status.ahead,
      behind: status.behind,
      tracking: status.tracking || null,
      files: [...files, ...stagedFiles],
      conflicted: status.conflicted,
      isClean: status.isClean(),
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.STATUS_FAILED,
      `获取仓库状态失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

---

## 四、BranchManager (分支管理器)

### 4.1 获取分支列表

```typescript
/**
 * 获取所有分支
 * 
 * @param repoPath - 仓库路径
 * @param options - 选项
 * @returns Promise&lt;Branch[]&gt;
 * 
 * @example
 * ```ts
 * const branches = await gitClient.branch.list('/Users/laowang/repo', {
 *   remote: true,
 * });
 * ```
 */
async list(
  repoPath: string,
  options?: BranchListOptions
): Promise&lt;Branch[]&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const branchSummary = await git.branch(
      options?.remote ? ['-a'] : []
    );

    const branches: Branch[] = [];

    for (const [name, branch] of Object.entries(branchSummary.branches)) {
      // 获取分支最后提交
      const log = await git.log([name, '-1']);
      const lastCommit = log.latest;

      branches.push({
        name: name.replace('remotes/', ''),
        current: branch.current,
        remote: name.includes('remotes/') ? name : null,
        commit: {
          hash: lastCommit?.hash || '',
          message: lastCommit?.message || '',
          author: lastCommit?.author_name || '',
          date: lastCommit?.date || '',
        },
        ahead: 0,  // TODO: 计算领先/落后提交数
        behind: 0,
      });
    }

    return branches;
  } catch (error) {
    throw new GitError(
      GitErrorCode.BRANCH_LIST_FAILED,
      `获取分支列表失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

### 4.2 创建分支

```typescript
/**
 * 创建新分支
 * 
 * @param repoPath - 仓库路径
 * @param name - 分支名
 * @param options - 选项
 * @returns Promise&lt;CreateBranchResult&gt;
 * 
 * @example
 * ```ts
 * await gitClient.branch.create('/Users/laowang/repo', 'feature/login', {
 *   startPoint: 'main',
 *   checkout: true,
 * });
 * ```
 */
async create(
  repoPath: string,
  name: string,
  options?: CreateBranchOptions
): Promise&lt;CreateBranchResult&gt; {
  validatePath(repoPath);
  validateBranchName(name);

  const git = simpleGit(repoPath);
  
  try {
    const args: string[] = [name];
    
    if (options?.startPoint) {
      args.push(options.startPoint);
    }

    await git.branch(args);

    // 是否切换到新分支
    if (options?.checkout) {
      await git.checkout(name);
    }

    return {
      success: true,
      name,
      hash: await this.getBranchHash(repoPath, name),
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.BRANCH_CREATE_FAILED,
      `创建分支失败: ${error.message}`,
      { repoPath, name, error }
    );
  }
}
```

### 4.3 删除分支

```typescript
/**
 * 删除分支
 * 艹,删除分支要小心,别tm删错了!
 * 
 * @param repoPath - 仓库路径
 * @param name - 分支名
 * @param options - 选项
 * @returns Promise&lt;void&gt;
 * 
 * @example
 * ```ts
 * await gitClient.branch.delete('/Users/laowang/repo', 'feature/old', {
 *   force: false,
 * });
 * ```
 */
async delete(
  repoPath: string,
  name: string,
  options?: DeleteBranchOptions
): Promise&lt;void&gt; {
  validatePath(repoPath);
  validateBranchName(name);

  const git = simpleGit(repoPath);
  
  try {
    const args = [
      options?.force ? '-D' : '-d',
      name,
    ];

    await git.branch(args);
  } catch (error) {
    throw new GitError(
      GitErrorCode.BRANCH_DELETE_FAILED,
      `删除分支失败: ${error.message}`,
      { repoPath, name, error }
    );
  }
}
```

### 4.4 切换分支

```typescript
/**
 * 切换分支
 * 
 * @param repoPath - 仓库路径
 * @param name - 分支名
 * @param options - 选项
 * @returns Promise&lt;CheckoutResult&gt;
 * 
 * @example
 * ```ts
 * await gitClient.branch.checkout('/Users/laowang/repo', 'develop');
 * ```
 */
async checkout(
  repoPath: string,
  name: string,
  options?: CheckoutOptions
): Promise&lt;CheckoutResult&gt; {
  validatePath(repoPath);
  validateBranchName(name);

  const git = simpleGit(repoPath);
  
  try {
    // 检查是否有未提交的修改
    if (!options?.force) {
      const status = await git.status();
      if (!status.isClean()) {
        throw new GitError(
          GitErrorCode.CHECKOUT_DIRTY,
          '有未提交的修改,请先提交或暂存',
          { repoPath, name }
        );
      }
    }

    const currentBranch = (await git.branch()).current;

    const args: string[] = [name];
    if (options?.create) {
      args.unshift('-b');
    }
    if (options?.force) {
      args.unshift('-f');
    }

    await git.checkout(args);

    return {
      success: true,
      from: currentBranch,
      to: name,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.CHECKOUT_FAILED,
      `切换分支失败: ${error.message}`,
      { repoPath, name, error }
    );
  }
}
```

---

## 五、CommitManager (提交管理器)

### 5.1 获取提交历史

```typescript
/**
 * 获取提交历史
 * 艹,这个函数支持分页,别一次性拉太多!
 * 
 * @param repoPath - 仓库路径
 * @param options - 选项
 * @returns Promise&lt;LogResult&gt;
 * 
 * @example
 * ```ts
 * const { commits, hasMore } = await gitClient.commit.log('/Users/laowang/repo', {
 *   maxCount: 50,
 *   skip: 0,
 *   branch: 'main',
 * });
 * ```
 */
async log(
  repoPath: string,
  options?: LogOptions
): Promise&lt;LogResult&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const logOptions: any = {
      maxCount: options?.maxCount || 50,
    };

    if (options?.skip) {
      logOptions.from = options.skip;
    }

    if (options?.file) {
      logOptions.file = options.file;
    }

    const log = await git.log(logOptions);

    // 解析提交
    const commits: Commit[] = log.all.map(commit => ({
      hash: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      committer: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: commit.date,
      message: commit.message,
      body: commit.body,
      refs: commit.refs ? commit.refs.split(', ') : [],
      parents: commit.parent ? [commit.parent] : [],
      stats: {
        files: 0,      // TODO: 获取统计信息
        insertions: 0,
        deletions: 0,
      },
    }));

    // 检查是否还有更多
    const nextLog = await git.log({
      maxCount: 1,
      from: (options?.skip || 0) + commits.length,
    });

    return {
      commits,
      hasMore: nextLog.all.length > 0,
      total: log.total,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.LOG_FAILED,
      `获取提交历史失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

### 5.2 暂存文件

```typescript
/**
 * 暂存文件
 * 
 * @param repoPath - 仓库路径
 * @param files - 文件列表,空数组表示git add .
 * @returns Promise&lt;AddResult&gt;
 * 
 * @example
 * ```ts
 * // 暂存特定文件
 * await gitClient.commit.add('/Users/laowang/repo', ['src/main.ts']);
 * 
 * // 暂存所有文件
 * await gitClient.commit.add('/Users/laowang/repo', []);
 * ```
 */
async add(
  repoPath: string,
  files: string[]
): Promise&lt;AddResult&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    if (files.length === 0) {
      // git add .
      await git.add('.');
    } else {
      await git.add(files);
    }

    return {
      success: true,
      stagedFiles: files.length === 0 ? ['*'] : files,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.ADD_FAILED,
      `暂存文件失败: ${error.message}`,
      { repoPath, files, error }
    );
  }
}
```

### 5.3 创建提交

```typescript
/**
 * 创建提交
 * 艹,提交信息必须写清楚,别tm就写个"update"!
 * 
 * @param repoPath - 仓库路径
 * @param message - 提交信息
 * @param options - 选项
 * @returns Promise&lt;CommitResult&gt;
 * 
 * @example
 * ```ts
 * const result = await gitClient.commit.commit('/Users/laowang/repo', {
 *   message: 'feat: 添加用户登录功能',
 *   description: '实现了基于JWT的用户登录\n支持记住密码功能',
 * });
 * console.log(`提交成功: ${result.hash}`);
 * ```
 */
async commit(
  repoPath: string,
  options: CommitOptions
): Promise&lt;CommitResult&gt; {
  validatePath(repoPath);
  validateCommitMessage(options.message);

  const git = simpleGit(repoPath);
  
  try {
    const commitMessage = options.description
      ? `${options.message}\n\n${options.description}`
      : options.message;

    const commitOptions: any = { message: commitMessage };

    if (options.amend) {
      commitOptions['--amend'] = null;
    }

    if (options.author) {
      commitOptions['--author'] = `${options.author.name} <${options.author.email}>`;
    }

    const result = await git.commit(commitMessage, [], commitOptions);

    return {
      success: true,
      hash: result.commit,
      summary: result.summary.changes + ' changes',
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.COMMIT_FAILED,
      `创建提交失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

### 5.4 推送

```typescript
/**
 * 推送到远程仓库
 * 艹,别tm随便用force,会把别人的提交覆盖掉!
 * 
 * @param repoPath - 仓库路径
 * @param options - 选项
 * @returns Promise&lt;PushResult&gt;
 * 
 * @example
 * ```ts
 * await gitClient.commit.push('/Users/laowang/repo', {
 *   remote: 'origin',
 *   branch: 'main',
 *   force: false,
 * });
 * ```
 */
async push(
  repoPath: string,
  options?: PushOptions
): Promise&lt;PushResult&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const remote = options?.remote || 'origin';
    const branch = options?.branch || await this.getCurrentBranch(repoPath);

    const pushOptions: string[] = [];
    if (options?.force) {
      pushOptions.push('--force');
    }

    await git.push(remote, branch, pushOptions);

    return {
      success: true,
      pushed: 1,  // TODO: 获取实际推送数量
      remote,
      branch,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.PUSH_FAILED,
      `推送失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

### 5.5 拉取

```typescript
/**
 * 从远程拉取更新
 * 
 * @param repoPath - 仓库路径
 * @param options - 选项
 * @returns Promise&lt;PullResult&gt;
 * 
 * @example
 * ```ts
 * const result = await gitClient.commit.pull('/Users/laowang/repo', {
 *   rebase: true,
 * });
 * console.log(`更新了${result.summary.changes}个文件`);
 * ```
 */
async pull(
  repoPath: string,
  options?: PullOptions
): Promise&lt;PullResult&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const pullOptions: any = {};
    
    if (options?.rebase) {
      pullOptions['--rebase'] = null;
    }

    const result = await git.pull(
      options?.remote || 'origin',
      options?.branch,
      pullOptions
    );

    return {
      files: result.files,
      insertions: result.insertions || 0,
      deletions: result.deletions || 0,
      summary: result.summary,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.PULL_FAILED,
      `拉取失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

---

## 六、DiffManager (差异对比管理器)

### 6.1 获取文件差异

```typescript
/**
 * 获取文件差异
 * 
 * @param repoPath - 仓库路径
 * @param options - 选项
 * @returns Promise&lt;DiffResult&gt;
 * 
 * @example
 * ```ts
 * const diff = await gitClient.diff.getDiff('/Users/laowang/repo', {
 *   file: 'src/main.ts',
 *   cached: true,
 * });
 * ```
 */
async getDiff(
  repoPath: string,
  options?: DiffOptions
): Promise&lt;DiffResult&gt; {
  validatePath(repoPath);

  const git = simpleGit(repoPath);
  
  try {
    const diffOptions: string[] = [];

    if (options?.cached) {
      diffOptions.push('--cached');
    }

    if (options?.base && options?.target) {
      diffOptions.push(options.base, options.target);
    }

    if (options?.file) {
      diffOptions.push('--', options.file);
    }

    const diff = await git.diff(diffOptions);

    // 解析diff输出
    const parsed = parseDiff(diff);

    return {
      files: parsed.files,
      stats: parsed.stats,
    };
  } catch (error) {
    throw new GitError(
      GitErrorCode.DIFF_FAILED,
      `获取差异失败: ${error.message}`,
      { repoPath, error }
    );
  }
}
```

---

## 七、错误处理

### 7.1 错误码定义

```typescript
export enum GitErrorCode {
  // 仓库错误
  CLONE_FAILED = 'CLONE_FAILED',
  INIT_FAILED = 'INIT_FAILED',
  STATUS_FAILED = 'STATUS_FAILED',
  
  // 分支错误
  BRANCH_LIST_FAILED = 'BRANCH_LIST_FAILED',
  BRANCH_CREATE_FAILED = 'BRANCH_CREATE_FAILED',
  BRANCH_DELETE_FAILED = 'BRANCH_DELETE_FAILED',
  CHECKOUT_FAILED = 'CHECKOUT_FAILED',
  CHECKOUT_DIRTY = 'CHECKOUT_DIRTY',
  
  // 提交错误
  LOG_FAILED = 'LOG_FAILED',
  ADD_FAILED = 'ADD_FAILED',
  COMMIT_FAILED = 'COMMIT_FAILED',
  PUSH_FAILED = 'PUSH_FAILED',
  PULL_FAILED = 'PULL_FAILED',
  
  // 差异错误
  DIFF_FAILED = 'DIFF_FAILED',
  
  // 合并错误
  MERGE_FAILED = 'MERGE_FAILED',
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  
  // 其他
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Git错误类
 * 艹,所有错误都用这个类包装!
 */
export class GitError extends Error {
  constructor(
    public code: GitErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GitError';
  }
}
```

---

## 八、类型定义汇总

### 8.1 通用类型

```typescript
// types/common.ts

/**
 * Git认证信息
 */
export interface GitAuth {
  username?: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
}

/**
 * 作者信息
 */
export interface GitAuthor {
  name: string;
  email: string;
}
```

### 8.2 仓库相关类型

```typescript
// types/repository.ts

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  tracking: string | null;
  files: FileStatus[];
  conflicted: string[];
  isClean: boolean;
}

export interface FileStatus {
  path: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}
```

### 8.3 提交相关类型

```typescript
// types/commit.ts

export interface Commit {
  hash: string;
  shortHash: string;
  author: GitAuthor;
  committer: GitAuthor;
  date: string;
  message: string;
  body: string;
  refs: string[];
  parents: string[];
  stats: CommitStats;
}

export interface CommitStats {
  files: number;
  insertions: number;
  deletions: number;
}
```

---

## 九、使用示例

### 9.1 完整工作流示例

```typescript
import { gitClient } from '@/sdk';

// 1. 克隆仓库
await gitClient.repository.clone(
  'https://github.com/user/repo.git',
  '/Users/laowang/repos/repo'
);

// 2. 创建并切换到新分支
await gitClient.branch.create('/Users/laowang/repos/repo', 'feature/new', {
  checkout: true,
});

// 3. 修改文件后查看状态
const status = await gitClient.repository.status('/Users/laowang/repos/repo');
console.log(`有${status.files.length}个文件修改`);

// 4. 暂存文件
await gitClient.commit.add('/Users/laowang/repos/repo', []);

// 5. 创建提交
await gitClient.commit.commit('/Users/laowang/repos/repo', {
  message: 'feat: 添加新功能',
});

// 6. 推送到远程
await gitClient.commit.push('/Users/laowang/repos/repo', {
  remote: 'origin',
  branch: 'feature/new',
});
```

---

## 十、总结

**艹,这个SDK设计得清清楚楚,接口明明白白!**

核心要点:
1. ✅ 单例模式,全局唯一实例
2. ✅ 分模块管理,职责清晰
3. ✅ 完整的类型定义
4. ✅ 统一的错误处理
5. ✅ Promise based API
6. ✅ 参数校验
7. ✅ 详细的注释和示例

**按照这个SDK实现,绝对没问题!**
