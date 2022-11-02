import chalk from 'chalk';
import { program } from 'commander';

import { showDoc } from './doc';
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
      // 解析 OneAPI Schema
      const oneApiFilePath = await analysis({
        projectDir: getAbsolutePath(args.project),
        saveDir: getAbsolutePath(args.output),
      });

      console.log('\r\n✅OneAPI Schema 解析完成，oneapi doc 命令可以快速预览 API 文档: %s\r\n', chalk.green(oneApiFilePath));
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
    try {
      // 生成 service
      const serviceDir = generateService({
        schema: getAbsolutePath(args.schema),
        requestStr: args.requestStr,
        output: getAbsolutePath(args.output),
      });

      console.log('\r\n✅Services 文件生成完成: %s\r\n', chalk.green(serviceDir));
    } catch(e) {
      console.log(e);
      console.log();
    }
  });

program
  .command('openapi')
  .description('生成 OpeAPI 3.0 schema')
  .requiredOption('-s, --schema <filePath>', 'OneAPI schema 文件地址')
  .requiredOption('-o, --output <dir>', 'OpenAPI schema 输出目录')
  .action(async (args: { schema: string; output: string }) => {
    try {
      // 转换为 OpenAPI
      const openApiPath = convertOpenApi({
        schema: getAbsolutePath(args.schema),
        output: getAbsolutePath(args.output),
      });

      console.log();
      console.log('\r\n✅openapi.json 转换完成: %s\r\n', chalk.green(openApiPath));
    } catch(e) {
      console.log(e);
      console.log();
    }
  });

program
  .command('doc')
  .description('预览文档')
  .requiredOption('-s, --schema <filePath>', 'OneAPI schema 文件地址')
  .action(async (args: { schema: string; }) => {
    try {
      const url = await showDoc({
        schema: getAbsolutePath(args.schema),
      });

      console.log('\r\n🔗在线文档地址: %s\r\n', chalk.green(url));
    } catch(e) {
      console.log(e);
      console.log();
    }
  });


program.version(pkg.version, '-v, --version', '打印版本号');
program.parseAsync(process.argv);
