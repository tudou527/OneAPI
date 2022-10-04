import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { spawn, execSync } from 'child_process';
import { IndentationText, Project } from 'ts-morph';

import HttpProtocol from './http/index';
import { ServiceGenerator } from './http/output/service';
import { OpenApi } from './http/output/openapi';

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

  // 从项目解析出 oneapi.json
  return await new Promise((resolve) => {
    const springAdapter = path.join(__dirname, '../sdk/spring-adapter-1.0.1.jar');

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
}

/**
 * 从 OneAPI Schema 生成 service 文件
 */
export function generateService(args: { schema: string; requestStr: string, output: string }){
  // 实例化 http 协议
  const httpPotocol = new HttpProtocol({
    filePath: args.schema,
    saveDir: args.output,
  });

  const project = new Project({
    manipulationSettings: {
      // 使用 2 个空格作为缩进
      indentationText: IndentationText.TwoSpaces
    },
  });

  // 整个项目所有依赖的 classPath
  let projectImportClassPath: string[] = [];
  httpPotocol.adapterDataList.map(adapter => {
    Object.keys(adapter.importDeclaration).forEach(classPath => {
      if (!projectImportClassPath.includes(classPath)) {
        projectImportClassPath.push(classPath);
      }
    });
  });

  const serviceDir = path.join(args.output, 'services');
  // 清空 services 目录
  fs.emptyDirSync(serviceDir);

  for (let adapter of httpPotocol.adapterDataList) {
    const apiGenerator = new ServiceGenerator(serviceDir, project, adapter);
    // 遍历创建 service
    apiGenerator.generate(projectImportClassPath, args.requestStr);
  }

  return serviceDir;
}

/**
 * 转换为 OpenApi 3.0 Schema
 */
export function convertOpenApi(args: { schema: string; output: string }){
  // 实例化 http 协议
  const httpPotocol = new HttpProtocol({
    filePath: args.schema,
    saveDir: args.output,
  });

  // openApi 保存路径
  const openApiPath = path.join(args.output, 'openapi.json');

  // 转换为 OpenAPI 格式
  const openApi = new OpenApi({
    httpAdapter: httpPotocol.adapterDataList,
  }).convert();

  fs.writeJSONSync(openApiPath, openApi);

  return openApiPath;
}