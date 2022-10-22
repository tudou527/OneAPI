import path from 'path';

/**
 * 返回完整路径
 */
export const getAbsolutePath = (relativePath: string) => {
  if (!relativePath.startsWith('/')) {
    return path.join(process.cwd(), relativePath);
  }

  return relativePath;
}