/**
 * 模型适配
 */
import { IHttpAdapter, getJsDoc } from '.';
import TypeTransfer from '../util/type-transfer';

export default class ModelAdapter {
  private httpAdapter: IHttpAdapter = null;
  // 从文件读取的解析结果
  private fileMeta?: JavaMeta.FileMeta;

  // 这里要为 fileMeta 不存在做兜底
  constructor(classPath: string, fileMetaDict: { [key: string]: JavaMeta.FileMeta }) {
    const fileMeta = fileMetaDict[classPath];

    this.httpAdapter = {
      filePath: fileMeta?.filePath,
      description: getJsDoc(fileMeta?.description),
      className: classPath.slice().split('.').reverse().at(0),
      classPath: classPath,
      actualType: fileMeta?.class.actualType,
      fileType: fileMeta?.fileType,
      fields: [],
      importDeclaration: {},
    }

    this.fileMeta = fileMeta;
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
          description: getJsDoc(field.description, field.annotations),
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

