/**
 * service 适配
 */
import path from 'path';
import * as crypto from 'crypto';
import camelCase from 'camelcase';

import { IHttpAdapter, getJsDoc, IHttpServiceParameter, IHttpAdapterService } from '.';
import TypeTransfer from '../util/type-transfer';

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
    fileMeta.class.methods.filter(m => m.annotations.find(an => an.classPath.endsWith('Mapping'))).forEach(method => {
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
        httpAdapter.services.push({
          url,
          type,
          contentType,
          description: { ...methodDoc },
          parameter: methodParams.slice(),
          response: {
            jsType,
            type: method.return,
          },
          classPath: this.fileMeta.class.classPath,
          operationId: method.name,
        });
      });
    });

    // 处理重复 operationId
    httpAdapter.services = this.duplicateOperationId(httpAdapter.services);

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
    if (annotation?.name === 'RequestMapping') {
      const methodName = annotation.fields?.find(f => f.name === 'method')?.value || '';

      return methodName.includes('.') ? methodName.split('.')[1] : 'POST';
    }

    // 默认 post
    return methodType[annotation?.name] || 'POST';
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
    // 当有参数类型为 org.springframework.web.multipart.MultipartFile 时修改 contentType
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
    // method 注解上定义的请求类型
    const methodType = this.getMethodType(method.annotations.find(an => an.name.endsWith('Mapping')));

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
      // 是否有 @RequestParam 注解
      const paramHasParamAnnotation = p.annotations.some(an => an.name.endsWith('RequestParam'));
      // 参数是否有 @RequestBody 注解
      const paramHasPostAnnotation = p.annotations.some(an => an.name.endsWith('RequestBody')) || p.type.classPath.endsWith('MultipartFile');

      const param = {
        name: p.name,
        // 默认选填
        isRequired: false,
        isParamVariable: (methodType === 'GET' && !p.annotations.length) || paramHasParamAnnotation, 
        isPathVariable: false,
        // 是否 body 参数（post 请求时某些参数也可能是 queryString，所以这里也要区分）
        isBodyVariable: (methodType === 'POST' && !p.annotations.length) || paramHasPostAnnotation,
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

  // operationId 去重
  private duplicateOperationId(services: IHttpAdapterService[]): IHttpAdapterService[] {
    // 保存 operationId 重复次数
    const operationIdCountData: { [key: string]: number } = services.reduce((acc, cur) => {
      acc[cur.operationId] = acc[cur.operationId] || 0;
      acc[cur.operationId]++;
      return acc;
    }, {});

    return services.map((service) => {
      const { operationId, type, url, description } = service;
      const desc = description.description;

      if (operationIdCountData[operationId] > 1) {
        const hash = crypto.createHash('md5').update(`${url}-${type}-${operationId}`).digest('hex');

        service.operationId = camelCase(`${operationId}-with-hash-${hash.substring(0, 6)}`);
        service.description.description = `${desc}（由于 ${this.fileMeta.class.name} 中 ${operationId} 方法存在多个 url，此处已自动重命名为 ${service.operationId})`;
      } else {
        const newOperationId = this.escapeMethodName(operationId);
        if (newOperationId !== operationId) {
          service.description.description = `${desc}（由于 ${this.fileMeta.class.name} 中 ${operationId} 方法名为关键字，此处已自动重命名为 ${newOperationId})`;
        }

        service.operationId = newOperationId;
      }
      return service;
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
}
