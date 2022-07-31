/**
 * 协议适配层
 * 基于原始数据解析出 http 协议必须的数据
 * 用于生成 service/interface 或者 OpenAPI Schema
 */
import path from 'path';
import { JSDocStructure, OptionalKind } from 'ts-morph';

import { TypeTransform } from '../util/type-transform';

export interface IHttpAdapter {
  // 文件路径
  filePath: string;
  // 文件描述
  description: OptionalKind<JSDocStructure>;
  // 类名
  className: string;
  // 包名
  classPath: string;
  actualType: JavaMeta.ActualType[];
  // 类型
  fileType: 'RESOURCE' | 'ENTRY';
  // 依赖的导入项(key 为 classPath, value 为导入名称)
  importDeclaration: { [key: string]: string };
  // API 描述信息
  services?: IHttpAdapterService[];
  // 属性
  fields?: {
    name: string;
    type: JavaMeta.ActualType;
    jsType: string;
    description: OptionalKind<JSDocStructure>;
  }[];
  // 父类
  superClass?: {
    type: JavaMeta.ActualType;
    jsType: string;
    items: {
      type: JavaMeta.ActualType;
      jsType: string;
    }[];
  }
}
// API 描述信息
export interface IHttpAdapterService {
  // 请求 url
  url: string;
  // 请求类型： get、post、delete...
  type: string;
  // 请求内容格式
  contentType: string;
  // 描述
  description: OptionalKind<JSDocStructure>;
  // 参数
  parameter: IHttpServiceParameter[];
  // 返回
  response: {
    jsType: string;
    type: JavaMeta.ActualType,
  };
  classPath: string;
  // 代码中使用的方法名
  operationId: string;
}

// API 参数
interface IHttpServiceParameter {
  // 参数名
  name: string;
  // 是否必填
  isRequired: boolean;
  // 是否来源于 url
  isPathVariable: boolean;
  // 参数类型
  type: JavaMeta.ActualType,
  // JS 类型
  jsType: string;
}

// 生成 JS DOC 作为注释
function getJsDoc(desc: JavaMeta.Description): OptionalKind<JSDocStructure> {
  if (!desc.text && !Object.keys(desc.tag).length) {
    return null;
  }

  const tags: { tagName: string, text: string }[] = [];
  Object.keys(desc.tag).map(tag => {
    desc.tag[tag].forEach(str => {
      tags.push({
        tagName: tag,
        text: tag === 'param' ? `args.${str.trimStart()}` : str,
      });
    });
  });

  return {
    description: desc.text || '',
    tags,
  }
}


// 入口文件
export class ServiceAdapter {
  private httpAdapter: IHttpAdapter = null;
  // 从文件读取的解析结果
  private fileMeta: JavaMeta.FileMeta;

  constructor(fileMeta: JavaMeta.FileMeta) {
    this.fileMeta = fileMeta;

    this.httpAdapter = {
      filePath: fileMeta.filePath,
      description: getJsDoc(fileMeta.description),
      className: fileMeta.class.name,
      actualType: fileMeta.class.actualType,
      classPath: fileMeta.class.classPath,
      fileType: fileMeta.fileType,
      services: [],
      importDeclaration: {},
    }
  }

  // 按方法返回
  public convert() {
    const { fileMeta, httpAdapter } = this;

    // 过滤出符合条件的方法列表，这里只判断是否以 Mapping 结束（某些代码可能会自己包 annotation）
    fileMeta.class.methods.filter(m => m.annotations.find(an => an.classPath.endsWith('Mapping'))).forEach(method => {
      // 方法入参
      const methodParams = this.getMethodParams(method);
      // url、请求类型等基础信息
      const { url, type, contentType } = this.getMethodBaseInfo(method, methodParams);
      // 转换返回值类型
      const { jsType, imports } = new TypeTransform().transform(method.return);

      // 合并导入项
      httpAdapter.importDeclaration = {
        ...httpAdapter.importDeclaration,
        ...imports,
      }

      httpAdapter.services.push({
        url,
        type,
        contentType,
        description: getJsDoc(method.description),
        parameter: methodParams,
        response: {
          jsType,
          type: method.return,
        },
        classPath: this.fileMeta.class.classPath,
        operationId: method.name,
      });
    });

    return this.httpAdapter;
  }

  // 返回 class 中定义的路由前缀
  private getBaseURI() {
    let baseURI = '';

    this.fileMeta.class.annotations.forEach(an => {
      if (an.name.endsWith('Mapping')) {
        const uriField = an.fields?.find(f => f.name === 'value');
        if (uriField) {
          baseURI = uriField.value;
        }
      }
    });

    return baseURI;
  }

