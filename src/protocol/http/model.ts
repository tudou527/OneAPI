import { TypeTransform } from '../../util/typeTransform';
import { getJsDoc } from '../../util/common';

export interface IModelMeta {
  name: string;
  classPath: string;
  description: { description: string; tags: { tagName: string, text: string }[] };
  fields: {
    name: string;
    type: JavaMeta.ActualType;
    jsType: string;
    description: {
      description: string;
      tags: {
        tagName: string;
        text: string;
      }[];
    };
  }[];
  superClass: {
    type: JavaMeta.ActualType;
    jsType: string;
    items: {
      type: JavaMeta.ActualType;
      jsType: string;
    }[];
  }
}

export default class ModelAdapter {
  // 子类
  childClassName: string;
  // 从文件读取的解析结果
  fileMeta: JavaMeta.FileMeta;
  /**
   * 参数及返回值中依赖的 classPath 导入列表
   * key: classPath
   * value: typeName
   */
  importDeclaration: { [key: string]: string } = {};

  constructor(fileMeta: JavaMeta.FileMeta) {
    this.fileMeta = fileMeta;
  }

  // 返回 interface extend 对象
  private getSuperClassMeta(extentClassType: JavaMeta.ActualType) {
    if (!extentClassType) {
      return null;
    }

    const { jsType, imports } = new TypeTransform().transform(extentClassType);
    const superClass = {
      type: extentClassType,
      jsType,
      items: [],
    }

    this.importDeclaration = { ...this.importDeclaration, ...imports };

    extentClassType.items?.forEach((type) => {
      // 转换字段类型
      const { jsType, imports } = new TypeTransform().transform(type);
      // 合并待导入项
      this.importDeclaration = { ...this.importDeclaration, ...imports };
      superClass.items.push({
        type,
        jsType,
      })
    });

    return superClass;
  }

  convert() {
    const { name, fields, classPath, superClass } = this.fileMeta.class;

    const modelMeta = {
      name,
      classPath,
      description: getJsDoc(this.fileMeta.description),
      fields: fields.map((field) => {
        // 转换字段类型
        const { jsType, imports } = new TypeTransform().transform(field.type);
        // 合并待导入项
        this.importDeclaration = { ...this.importDeclaration, ...imports };

        return {
          name: field.name,
          type: field.type,
          jsType,
          description: getJsDoc(field.description),
        }
      }),
      superClass: this.getSuperClassMeta(superClass),
    }

    return  { modelMeta, importDeclaration: this.importDeclaration };
  }
}
