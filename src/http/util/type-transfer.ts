/**
 * Java -> JS 类型转换同时返回需要导入的 class
 */
export default class TypeTransfer {
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
    let { name, classPath, items } = javaType;

    // sub class 的情况下要替换 name
    if (classPath && classPath.includes('$')) {
      name = classPath.split('.').at(-1).replace('$', '');
    }

    // java.util.List<?> 类似的情况
    if (!name) {
      return 'any';
    }

    // JS 与 Java 类型映射关系
    const javaTypeMap = {
      // 数字
      byte: 'number',
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

    // 泛型（长度为 1 且是大写时认为是泛型）
    if (name.length === 1 && (/^[A-Z]$/).test(name)) {
      return name;
    }

    // 命中简单规则
    if (javaTypeMap[name.toLowerCase()] && !items) {
      return javaTypeMap[name.toLowerCase()];
    }

    // 数组，Exp：java.util.List<String>
    if (classPath === 'java.util.List' || classPath === 'java.util.Collection') {
      // 数组情况下 item 节点只会有一个子节点
      return `Array<${this.convert(items.at(0))}>`;
    }

    // 日期类型
    if (classPath === 'java.util.Date') {
      return 'Date';
    }

    // Map 的各种情况
    if (
      (
        classPath?.startsWith('com.google.common') &&
        ['map', 'entry'].find(str => name.toLocaleLowerCase().includes(str))
      ) || (
        ['.Map', '.HashMap'].find(str => classPath?.endsWith(str))
      )
    ) {
      return `Map<${this.convert(items.at(0))}, ${this.convert(items.at(1))}>`;
    }

    if ([
      'javax.servlet.http.HttpServletRequest',
      'javax.servlet.http.HttpServletResponse',
    ].includes(classPath)) {
      return '{ [key: string]: any }';
    }

    if ([
      'org.springframework.web.multipart.MultipartFile',
      'java.lang.Object',
    ].includes(classPath)) {
      return 'any';
    }

    this.importDeclaration[classPath] = name;

    if (items) {
      return `${name}<${
        items.filter(item => Object.keys(item).length).map(item => this.convert(item)).join(', ')
      }>`;
    }

    return name;
  }
}
