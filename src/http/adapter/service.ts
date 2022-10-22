/**
 * service 适配
 */
import path from 'path';
import camelCase from 'camelcase';

import { IHttpAdapter, getJsDoc, IHttpServiceParameter } from '.';
import TypeTransfer from '../util/type-transfer';

// 入口文件
export default class ServiceAdapter {
  private httpAdapter: IHttpAdapter = null;
  // 从文件读取的解析结果
  private fileMeta: JavaMeta.FileMeta;
  // 保存用于判断 methodName 是否重复的对象 value 为重复次数
  methodData: { [key: string]: number } = {};

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

    fileMeta.class.methods.map(method => {
      const name = this.escapeMethodName(method.name);
      this.methodData[name] = !this.methodData[name] ? 1 : this.methodData[name] + 1;
    });

    // 过滤出符合条件的方法列表，这里只判断是否以 Mapping 结束（某些代码可能会自己包 annotation）
    fileMeta.class.methods.filter(m => m.annotations.find(an => an.classPath.endsWith('Mapping'))).forEach(method => {
      const escapeName = this.escapeMethodName(method.name);
      // 方法入参
      const methodParams = this.getMethodParams(method);
      // url、请求类型等基础信息
      const { urls, type, contentType } = this.getMethodBaseInfo(method, methodParams);
      // 转换返回值类型
      const { jsType, imports } = new TypeTransfer().transform(method.return);
      // 方法注释
      const methodDoc = getJsDoc(method.description, method.annotations);

      // 合并导入项
      httpAdapter.importDeclaration = {
        ...httpAdapter.importDeclaration,
        ...imports,
      }

      urls.forEach(url => {
        // 方法名称
        const operationId = this.getUniqueMethodName(escapeName, url, type);

        if (this.methodData[escapeName] > 1) {
          methodDoc.description = `${methodDoc.description}（由于 ${this.fileMeta.class.name} 中 ${method.name} 方法重复，此处已自动重命名为 ${operationId})`;
        }

        httpAdapter.services.push({
          url,
          type,
          contentType,
          description: methodDoc,
          parameter: methodParams,
          response: {
            jsType,
            type: method.return,
          },
          classPath: this.fileMeta.class.classPath,
          operationId,
        });
      });
    });

    return httpAdapter;
  }

  /**
   * 返回 class 中定义的路由前缀，可能存在多个：
   * Exp: @RequestMapping({"/xxx/a","/xxx/b"})
   */
  private getBaseURI() {
    // 注解可能不存在，所以这里需要返回一个空数组
    let baseURIs: string[] = [''];

    this.fileMeta.class.annotations?.forEach(an => {
      if (an.name.endsWith('Mapping')) {
        const uriField = an.fields?.find(f => f.name === 'value');
        if (uriField) {
          baseURIs = [].concat(uriField.value);
        }
      }
    });

    return baseURIs;
  }

  // 返回请求类型
  private getMethodType(annotation: JavaMeta.Annotation): string {
    const methodType = {
      GetMapping: 'GET',
      PostMapping: 'POST',
    }

    // 注解为 requestMapping 时，进一步判断是 GET 还是 POST
    if (annotation.name === 'RequestMapping') {
      const methodName = annotation.fields?.find(f => f.name === 'method')?.value || '';

      return methodName.includes('.') ? methodName.split('.')[1] : 'POST';
    }

    // 默认 post
    return methodType[annotation.name] || 'POST';
  }

  // Api 基础信息
  private getMethodBaseInfo(method: JavaMeta.ClassMethod, params: IHttpServiceParameter[]) {
    const baseURIs = this.getBaseURI();
    // method 中申明请求基本信息的注解
    const apiAnnotation = method.annotations.find(an => an.name.endsWith('Mapping'));
    // 方法注解中定义的请求 uri，也可能存在多个
    const methodURIs = [].concat(apiAnnotation.fields?.find(f => f.name === 'value')?.value || '');

    // 组合 controller、method 中定义的 uri
    const urls = baseURIs.map((baseURI: string) => {
      return methodURIs.map((methodURI: string) => {
        return path.join(baseURI, methodURI).replace(/\*/gi, '');
      });
    }).flat();

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
      urls: urls,
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
      const matchedAn = p.annotations.find(an => an.name === 'RequestParam');

      // 匹配到注解时需要根据注解内容替换参数名、是否必填
      if (matchedAn) {
        const anFieldName = matchedAn.fields.find(f => ['name', 'value'].includes(f.name))?.value;
        const anFieldRequired = matchedAn.fields.find(f => ['required'].includes(f.name))?.value;

        param.name = anFieldName || p.name;
        param.isRequired = anFieldRequired === 'true' ? true : param.isRequired;
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

  // 替换 method 中的关键字
  private escapeMethodName(name: string) {
    const whiteList = ['delete'];

    // name 匹配白名单列表时根据一定的规则转换名称
    if (whiteList.includes(name)) {
      return camelCase(`${name}_${this.httpAdapter.classPath.split('.').reverse().at(1)}`);
    }

    return name;
  }

  // 返回不重复的 methodName
  private getUniqueMethodName(escapeName: string, url: string, methodType: string) {
    // 不存在或只出现一次时使用 defaultName 
    if (!this.methodData[escapeName] || this.methodData[escapeName] === 1) {
      return escapeName;
    }

    const urlStr = url.split('/').map(str => str.replace(/[^a-z0-9]/gi, '')).reverse();

    return camelCase(`${urlStr.at(1) || ''}_${urlStr.at(0)}_with_${methodType}`);
  }
}
