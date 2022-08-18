/**
 * 模型适配
 */
import { IHttpAdapter, getJsDoc } from '.';
import TypeTransfer from '../type-transfer';

export default class ModelAdapter {
  private httpAdapter: IHttpAdapter = null;
  // 从文件读取的解析结果
  private fileMeta?: JavaMeta.FileMeta;

  // 这里要为 fileMeta 不存在做兜底
  constructor(fileMeta?: JavaMeta.FileMeta) {
    this.fileMeta = fileMeta;

    this.httpAdapter = {
      filePath: fileMeta?.filePath,
      description: getJsDoc(fileMeta?.description),
      className: fileMeta?.class.name,
      classPath: fileMeta?.class.classPath,
      actualType: fileMeta?.class.actualType,
      fileType: fileMeta?.fileType,
      fields: [],
      importDeclaration: {},
    }
  }

  convert() {
    const { httpAdapter, fileMeta } = this;
    const { fields, superClass } = fileMeta?.class || {};

    if (Array.isArray(fields)) {
      httpAdapter.fields = fields.map((field) => {
        // 转换字段类型
        const { jsType, imports } = new TypeTransfer().transform(field.type);
        // 合并导入项
        httpAdapter.importDeclaration = {
          ...httpAdapter.importDeclaration,
          ...imports,
        }

        return {
          name: field.name,
          type: field.type,
          jsType,
          description: getJsDoc(field.description),
        }
      });
    }

    if (superClass) {
      httpAdapter.superClass = this.getSuperClassMeta(superClass);
    }

    return this.httpAdapter;
  }

  // 返回 interface extend 对象
  private getSuperClassMeta(extentClassType: JavaMeta.ActualType) {
    const { httpAdapter } = this;
    const { jsType, imports } = new TypeTransfer().transform(extentClassType);
    const superClass = {
      type: extentClassType,
      jsType,
      items: [],
    }

    // 合并导入项
    httpAdapter.importDeclaration = {
      ...httpAdapter.importDeclaration,
      ...imports,
    }

    extentClassType.items?.forEach((type) => {
      // 转换字段类型
      const { jsType, imports } = new TypeTransfer().transform(type);

      // 合并导入项
      httpAdapter.importDeclaration = {
        ...httpAdapter.importDeclaration,
        ...imports,
      }

      superClass.items.push({ type, jsType });
    });

    return superClass;
  }
}

