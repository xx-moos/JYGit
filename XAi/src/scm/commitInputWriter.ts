import type { GitRepository } from '../git/gitExtension';

export async function writeCommitMessage(
  repo: GitRepository,
  message: string
): Promise<void> {
  repo.inputBox.value = message;
}
