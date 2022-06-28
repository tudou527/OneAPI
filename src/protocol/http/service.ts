import path from 'path';

import { TypeTransform } from '../../util/typeTransform';
import { getJsDoc, getMethodType } from '../../util/common';

// API 待处理参数
interface IApiParam {
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

export interface IServiceMeta {
  // 请求 url
  url: string;
  // 请求类型
  type: string;
  contentType: string;
  description: { description: string; tags: { tagName: string, text: string }[] };
  parameter: IApiParam[];
  response: {
    jsType: string;
    type: JavaMeta.ActualType,
  }
}

export default class ServiceAdapter {
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

  // 生成调用方法
  private getMethodBaseInfo(method: JavaMeta.ClassMethod, params: IApiParam[]) {
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
      type: getMethodType(apiAnnotation),
      contentType,
    }
  }

  // 处理方法参数
  private getMethodParams(method: JavaMeta.ClassMethod): IApiParam[] {
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
      this.importDeclaration = {
        ...this.importDeclaration,
        ...imports,
      }

      return param;
    });
  }

  // 按方法返回
  public convert() {
    /**
     * 过滤出符合条件的方法列表
     * 这里只判断是否以 Mapping 结束（某些代码可能会自己包 annotation）
     */
    const serviceMeta = this.fileMeta.class.methods.filter(m =>m.annotations.find(an => an.classPath.endsWith('Mapping'))).map(method => {
      // 方法入参
      const methodParams = this.getMethodParams(method);
      // url、请求类型等基础信息
      const baseInfo = this.getMethodBaseInfo(method, methodParams);
      // 转换返回值类型
      const { jsType, imports } = new TypeTransform().transform(method.return);

      // 合并导入项
      this.importDeclaration = {
        ...this.importDeclaration,
        ...imports,
      }

      return {
        ...baseInfo,
        // 方法注释
        description: getJsDoc(method.description),
        parameter: methodParams,
        response: {
          jsType,
          type: method.return,
        }
      }
    });

    return {
      serviceMeta,
      importDeclaration: this.importDeclaration
    };
  }
}
