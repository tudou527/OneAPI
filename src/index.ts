import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import { spawn, execSync } from 'child_process';
import { IndentationText, Project } from 'ts-morph';

import HttpProtocol from './http/index';
import { ServiceGenerator } from './http/output/service';
import { OpenApi } from './http/output/openapi';

import pkg from '../package.json';

/**
 * 从 Spring 项目解析出 OneAPI Schema
 * @param args.dir spring 项目目录
 */
export async function analysis(args: { projectDir: string; saveDir: string }) {
  try {
    execSync('which java');
  } catch(e) {
    throw new Error(chalk.red('❎ 请安装 Java 运行环境并添加环境变量。'));
  }

  try {
    execSync('which mvn');
  } catch(e) {
    throw new Error(chalk.red('❎ 请安装 Maven 运行环境并添加环境变量。'));
  }

  // 判断 projectDir 是否存在
  if (!fs.existsSync(args.projectDir)) {
    throw new Error(chalk.red(`❎ ${args.projectDir} 目录不存在`));
  }

  // 安装依赖
  await new Promise((resolve) => {
    const jar = spawn('mvn', [
      'source:jar',
      'install',
      `-Dmaven.test.skip=true`
    ], { stdio: 'inherit', cwd: args.projectDir });

    jar.on('close', function() {
      resolve('');
    });
  });

  // 从项目解析出原始数据
  const schemaUrl: string = await new Promise((resolve) => {
    const springAdapter = path.join(__dirname, '../sdk/spring-adapter-1.0.2.jar');

    const jar = spawn('java', [
      '-jar',
      springAdapter,
      `-project=${args.projectDir}`,
      // 解析结果保存到项目根目录
      `-output=${args.saveDir}`,
    ], { stdio: 'inherit', cwd: args.projectDir });

    jar.on('close', function() {
      resolve(path.join(args.saveDir, 'oneapi.json'))
    });
  });

  // schema 保存路径
  const savePath = path.join(args.saveDir, 'oneapi.json');
  // 实例化 http 协议
  const adapterDataList = new HttpProtocol().convert({ filePath: schemaUrl });

  fsExtra.writeJSONSync(savePath, {
    oneapi: {
      version: pkg.version,
      adapterVersion: '1.0.2',
    },
    http: adapterDataList,
  });

  return savePath;
}

/**
 * 从 OneAPI Schema 生成 service 文件
 */
export function generateService(args: { schema: string; requestStr: string, output: string }){
  // 本次保存的文件
  const savedFilePath: string[] = [];
  // 实例化 http 协议
  const adapterDataList = new HttpProtocol().convert({ filePath: args.schema });

  const project = new Project({
    manipulationSettings: {
      // 使用 2 个空格作为缩进
      indentationText: IndentationText.TwoSpaces
    },
  });

  // 整个项目所有依赖的 classPath
  const projectImportClassPath: string[] = [];
  adapterDataList.map(adapter => {
    Object.keys(adapter.importDeclaration).forEach(classPath => {
      if (!projectImportClassPath.includes(classPath)) {
        projectImportClassPath.push(classPath);
      }
    });
  });

  for (const adapter of adapterDataList) {
    const apiGenerator = new ServiceGenerator(args.output, project, adapter, savedFilePath);
    // 遍历创建 service
    apiGenerator.generate(projectImportClassPath, args.requestStr);
    savedFilePath.push(apiGenerator.fileSavePath);
  }

  return args.output;
}

/**
 * 转换为 OpenApi 3.0 Schema
 */
export function convertOpenApi(args: { schema: string; output: string }){
  // 实例化 http 协议
  const adapterDataList = new HttpProtocol().convert({ filePath: args.schema });

  // openApi 保存路径
  const openApiPath = path.join(args.output, 'openapi.json');

  // 转换为 OpenAPI 格式
  const openApi = new OpenApi({ httpAdapter: adapterDataList }).convert();

  fsExtra.writeJSONSync(openApiPath, openApi);

  return openApiPath;
}