import chalk from 'chalk';
import { program } from 'commander';

import { getAbsolutePath } from './utils/common';
import { analysis, generateService, convertOpenApi } from './index';

import pkg from '../package.json';

program
  .command('analysis')
  .description('从 Spring 项目解析出 OneAPI schema')
  .requiredOption('-p, --project <dir>', 'Spring 项目本地目录')
  .requiredOption('-o, --output <dir>', 'OneAPI schema 输出目录')
  .action(async (args: { project: string; output: string }) => {
    try {
      // 开始时间
      const startTime = Date.now();

      // 解析 OneAPI Schema
      const oneApiFilePath = await analysis({
        projectDir: getAbsolutePath(args.project),
        saveDir: getAbsolutePath(args.output),
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
    const serviceDir = generateService({
      schema: getAbsolutePath(args.schema),
      requestStr: args.requestStr,
      output: getAbsolutePath(args.output),
    });

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
    const openApiPath = convertOpenApi({
      schema: getAbsolutePath(args.schema),
      output: getAbsolutePath(args.output),
    });

    console.log();
    console.log('✅ openapi.json 转换完成: %s', chalk.green(openApiPath));
  });

program.version(pkg.version, '-v, --version', '打印版本号');

program.parseAsync(process.argv);
