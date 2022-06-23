import path from 'path';
import { InterfaceDeclaration, SourceFile } from 'ts-morph';

import { TypeTransform } from './typeTransform';
import { baseDir, generatorFileComment, getImports, getJsDoc, metaData, project } from '../util/common';

export class ModelGenerator {
  // 子类
  childClassName: string;

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

    const fileSavePath = ModelGenerator.getSavePath(classPath);

    if (classPath.includes('$')) {
      this.childClassName = classPath.split('$')[1];

      this.sourceFile = project.getSourceFile(fileSavePath);
    } else {
      this.sourceFile = project.createSourceFile(fileSavePath);
    }
  }

  // 返回文件保存路径
  static getSavePath(classPath: string) {
    let [fileName, fileDir] = classPath.split('.').reverse();

    if (fileName.includes('$')) {
      fileName = fileName.split('$')[0];
    }

    /**
     * classPath 按 . 拆分，倒数第二项作为目录，最后一项作为文件名
     */
    return path.join(baseDir, 'model', fileDir, `${fileName}.ts`);
  }

  async gen() {
    // 生成调用方法
    await this.generatorInterface();

    // 子类不需要重复执行以下操作
    if (!this.childClassName) {
      // 增加导入
      const importList = getImports(this.importDeclaration, this.sourceFile.getFilePath());
      this.sourceFile.addImportDeclarations(importList);

      // 增加文件注释内容
      generatorFileComment(this.fileMeta).reverse().forEach((str) => {
        this.sourceFile.insertStatements(0, str);
      });
    }

    await this.sourceFile.save();
  }

  // 生成 interface
  private async generatorInterface() {
    const { name, fields, actualType, superClass } = this.fileMeta.class;
    const exportInterface = this.sourceFile.addInterface({
      name,
      isExported: true,
      typeParameters:  actualType?.map(t => t.name),
    });

    // 父类（只有一个）
    if (superClass) {
      this.setExtend(superClass, exportInterface);
    }

    // 增加字段
    fields.forEach((field, index) => {
      // 转换字段类型
      const { jsType, imports } = new TypeTransform().transform(field.type);
      // 合并待导入项
      this.importDeclaration = { ...this.importDeclaration, ...imports };

      const propertySignature = exportInterface.insertProperty(index, {
        name: field.name,
        type: jsType,
      });

      // 增加字段注释
      const jsDoc = getJsDoc(field.description);
      jsDoc && propertySignature.addJsDoc(jsDoc);

      // const d: OrganizationGraphVO;
      // d.targetLayer;
    });
  }

  // 返回 interface extend 对象
  private setExtend(superClass: JavaMeta.ActualType, interfaceDeclaration: InterfaceDeclaration) {
    if (!superClass) {
      return null;
    }

    const extend = interfaceDeclaration.addExtends(superClass.name);

    if (superClass.items) {
      this.importDeclaration[superClass.classPath] = superClass.name;

      superClass.items?.forEach((item, index) => {
        // 转换字段类型
        const { jsType, imports } = new TypeTransform().transform(item);
        // 合并待导入项
        this.importDeclaration = { ...this.importDeclaration, ...imports };
        extend.insertTypeArgument(index, jsType);
      });
    }
  }
}

// 生成 service
export default async function generatorModel() {
  // 过滤出入资源文件
  const sourceClassPath = Object.keys(metaData).filter(classPath => metaData[classPath].fileType === 'RESOURCE').sort((a, b) => {
    // 排序，让包含 $ 的 class 往后排，确保写入前对应的父类文件已存在
    return a.indexOf('$') - b.indexOf('$');
  });

  for (const classPath of sourceClassPath) {
    await (new ModelGenerator(classPath)).gen();
  }
}
