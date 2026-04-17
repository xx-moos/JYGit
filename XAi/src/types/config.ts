export type GitDiffMode = 'allChanges';

export interface XwCommitConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  maxDiffChars: number;
  temperature: number;
  gitDiffMode: GitDiffMode;
}

export interface RawConfig {
  baseURL?: unknown;
  apiKey?: unknown;
  model?: unknown;
  prompt?: unknown;
  timeoutMs?: unknown;
  maxDiffChars?: unknown;
  temperature?: unknown;
  gitDiffMode?: unknown;
}
