/**
 * 生成 .ts 文件
 */
import fs from 'fs';
import path from 'path';
import camelCase from 'camelcase';
import { Project, SourceFile } from 'ts-morph';

import { IHttpAdapter, IHttpAdapterService } from '../adapter';

export class ServiceGenerator {
  baseDir: string;
  project: Project;
  httpAdapter: IHttpAdapter;
  // ts-morph 用于生成文件的对象
  sourceFile: SourceFile;

  constructor(baseDir: string, project: Project, httpAdapter: IHttpAdapter) {
    this.baseDir = baseDir;
    this.httpAdapter = httpAdapter;
    this.project = project;

    const fileSavePath = this.getFilePath(httpAdapter.classPath,httpAdapter.fileType);

    if (fs.existsSync(fileSavePath)) {
      this.sourceFile = project.getSourceFile(fileSavePath);
    } else {
      this.sourceFile = project.createSourceFile(fileSavePath, null, { overwrite: true });
    }
  }

  generate(projectImportClassPath: string[]) {
    const { fileType, services } = this.httpAdapter;

    // 生成调用方法
    if (fileType === 'ENTRY') {
      services?.forEach(service => this.generateMethod(service));
    } else {
      this.generateInterface();
    }

    // 导入 requests
    this.addImport(projectImportClassPath);

    // 增加文件注释
    const firstLine = this.sourceFile.getStatementsWithComments().at(0);
    if (!firstLine.getText().includes('@ts-nocheck')) {
      this.sourceFile.insertStatements(0, 'import request from "@/utils/request";');
    }

    this.sourceFile.saveSync();
  }

  // 根据 classPath 计算文件路径
  private getFilePath(classPath: string, fileType: string) {
    /**
     * class.name 作为文件名
     * 对于资源文件，生成的文件按 classPath 最后一级作为目录，Exp: a.b.c.d 时，按 d/ 生成目录
     */
    let [fileName, fileDir] = classPath.split('.').reverse();

    // 子类与父类使用一个文件
    if (fileName.includes('$')) {
      fileName = fileName.split('$')[0];
    }

    return path.join(this.baseDir, fileType === 'ENTRY' ? '' : `model/${fileDir}`, `${fileName}.ts`);
  }

  // 增加导入
  private addImport(projectImportClassPath: string[]) {
    const { importDeclaration } = this.httpAdapter;

    Object.keys(importDeclaration).filter(classPath => projectImportClassPath.includes(classPath)).forEach(classPath => {
      // 当前文件路径
      const currentFilePath = this.sourceFile.getFilePath();
      // 待导入文件路径
      const importFilePath = this.getFilePath(classPath, 'RESOURCE');
      let relativePath = path.relative(path.dirname(currentFilePath), importFilePath).replace('.ts', '');

      // 特殊处理通目录的文件引用
      if (!relativePath.startsWith('../')) {
        relativePath = `./${relativePath}`;
      }

      if (importFilePath !== currentFilePath) {
        this.sourceFile.addImportDeclaration({
          namedImports: [ importDeclaration[classPath] ],
          moduleSpecifier: relativePath,
        });
      }
    });
  }

  // 生成调用方法
  private generateMethod(service: IHttpAdapterService) {
    const func = this.sourceFile.addFunction({
      name: this.escapeMethodName(service.operationId),
      isAsync: true,
      isExported: true,
    });
    const { url, type, parameter, contentType } = service;
    // 当 url 中包含参数时，使用 ` 否者用 '
    const urlDecorate = url.includes('{') ? '\`' : '\'';
    // 过滤掉 pathVariable 后的参数列表
    const apiParams = parameter.filter(p => !p.isPathVariable);

    // 增加方法注释
    service.description && func.addJsDoc(service.description);

    // 处理方法参数
    if (service.parameter.length) {
      func.addParameter({
        // 把所有参数放到 args. 对象中
        name: 'args',
        type: (writer) => {
          writer.block(() => {
            service.parameter.forEach(p => {
              writer.writeLine(`${p.name}${!p.isRequired ? '?' : ''}: ${p.jsType},`);
            });
          });
        }
      });
    }

    // 设置方法体内容
    func.setBodyText(writer => {
      writer.write('return request(').inlineBlock(() => {
        writer.writeLine(`method: '${type}',`);
        writer.writeLine(`url: ${urlDecorate}${url.replace('/{', '/${args.')}${urlDecorate},`);
        // 请求参数
        if (apiParams.length) {
          writer.write(`${type === 'GET' ? 'params' : 'data'}: `).inlineBlock(() => {
            // 过滤掉 url 参数
            apiParams.forEach(p => writer.writeLine(`${p.name}: args.${p.name},`));
          });
          writer.write(',\n');
        }
        writer.write(`headers: `).inlineBlock(() => {
          writer.writeLine(`'Content-Type': '${contentType}',`)
        });
        writer.write(',');
      });
      writer.write(`);`);
    });

    // 添加返回值
    func.setReturnType(`Promise<${service.response.jsType}>`);
  }

  // 生成 interface
  private generateInterface() {
    const { description, className, actualType, superClass, fields } = this.httpAdapter;

    const exportInterface = this.sourceFile.addInterface({
      name: className,
      isExported: true,
      // 泛型默认值设置为 any
      typeParameters: actualType?.map(t => ({ name: t.name, default: 'any' })),
    });

    // 增加方法注释
    description && exportInterface.addJsDoc(description);

    // 增加字段
    fields?.forEach((f, index) => {
      const propertySignature = exportInterface.insertProperty(index, {
        name: f.name,
        type: f.jsType,
      });

      // 增加字段注释
      f.description && propertySignature.addJsDoc(f.description);
    });

    if (superClass) {
      const extend = exportInterface.addExtends(superClass.type.name);

      superClass.items?.forEach((item, index) => {
        // 合并待导入项
        extend.insertTypeArgument(index, item.jsType);
      });
    }
  }

  // 替换 method 中的关键字
  private escapeMethodName(name: string) {
    const whiteList = ['delete'];

    // name 匹配白名单列表时根据一定的规则转换名称
    if (whiteList.includes(name)) {
      return camelCase(`${name}_${this.httpAdapter.classPath.split('.').reverse().at(1)}`);
    }

    return name;
  }
}
