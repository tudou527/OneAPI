/**
 * 协议适配层
 * 基于原始数据解析出 http 协议必须的数据
 * 用于生成 service/interface 或者 OpenAPI Schema
 */
import { JSDocStructure, OptionalKind } from 'ts-morph';

import ModelAdapter from './model';
import ServiceAdapter from './service';

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
export interface IHttpServiceParameter {
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
export function getJsDoc(desc: JavaMeta.Description): OptionalKind<JSDocStructure> {
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

export { ServiceAdapter, ModelAdapter };
