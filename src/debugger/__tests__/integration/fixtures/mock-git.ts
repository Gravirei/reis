/**
 * Mock Git utilities for testing
 */

export interface MockCommit {
  hash: string;
  message: string;
  timestamp: Date;
  files: string[];
}

export class MockGitRepository {
  private commits: MockCommit[] = [];
  private currentBranch: string = 'main';
  private branches: Map<string, string> = new Map(); // branch name -> commit hash

  constructor() {
    // Initialize with a base commit
    this.addCommit({
      hash: 'init000',
      message: 'Initial commit',
      timestamp: new Date('2024-01-01'),
      files: [],
    });
    this.branches.set('main', 'init000');
  }

  addCommit(commit: MockCommit): void {
    this.commits.push(commit);
    this.branches.set(this.currentBranch, commit.hash);
  }

  getCommit(hash: string): MockCommit | undefined {
    return this.commits.find((c) => c.hash === hash);
  }

  getRecentCommits(count: number = 10): MockCommit[] {
    return this.commits.slice(-count).reverse();
  }

  getFileHistory(filePath: string, count: number = 10): MockCommit[] {
    return this.commits
      .filter((c) => c.files.includes(filePath))
      .slice(-count)
      .reverse();
  }

  getDiff(fromHash: string, toHash: string): string {
    const fromIdx = this.commits.findIndex((c) => c.hash === fromHash);
    const toIdx = this.commits.findIndex((c) => c.hash === toHash);
    
    if (fromIdx === -1 || toIdx === -1) {
      throw new Error('Commit not found');
    }

    const changedFiles = new Set<string>();
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      this.commits[i].files.forEach((f) => changedFiles.add(f));
    }

    return Array.from(changedFiles)
      .map((file) => `diff --git a/${file} b/${file}`)
      .join('\n');
  }

  getChangedFiles(sinceHash: string): string[] {
    const sinceIdx = this.commits.findIndex((c) => c.hash === sinceHash);
    if (sinceIdx === -1) {
      throw new Error('Commit not found');
    }

    const changedFiles = new Set<string>();
    for (let i = sinceIdx + 1; i < this.commits.length; i++) {
      this.commits[i].files.forEach((f) => changedFiles.add(f));
    }

    return Array.from(changedFiles).sort();
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }

  checkout(branch: string): void {
    if (!this.branches.has(branch)) {
      throw new Error(`Branch '${branch}' does not exist`);
    }
    this.currentBranch = branch;
  }

  createBranch(name: string): void {
    const currentHash = this.branches.get(this.currentBranch);
    if (!currentHash) {
      throw new Error('Current branch has no commits');
    }
    this.branches.set(name, currentHash);
  }
}

export const createMockGitRepo = () => {
  return new MockGitRepository();
};

// Sample commit history for testing
export const sampleCommitHistory: MockCommit[] = [
  {
    hash: 'abc123',
    message: 'feat(01-15): implement user authentication',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    files: ['src/auth/auth.ts', 'src/api/auth.ts'],
  },
  {
    hash: 'def456',
    message: 'fix(01-15): correct password validation logic',
    timestamp: new Date('2024-01-15T11:30:00Z'),
    files: ['src/auth/auth.ts'],
  },
  {
    hash: 'ghi789',
    message: 'feat(01-16): add user profile page',
    timestamp: new Date('2024-01-16T09:00:00Z'),
    files: ['src/pages/Profile.tsx', 'src/api/users.ts'],
  },
  {
    hash: 'jkl012',
    message: 'feat(01-16): implement API client',
    timestamp: new Date('2024-01-16T14:00:00Z'),
    files: ['src/api/client.ts'],
  },
  {
    hash: 'mno345',
    message: 'refactor(01-17): update API endpoint paths',
    timestamp: new Date('2024-01-17T10:00:00Z'),
    files: ['src/api/client.ts', 'src/components/UserList.tsx'],
  },
];
