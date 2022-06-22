import path from 'path';
import fs from 'fs-extra';
import { ImportDeclarationStructure, IndentationText, Project } from "ts-morph";
import { ModelGenerator } from '../generator/model';

export let baseDir: string;
export let project: Project;
export let metaData: { [key: string]: JavaMeta.FileMeta } = {};

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
export function getJsDoc(desc: JavaMeta.Description) {
  if (!desc.text && !Object.keys(desc.tag).length) {
    return null;
  }

  const tags = [];
  Object.keys(desc.tag).map(tag => {
    desc.tag[tag].forEach(str => {
      tags.push({
        tagName: tag,
        text: str,
      });
    });
  });

  return {
    description: desc.text || '',
    tags,
  }
}

// 生成文件注释
export function generatorFileComment(desc: JavaMeta.Description): string[] {
  const { text, tag } = desc;

  if (!text && !Object.keys(tag).length) {
    return [];
  }

  const lineStr = ['/**'];

  if (desc?.text) {
    lineStr.push(` * ${desc?.text}`);
  }

  Object.keys(desc?.tag).forEach(k => {
    desc?.tag[k].forEach(str => {
      lineStr.push(` * @${k} ${str}`);
    });
  });
  lineStr.push(` */`);

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
