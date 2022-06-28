import path from 'path';
import fs from 'fs-extra';
import { ImportDeclarationStructure, IndentationText, Project } from "ts-morph";
import { ModelGenerator } from '../generator/model';

export let baseDir: string;
export let project: Project;
export let requestImport = {
  kind: 2,
  namedImports: [ 'request' ],
  moduleSpecifier: './request',
}
export let metaData: { [key: string]: JavaMeta.FileMeta } = {};
/**
 * 所有待写入的资源文件
 * key 为 classPath
 * value 为是否已写入
 */
export let sourceClassPathMap: { [key: string]: boolean } = {};

export function initProject(servicesDir: string, jsonFile: string) {
  baseDir = servicesDir;
  metaData = fs.readJSONSync(jsonFile);
  project = new Project({
    manipulationSettings: {
      // 使用 2 个空格作为缩进
      indentationText: IndentationText.TwoSpaces
    },
  });
}

// 生成 JS DOC 作为注
export function getJsDoc(desc: JavaMeta.Description): { description: string; tags: { tagName: string, text: string }[] } {
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

// 生成文件注释
export function generatorFileComment(fileMeta: JavaMeta.FileMeta): string[] {
  const lineStr = [
    '/* tslint:disable */',
    `/* origin: ${fileMeta.class.classPath} */`,
    ' ',
  ];

  return lineStr;
}

/**
 * 返回 import 列表
 * key: classPath
 * value: typeName
 */
export function getImports(importDict: { [key: string]: string }, currentFilePath: string) {
  const importList: ImportDeclarationStructure[] = [];

  Object.keys(importDict).map(classPath => {
    if (metaData[classPath]) {
      const currentDir = path.dirname(currentFilePath);
      // 被导入的文件默认认为只会是 model
      const importFilePath = ModelGenerator.getSavePath(classPath);
      let relativePath = path.relative(currentDir, importFilePath).replace('.ts', '');

      // 特殊处理通目录的文件引用
      if (!relativePath.startsWith('../')) {
        relativePath = `./${relativePath}`;
      }

      if (importFilePath !== currentFilePath) {
        importList.push({
          kind: 2,
          namedImports: [ importDict[classPath] ],
          moduleSpecifier: relativePath,
        });
      }
    }
  });

  return importList;
}

// 返回请求类型
export function getMethodType(annotation: JavaMeta.Annotation): string {
  const methodType = {
    GetMapping: 'GET',
    PostMapping: 'POST',
    RequestMapping: 'POST',
  }

  return methodType[annotation.name] || 'POST';
}
