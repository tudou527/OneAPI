#!/usr/bin/env node
import path from 'path';
import chalk from 'chalk';
import { program } from 'commander';

import { analysis, generateService, convertOpenApi } from '../lib/main';

program
  .command('analysis')
  .description('从 Spring 项目解析出 OneAPI schema')
  .requiredOption('-p, --project <dir>', 'Spring 项目本地目录')
  .requiredOption('-o, --output <dir>', 'OneAPI schema 输出目录')
  .action(async (args: { project: string; output: string }) => {
    try {
      // 开始时间
      const startTime = Date.now();

      const projectDir = args.project.startsWith('/') ? args.project : path.join(__dirname, args.project);
      const saveDir = args.output.startsWith('/') ? args.output : path.join(__dirname, args.output);

      // 解析 OneAPI Schema
      const oneApiFilePath = await analysis({
        projectDir,
        saveDir,
      });

      // 解析时间
      const duration = (Date.now() - startTime)/1000;

      console.log();
      console.log('✅ OneAPI Schema 解析完成(耗时%s): %s', `${Math.ceil(duration)}s`, chalk.green(oneApiFilePath));
    } catch(e) {
      console.log(e);
      console.log();
    }
  });

program
  .command('service')
  .description('从 OneAPI schema 生成 service 文件')
  .requiredOption('-s, --schema <filePath>', 'OneAPI schema 文件地址')
  .requiredOption('-r, --requestStr <string>', 'Request 导入字符串')
  .requiredOption('-o, --output <dir>', 'Servies 输出目录（目录下的文件在执行过程中会被清空）')
  .action(async (args: { schema: string; requestStr: string, output: string }) => {
    // 生成 service
    const serviceDir = generateService(args);

    console.log();
    console.log('✅ Services 文件生成完成: %s', chalk.green(serviceDir));
  });

program
  .command('openapi')
  .description('生成 OpeAPI 3.0 schema')
  .requiredOption('-s, --schema <filePath>', 'OneAPI schema 文件地址')
  .requiredOption('-o, --output <dir>', 'OpenAPI schema 输出目录')
  .action(async (args: { schema: string; output: string }) => {
    // 转换为 OpenAPI
    const openApiPath = convertOpenApi(args);

    console.log();
    console.log('✅ openapi.json 转换完成: %s', chalk.green(openApiPath));
  });


program.parseAsync(process.argv);
