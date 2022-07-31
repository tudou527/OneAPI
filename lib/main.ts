import path from 'path';
import chalk from 'chalk';
import { spawn, execSync } from 'child_process';

import HttpProtocol from './http/index';

/**
 * @param args.dir spring 项目目录
 */
export default async function main(args: { projectDir: string }) {
  try {
    execSync('which java');
  } catch(e) {
    throw new Error(chalk.red('❎请安装 Java 运行环境并添加环境变量。'));
  }

  // 先从 spring 项目解析出 oneapi.json
  const jsonSchemaPath: string = await new Promise((resolve) => {
    const springAdapter = path.join(__dirname, '../sdk/spring-adapter-1.0.0.jar');

    const jar = spawn('java', [
      '-jar',
      springAdapter,
      `-project=${args.projectDir}`,
      // 解析结果保存到项目根目录
      `-output=${args.projectDir}`,
    ], { stdio: 'inherit' });
    
    jar.on('close', function() {
      resolve(path.join(args.projectDir, 'oneapi.json'))
    });
  });

  // 实例化 http 协议
  const httpPotocol = new HttpProtocol(jsonSchemaPath);
  // 生成 OpenAPI schema
  httpPotocol.generateOpenApi();

  console.log('>>>>> args: ', args);
}
