// import path from 'path';
// import camelCase from 'camelcase';
// import { FunctionDeclaration, SourceFile } from 'ts-morph';

// import { TypeTransform } from '../util/typeTransform';
// import { baseDir, generatorFileComment, getImports, getJsDoc, getMethodType, metaData, project, requestImport, sourceClassPathMap } from '../util/common';

// // API 待处理参数
// interface IApiParam {
//   // 参数名
//   name: string;
//   // 是否必填
//   isRequired: boolean;
//   // 是否来源于 url
//   isPathVariable: boolean;
//   // 参数类型
//   type: JavaMeta.ActualType,
// }

// class ServiceSchema {
//   // class 中定义的路由前缀
//   baseURI: string = '';
//   // 从文件读取的解析结果
//   fileMeta: JavaMeta.FileMeta;
//   /**
//    * 参数及返回值中依赖的 classPath 导入列表
//    * key: classPath
//    * value: typeName
//    */
//   importDeclaration: { [key: string]: string } = {};

//   constructor(classPath: string) {
//     this.fileMeta = metaData[classPath];

//     this.analysisBaseUri();
//   }

//   async gen() {
//     const methodSchema = this.fileMeta.class.methods.filter(m => {
//       // 这里只判断是否以 Mapping 结束（某些代码可能会自己包 annotation）
//       return m.annotations.find(an => an.classPath.endsWith('Mapping'));
//     }).map((method) => {
//       // 增加方法注释
//       const jsDoc = getJsDoc(method.description)
//       // 方法入参
//       const methodParams = this.getMethodParams(method);

//       // 转换返回值类型
//       const { jsType, imports } = new TypeTransform().transform(method.return);
//       // 合并待导入项
//       this.importDeclaration = { ...this.importDeclaration, ...imports };

//       // 缓存需要导入的资源
//       Object.keys(this.importDeclaration).forEach(classPath => sourceClassPathMap[classPath] = false);
//     });
//   }

//   // 处理方法参数
//   private getMethodParams(method: JavaMeta.ClassMethod) {
//     const paramList: IApiParam[] = [];
//     // 需要忽略的参数
//     const ignoreParamsClassPath = [
//       // 在 spring 中所有的参数都能从 HttpServletRequest 拿到
//       'javax.servlet.http.HttpServletRequest',
//       // 这个参数用于设置请求 response
//       'javax.servlet.http.HttpServletResponse',
//       // 这也是一个用于设置请求响应的参数
//       'org.springframework.ui.Model',
//     ];
//     const parameters = method.parameters.filter(param => !ignoreParamsClassPath.includes(param.type.classPath));

//     parameters.forEach(p => {
//       const param = {
//         name: p.name,
//         // 默认选填
//         isRequired: false,
//         isPathVariable: false,
//         type: p.type,
//       }
//       // 根据 annotation 判断是否必填
//       const matchedAn = p.annotations.find(an => an.fields.find(f => ['name', 'value'].includes(f.name)));

//       // 匹配到注解时需要根据注解内容替换参数名、是否必填
//       if (matchedAn) {
//         const anFieldName = matchedAn.fields.find(f => ['name', 'value'].includes(f.name))?.value;
//         const anFieldRequired = matchedAn.fields.find(f => ['required'].includes(f.name))?.value;

//         param.name = anFieldName || p.name;
//         param.isRequired = typeof anFieldRequired !== 'undefined' ? anFieldRequired : param.isRequired;
//       }

//       // 包含 PathVariable 时认为参数来源于 url
//       if (p.annotations.find(an => an.name === 'PathVariable')) {
//         param.isPathVariable = true;
//         // url 参数必填
//         param.isRequired = true;
//       }

//       paramList.push(param);
//     });

//     return paramList;
//   }

//   // 生成调用方法
//   private getBasicInfo(method: JavaMeta.ClassMethod, params: IApiParam[]) {
//     // 所有方法注解
//     const apiAnnotation = method.annotations.find(an => an.name.endsWith('Mapping'));
//     // 方法体中定义的 URI
//     const methodURI = apiAnnotation?.fields.find(f => f.name === 'value')?.value || '';
//     // 请求类型及 url
//     const methodType = getMethodType(apiAnnotation);
//     const url = path.join(this.baseURI, methodURI).replace(/\*/gi, '');

//     // 请求 headers
//     const headers: { [key: string]: string } = {
//       'Content-Type': 'application/json',
//     };
//     // 当有参数类型为 org.springframework.web.multipart.MultipartFile 时需要修改 contentType
//     if (params.find(p => p.type.classPath.endsWith('.MultipartFile'))) {
//       headers['Content-Type'] = 'multipart/form-data';
//     }

//     return {
//       method: methodType,
//       url,
//       headers,
//     };
//   }

//   // 解析基础路由
//   private analysisBaseUri() {
//     let baseURI = '';

//     this.fileMeta.class.annotations.forEach(an => {
//       if (an.name.endsWith('Mapping')) {
//         const uriField = an.fields?.find(f => f.name === 'value');
//         if (uriField) {
//           baseURI = uriField.value;
//         }
//       }
//     });

//     this.baseURI = baseURI;
//   }
// }

// // 生成 service
// export default async function generatorServiceOpenApi() {
//   // 过滤出入口文件
//   const entryClassPath = Object.keys(metaData).filter(classPath => metaData[classPath].fileType === 'ENTRY');

//   for (const classPath of entryClassPath) {
//     await (new ServiceSchema(classPath)).gen();
//   }
// }