  // 返回请求类型
  private getMethodType(annotation: JavaMeta.Annotation): string {
    const methodType = {
      GetMapping: 'GET',
      PostMapping: 'POST',
      RequestMapping: 'POST',
    }

    return methodType[annotation.name] || 'POST';
  }

  // Api 基础信息
  private getMethodBaseInfo(method: JavaMeta.ClassMethod, params: IHttpServiceParameter[]) {
    const baseURI = this.getBaseURI();
    // 所有方法注解
    const apiAnnotation = method.annotations.find(an => an.name.endsWith('Mapping'));
    // 方法体中定义的 URI
    const methodURI = apiAnnotation?.fields.find(f => f.name === 'value')?.value || '';
    const url = path.join(baseURI, methodURI).replace(/\*/gi, '');
    // 过滤掉 pathVariable 后的参数列表
    const apiParams = params.filter(p => !p.isPathVariable);

    let contentType = 'application/json';
    // 当有参数类型为 org.springframework.web.multipart.MultipartFile 时需要修改 contentType
    if (apiParams.find(p => p.type.classPath.endsWith('.MultipartFile'))) {
      contentType = 'multipart/form-data';
    }

    return {
      url,
      type: this.getMethodType(apiAnnotation),
      contentType,
    }
  }

  // 处理方法参数
  private getMethodParams(method: JavaMeta.ClassMethod): IHttpServiceParameter[] {
    const { httpAdapter } = this;

    // 需要忽略的参数
    const ignoreParamsClassPath = [
      // 在 spring 中所有的参数都能从 HttpServletRequest 拿到
      'javax.servlet.http.HttpServletRequest',
      // 这个参数用于设置请求 response
      'javax.servlet.http.HttpServletResponse',
      // 这也是一个用于设置请求响应的参数
      'org.springframework.ui.Model',
    ];

    return method.parameters.filter(param => !ignoreParamsClassPath.includes(param.type.classPath)).map(p => {
      const { jsType, imports } = new TypeTransform().transform(p.type);

      const param = {
        name: p.name,
        // 默认选填
        isRequired: false,
        isPathVariable: false,
        type: p.type,
        jsType,
      }
      // 根据 annotation 判断是否必填
      const matchedAn = p.annotations.find(an => an.fields.find(f => ['name', 'value'].includes(f.name)));

      // 匹配到注解时需要根据注解内容替换参数名、是否必填
      if (matchedAn) {
        const anFieldName = matchedAn.fields.find(f => ['name', 'value'].includes(f.name))?.value;
        const anFieldRequired = matchedAn.fields.find(f => ['required'].includes(f.name))?.value;

        param.name = anFieldName || p.name;
        param.isRequired = typeof anFieldRequired !== 'undefined' ? anFieldRequired : param.isRequired;
      }

      // 包含 PathVariable 时认为参数来源于 url
      if (p.annotations.find(an => an.name === 'PathVariable')) {
        param.isPathVariable = true;
        // url 参数必填
        param.isRequired = true;
      }

      // 合并导入项
      httpAdapter.importDeclaration = {
        ...httpAdapter.importDeclaration,
        ...imports,
      }

      return param;
    });
  }
}

// 模型
export class ModelAdapter {
  private httpAdapter: IHttpAdapter = null;
  // 从文件读取的解析结果
  private fileMeta: JavaMeta.FileMeta;

  constructor(fileMeta: JavaMeta.FileMeta) {
    this.fileMeta = fileMeta;

    this.httpAdapter = {
      filePath: fileMeta.filePath,
      description: getJsDoc(fileMeta.description),
      className: fileMeta.class.name,
      classPath: fileMeta.class.classPath,
      actualType: fileMeta.class.actualType,
      fileType: fileMeta.fileType,
      fields: [],
      importDeclaration: {},
    }
  }

  convert() {
    const { httpAdapter, fileMeta } = this;
    const { fields, superClass } = fileMeta.class;

    httpAdapter.fields = fields.map((field) => {
      // 转换字段类型
      const { jsType, imports } = new TypeTransform().transform(field.type);
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

    if (superClass) {
      httpAdapter.superClass = this.getSuperClassMeta(superClass);
    }

    return this.httpAdapter;
  }

  // 返回 interface extend 对象
  private getSuperClassMeta(extentClassType: JavaMeta.ActualType) {
    const { httpAdapter } = this;
    const { jsType, imports } = new TypeTransform().transform(extentClassType);
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
      const { jsType, imports } = new TypeTransform().transform(type);

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

