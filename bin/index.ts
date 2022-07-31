#!/usr/bin/env node
import path from 'path';
import { program } from 'commander';

import main from '../lib/main';

program
  .name('oneapi')
  .description('从 Spring 项目生成 OpenAPI3.0 JSON Schema 的 CLI 工具')
  .version('0.0.1')
  .requiredOption('-p, --projectDir <dir>', 'spring 项目本地目录')
  .action(async (str: { projectDir: string }) => {
    try {
      const projectDir = str.projectDir.startsWith('/') ? str.projectDir : path.join(__dirname, str.projectDir);

      await main({ projectDir });
    } catch(e) {
      console.log(e);
      console.log();
    }
  });

program.parseAsync(process.argv);
