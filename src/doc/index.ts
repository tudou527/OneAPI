import http from 'http';
import * as fs from 'fs';
import chalk from 'chalk';
import * as path from 'path';

import { getUnUsedPort } from '../utils/common';

/**
 * 生成 API 文档
 */
export async function showDoc(args: { schema: string }) {
  // 判断 Schema 文件是否存在
  if (!fs.existsSync(args.schema)) {
    throw new Error(chalk.red(`❎ ${args.schema} 不存在`));
  }

  const port = await getUnUsedPort(3000);

  http.createServer(function (_, response) {
    const template = fs.readFileSync(path.join(__dirname, './template.html'), 'utf-8');
    const jsonSchema = fs.readFileSync(args.schema, 'utf-8');

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(template.replace('{jsonSchema}', jsonSchema));
  }).listen(port);

  return `http://127.0.0.1:${port}/docs`;
}
