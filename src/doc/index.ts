import http from 'http';
import * as fs from 'fs';
import chalk from 'chalk';

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
  const templateStr = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>OneAPI 文档</title>
      <link rel="shortcut icon" type="image/x-icon" href="https://oneapi.app/favicon.svg"/>
      <style>
        body {
          -webkit-font-smoothing: antialiased;
        }
        .__dumi-default-navbar-logo {
          padding: 0 0 0 32px !important;
          font-size: 18px !important;
          background-size: 24px 24px !important;
        }
      </style>
      <link rel="stylesheet" href="https://oneapi.app/umi.css" />
    </head>
    <body>
      <div id="root"></div>
      <script>
        window.routerBase = "/";
        window.defaultJsonSchema = {jsonSchema};
      </script>
      <script crossorigin src="https://oneapi.app/umi.js"></script>
    </body>
  </html>
  `;

  http.createServer(function (_, response) {
    const jsonSchema = fs.readFileSync(args.schema, 'utf-8');

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(templateStr.replace('{jsonSchema}', jsonSchema));
  }).listen(port);

  return `http://127.0.0.1:${port}/docs`;
}
