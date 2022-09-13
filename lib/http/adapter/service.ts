/**
 * service 适配
 */
import path from 'path';

import { IHttpAdapter, getJsDoc, IHttpServiceParameter } from '.';
import TypeTransfer from '../type-transfer';

// 入口文件
export default class ServiceAdapter {
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
    fileMeta.class.methods.filter(m => m.annotations.find(an => an.classPath.endsWith('Mapping')))?.forEach(method => {
      // 方法入参
      const methodParams = this.getMethodParams(method);
      // url、请求类型等基础信息
      const { url, type, contentType } = this.getMethodBaseInfo(method, methodParams);
      // 转换返回值类型
      const { jsType, imports } = new TypeTransfer().transform(method.return);

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

    this.fileMeta.class.annotations?.forEach(an => {
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
    }

    // 注解为 requestMapping 时，进一步判断是 GET 还是 POST
    if (annotation.name === 'RequestMapping') {
      const methodName = annotation.fields.find(f => f.name === 'method')?.value || '';

      return methodName.includes('.') ? methodName.split('.')[1] : 'POST';
    }

    // 默认 post
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

    let methodType = this.getMethodType(apiAnnotation);
    let contentType = 'application/json';
    // 当有参数类型为 org.springframework.web.multipart.MultipartFile 时需要修改 contentType
    if (apiParams.find(p => p.type.classPath.endsWith('.MultipartFile'))) {
      contentType = 'multipart/form-data';
      methodType = 'POST';
    }

    return {
      url,
      type: methodType,
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
      const { jsType, imports } = new TypeTransfer().transform(p.type);

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
