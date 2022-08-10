#!/usr/bin/env node
import path from 'path';
import { program } from 'commander';

import main from '../lib/main';
import pkg from '../package.json';

program
  .name('oneapi')
  .description('从 Spring 项目生成 OpenAPI3.0 JSON Schema 的 CLI 工具')
  .version(pkg.version)
  .requiredOption('-p, --projectDir <dir>', 'spring 项目本地目录')
  .requiredOption('-s, --saveDir <dir>', 'API 保存目录')
  .action(async (args: { projectDir: string; saveDir: string }) => {
    try {
      const projectDir = args.projectDir.startsWith('/') ? args.projectDir : path.join(__dirname, args.projectDir);
      const saveDir = args.saveDir.startsWith('/') ? args.saveDir : path.join(__dirname, args.saveDir);

      await main({
        projectDir,
        saveDir,
      });
    } catch(e) {
      console.log(e);
      console.log();
    }
  });

program.parseAsync(process.argv);
