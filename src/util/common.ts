import { JSDocStructure, OptionalKind } from "ts-morph";

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

// 返回请求类型
export function getMethodType(annotation: JavaMeta.Annotation): string {
  const methodType = {
    GetMapping: 'GET',
    PostMapping: 'POST',
    RequestMapping: 'POST',
  }

  return methodType[annotation.name] || 'POST';
}
