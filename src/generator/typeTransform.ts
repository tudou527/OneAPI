
/**
 * Java -> JS 类型转换
 */
export class TypeTransform {
  /**
   * 参数及返回值中依赖的 classPath 导入列表
   * key: classPath
   * value: typeName
   */
  importDeclaration: { [key: string]: string } = {};

  transform(javaType: JavaMeta.ActualType): { jsType: string, imports: { [key: string]: string } } {
    return {
      jsType: this.convert(javaType),
      imports: this.importDeclaration,
    }
  }

  // 把 Java 类型转换为 JS 类型
  private convert(javaType: JavaMeta.ActualType): string {
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

    // 命中简单规则
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
      return `Array<${this.convert(items.at(0))}>`;
    }

    if ([
      'javax.servlet.http.HttpServletRequest',
      'javax.servlet.http.HttpServletResponse',
    ].includes(classPath)) {
      return '{ [key: string]: any }';
    }

    if ([
      'org.springframework.web.multipart.MultipartFile',
    ].includes(classPath)) {
      return 'any';
    }

    this.importDeclaration[classPath] = name;

    if (items) {
      return `${name}<${
        items.filter(item => Object.keys(item).length).map(item => this.convert(item)).join(', ')
      }>`;
    }

    // if (!metaData[classPath]) {
    //   console.error('>>>> name: %s , class: %s not found.', name, classPath);
    // }

    return name;
  }
}
