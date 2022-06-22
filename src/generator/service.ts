import path from 'path';
import camelCase from 'camelcase';
import { FunctionDeclaration, SourceFile } from 'ts-morph';

import { baseDir, convertJavaTypeToJS, getJsDoc, metaData, project } from '../util/common';

class ServiceGenerator {
  // 从文件读取的解析结果
  fileMeta: JavaMeta.FileMeta;
  // ts-morph 用于生成文件的对象
  sourceFile: SourceFile;
  /**
   * 参数及返回值中依赖的 classPath 导入列表
   * key: classPath
   * value: typeName
   */
  importDeclaration: { [key: string]: string } = {};

  constructor(classPath: string) {
    this.fileMeta = metaData[classPath];

    const { packageName, class: className } = this.fileMeta;

    /**
     * class.name 作为文件名
     * 生成的文件按 packageName 最后一级作为目录
     * Exp: a.b.c.d 时，按 d/ 生成目录
     */
    const fileSavePath = path.join(baseDir, packageName.split('.').reverse().at(0), `${className.name}.ts`);

    this.sourceFile = project.createSourceFile(fileSavePath);
  }

  async gen() {
    // 生成调用方法
    await this.generatorMethod();
    // 增加导入
    await this.addImports();

    // 增加文件注释内容（会报错，先注释）
    // const fileComment = generatorFileComment(this.fileMeta.description);
    // this.sourceFile.insertStatements(0, fileComment.join('\n'));

    await this.sourceFile.save();
  }

  // 生成调用方法
  async generatorMethod() {
    // 过滤出符合条件的方法列表
    const apiMethods = this.fileMeta.class.methods.filter(m => {
      // 这里只判断是否以 Mapping 结束（某些代码可能会自己包 annotation）
      return m.annotations.find(an => an.classPath.endsWith('Mapping'));
    });

    for (const method of apiMethods) {
      const func = this.sourceFile.addFunction({
        name: this.escapeMethodName(method.name),
        isAsync: true,
        isExported: true,
      });

      // 增加方法注释
      const jsDoc = getJsDoc(method.description)
      jsDoc && func.addJsDoc(jsDoc);

      // 处理方法参数
      this.generatorParameter(func, method);

      // 设置方法体内容
      func.setBodyText(writer => {
        writer.writeLine("const myNumber = 5;")
          .write("if (myNumber === 5)").block(() => {
            writer.writeLine("console.log('yes')");
          })
      });

      // 添加返回值
      const returnType = convertJavaTypeToJS(method.return);
      func.setReturnType(`Promise<${returnType}>`);
    }
  }

  // 增加导入
  async addImports() {
    for(const classPath in this.importDeclaration) {
      this.sourceFile.addImportDeclaration({
        namedImports: [ this.importDeclaration[classPath] ],
        moduleSpecifier: './a', // path.relative(this.sourceFile.getFilePath(), model.sourceFile.getFilePath()).replace(/^\.\.\//gi, ''),
      });
    }
  }

  // 生成入参
  generatorParameter(func: FunctionDeclaration, method: JavaMeta.ClassMethod) {
    const { parameters } = method;

    if (!parameters.length) {
      return;
    }

    parameters.forEach(p => {
      func.addParameter({
        name: p.name,
        type: convertJavaTypeToJS(p.type),
      });
    });
  }

  // 替换 method 中的关键字
  escapeMethodName(name: string) {
    const whiteList = ['delete'];

    // name 匹配白名单列表时根据一定的规则转换名称
    if (whiteList.includes(name)) {
      return camelCase(`${name}_${this.fileMeta.packageName.split('.').reverse().at(0)}`);
    }

    return name;
  }
}

// 生成 service
export default async function generatorService() {
  // 过滤出入口文件
  const entryClassPath = Object.keys(metaData).filter(classPath => metaData[classPath].fileType === 'ENTRY');

  for (const classPath of entryClassPath) {
    (new ServiceGenerator(classPath)).gen();
  }
}