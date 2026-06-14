import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Walks a directory recursively (or processes a single file) and returns an array of file paths
 * matching the given extensions.
 */
export function fileWalker(inputPath: string, extensions: string[]): string[] {
  const filePaths: string[] = [];
  const absolutePath = path.resolve(inputPath);
  let stats: fs.Stats;
  try {
    stats = fs.lstatSync(absolutePath);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(chalk.red(`Error: ${error.message}`));
    return filePaths;
  }

  const rootDir: string = process.cwd();
  if (stats.isFile()) {
    const ext = path.extname(absolutePath).toLowerCase();
    if (extensions.includes(ext)) {
      filePaths.push(path.relative(rootDir, absolutePath));
    }
    return filePaths;
  } else if (stats.isDirectory()) {
    // continue to walk
  } else {
    return filePaths;
  }

  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileStats = fs.lstatSync(filePath);

      if (fileStats.isSymbolicLink()) {
        continue;
      }

      if (fileStats.isDirectory()) {
        walk(filePath);
      } else if (fileStats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        if (extensions.includes(ext)) {
          filePaths.push(path.relative(rootDir, filePath));
        }
      }
    }
  }

  walk(absolutePath);
  return filePaths;
}
