import type { GitRepository } from '../git/gitExtension';
import { confirmOverwrite } from '../ui/notifications';

export type WriteResult = 'written' | 'cancelled';

export async function writeCommitMessage(
  repo: GitRepository,
  message: string
): Promise<WriteResult> {
  const existing = repo.inputBox.value ?? '';
  if (existing.trim().length > 0 && existing.trim() !== message.trim()) {
    const confirmed = await confirmOverwrite(existing);
    if (!confirmed) {
      return 'cancelled';
    }
  }
  repo.inputBox.value = message;
  return 'written';
}
