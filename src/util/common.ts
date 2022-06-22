import fs from 'fs-extra';
import { IndentationText, Project } from "ts-morph";

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

// 把 Java 类型转换为 JS 类型
export function convertJavaTypeToJS(javaType: JavaMeta.ActualType): string {
  const { name, classPath, items } = javaType;
  // JS 与 Java 类型映射关系
  const javaTypeMap = {
    // 数字
    integer: 'number',
    int: 'number',
    long: 'number',
    double: 'number',
    float: 'number',
    short: 'number',
    bigdecimal: 'number',
    biginteger: 'number',
    // 字符串
    character: 'string',
    char: 'string',
    string: 'string',
    // 布尔
    boolean: 'boolean',
    void: 'void',
  }

  if (javaTypeMap[name.toLowerCase()]) {
    return javaTypeMap[name.toLowerCase()];
  }

  // 泛型（长度为 1 且是大写时认为是泛型）
  if (name.length === 1 && (/^[A-Z]$/).test(name)) {
    return name;
  }

  // 数组，Exp：java.util.List<String>
  if (classPath === 'java.util.List' || classPath === 'java.util.Collection') {
    // 数组情况下 item 节点只会有一个子节点
    return `Array<${convertJavaTypeToJS(items.at(0))}>`;
  }

  if (items) {
    return `${name}<${items.map(item => convertJavaTypeToJS(item)).join(', ')}>`;
  }

  if (!metaData[classPath]) {
    console.error('>>>>>>>>>>>>> class: %s , name: %s not found.', classPath, name);
  }

  return name;
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
