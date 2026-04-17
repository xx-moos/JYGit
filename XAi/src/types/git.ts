export interface RepoChangeSummary {
  repoName: string;
  branch: string;
  stagedCount: number;
  unstagedCount: number;
  untrackedCount: number;
  hasConflicts: boolean;
  stagedDiff: string;
  unstagedDiff: string;
  untrackedSummary: string;
  isEmpty: boolean;
}
