/**
 * Mock filesystem utilities for testing
 */

export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor(initialFiles: Record<string, string> = {}) {
    Object.entries(initialFiles).forEach(([path, content]) => {
      this.writeFile(path, content);
    });
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
    // Add parent directories
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      this.directories.add(parts.slice(0, i).join('/'));
    }
  }

  readFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  readdir(path: string): string[] {
    const results: string[] = [];
    const prefix = path.endsWith('/') ? path : path + '/';
    
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relative = filePath.slice(prefix.length);
        const firstPart = relative.split('/')[0];
        if (firstPart && !results.includes(firstPart)) {
          results.push(firstPart);
        }
      }
    }
    
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix)) {
        const relative = dirPath.slice(prefix.length);
        const firstPart = relative.split('/')[0];
        if (firstPart && !results.includes(firstPart)) {
          results.push(firstPart);
        }
      }
    }
    
    return results.sort();
  }

  mkdir(path: string): void {
    this.directories.add(path);
  }

  rm(path: string): void {
    this.files.delete(path);
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  getAllFiles(): string[] {
    return Array.from(this.files.keys()).sort();
  }
}

export const createMockFileSystem = (files: Record<string, string> = {}) => {
  return new MockFileSystem(files);
};

// Sample file contents for testing
export const sampleFiles = {
  syntaxErrorFile: `export function formatResults(data) {
  // BUG: data might be undefined
  return data.map(item => ({
    id: item.id,
    name: item.name,
  }));
}`,

  logicErrorFile: `export function validatePassword(password: string, hash: string): boolean {
  const isValid = bcrypt.compareSync(password, hash);
  // BUG: Inverted condition
  if (!isValid) {
    return true; // Allow access
  }
  return false; // Deny access
}`,

  integrationIssueFile: `export async function fetchUsers() {
  // BUG: API path changed from /api/users to /api/v2/users
  const response = await fetch('/api/users');
  return response.json();
}`,

  incompleteImplementationFile: `export async function loginUser(email: string, password: string) {
  // TODO: Implement password validation
  // TODO: Implement session creation
  // TODO: Add error handling
  
  console.log('Login attempt:', email);
  
  return { success: false, error: 'Not implemented' };
}`,

  completeImplementationFile: `export async function registerUser(email: string, password: string) {
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password required');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await db.users.create({
    email,
    password: hashedPassword,
  });
  
  return { success: true, userId: user.id };
}`,

  performanceIssueFile: `export async function UserList() {
  const users = await db.users.findMany();
  
  // BUG: N+1 query - fetches avatar for each user separately
  const usersWithAvatars = await Promise.all(
    users.map(async (user) => ({
      ...user,
      avatar: await db.avatars.findUnique({ where: { userId: user.id } }),
    }))
  );
  
  return usersWithAvatars;
}`,
};
