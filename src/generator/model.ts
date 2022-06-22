import path from 'path';
import { InterfaceDeclaration, SourceFile } from 'ts-morph';

import { baseDir, convertJavaTypeToJS, getJsDoc, metaData, project } from '../util/common';

class ModelGenerator {
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
    const fileSavePath = path.join(baseDir, 'model', packageName.split('.').reverse().at(0), `${className.name}.ts`);

    this.sourceFile = project.createSourceFile(fileSavePath);
  }

  async gen() {
    // 生成调用方法
    await this.generatorInterface();
    // 增加导入
    // await this.addImports();

    // 增加文件注释内容（会报错，先注释）
    // const fileComment = generatorFileComment(this.fileMeta.description);
    // this.sourceFile.insertStatements(0, fileComment.join('\n'));

    await this.sourceFile.save();
  }

  async generatorInterface() {
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

    // 增加属性
    fields.forEach((field, index) => {
      const propertySignature = exportInterface.insertProperty(index, {
        name: field.name,
        type: convertJavaTypeToJS(field.type),
      });

      // 增加字段注释
      const jsDoc = getJsDoc(field.description);
      jsDoc && propertySignature.addJsDoc(jsDoc);

      // const d: OrganizationGraphVO;
      // d.targetLayer;
    });
  }

  // 返回 interface extend 对象
  setExtend(superClass: JavaMeta.ActualType, interfaceDeclaration: InterfaceDeclaration) {
    if (!superClass) {
      return null;
    }

    const extend = interfaceDeclaration.addExtends(superClass.name);
    if (superClass.items) {
      superClass.items?.forEach((item, index) => {
        extend.insertTypeArgument(index, convertJavaTypeToJS(item));
      });
    }
  }
}

// 生成 service
export default async function generatorModel() {
  // 过滤出入资源文件
  const sourceClassPath = Object.keys(metaData).filter(classPath => metaData[classPath].fileType === 'RESOURCE');

  for (const classPath of sourceClassPath) {
    (new ModelGenerator(classPath)).gen();
  }
}
