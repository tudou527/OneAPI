declare namespace JavaMeta {
  /**
   * Java 类型
   */
  interface ActualType {
    /**
     * 类型字面量
     */
    name: string;

    /**
     * class 路径，Exp: a.b.c.d
     */
    classPath: string;

    /**
     * 子类型
     */
    items?: ActualType[];
  }

  /**
   * Java 描述信息
   */
  interface Description {
    /**
     * 注释内容
     */
    text: string;

    /**
     * 注释中的 tag 信息，Exp: @Description 后端
     * 考虑回存在 @param 标签会存在多个，所以 tag 后的值为数组，Exp:
     * \@param deptNo    部门编号
     * \@param layer     组织层级,可选
     * \@param subDept   下属组织,可选,如果有值则展现 subDept 为根的图谱
     * 对应的存储格式为：
     * {
     *     param: [
     *      "deptNo    部门编号",
     *      "layer     组织层级,可选",
     *      "subDept   下属组织,可选,如果有值则展现 subDept 为根的图谱"
     *     ]
     * }
     */
    tag: {
      [key: string]: string[];
    }
  }

  /**
   * Java 注解字段
   */
  interface AnnotationField {
    /**
     * 字段名称
     */
    name: string;

    /**
     * 字段类型
     * 考虑到 java 为强类型，不可能出现字段值为数组但每个数组项目类型都不同的情况
     * 这里认为属性每个值的类型都一样
     */
    type: string;

    /**
     * 属性值是否为数组
     */
    isArray: boolean;

    /**
     * 字段值
     */
    value: any;
  }

  /**
   * Java 注解
   */
  interface Annotation {
    /**
     * 注解名
     */
    name: string;

    /**
     * 注解 class
     */
    classPath: string;

    /**
     * 注解字段
     */
    fields: AnnotationField[];
  }

  /**
   * java 类中的方法参数
   */
  interface ClassMethodParameter {
    /**
     * 参数名称
     */
    name: string;

    /**
     * 参数类型
     */
    type: ActualType;

    /**
     * 注释
     */
    description: Description;

    /**
     * 参数注解
     */
    annotations: Annotation[];
  }

  /**
   * java 类中的字段
   */
  interface ClassField {
    /**
     * 字段名称
     */
    name: string;

    /**
     * 字段类型
     */
    type: ActualType;

    /**
     * 字段默认值
     */
    defaultValue: string;

    /**
     * 是否 private 字段
     */
    isPrivate: boolean;

    /**
     * 是否 public 字段
     */
    isPublic: boolean;

    /**
     * 是否 protected
     */
    isProtected: boolean;

    /**
     * 注释
     */
    description: Description;

    /**
     * 字段注解
     */
    annotations: Annotation[];
  }

  /**
   * java 类中中的方法
   */
  interface ClassMethod {
    /**
     * 方法名
     */
    name: string;

    /**
     * 注释
     */
    description: Description;

    /**
     * 方法注解
     */
    annotations: Annotation[];

    /**
     * 入参
     */
    parameters: ClassMethodParameter[];

    /**
     * 返回值类型
     */
    return: ActualType;
  }

  /**
   * java 类
   */
  interface JavaClass {
    /**
     * 类名
     */
    name: string;

    /**
     * class 路径 a.b.c.d
     */
    classPath: string;

    /**
     * 联合类型，Exp： class PageResult<T> {}
     */
    actualType: ActualType[];

    /**
     * 注释
     */
    description: Description;

    /**
     * 注解
     */
    annotations: Annotation[];

    /**
     * 是否枚举
     */
    isEnum: boolean;

    /**
     * 是否 interface
     */
    isInterface: boolean;

    /**
     * 是否抽象类
     */
    isAbstract: boolean;

    /**
     * 是否 private class
     */
    isPrivate: boolean;

    /**
     * 是否 private class
     */
    isPublic: boolean;

    /**
     * 父类
     */
    superClass: ActualType;

    /**
     * 属性
     */
    fields: ClassField[];

    /**
     * 方法
     */
    methods: ClassMethod[];
  }

  /**
   * Java 文件解析的元数据
   */
  interface FileMeta {
    /**
     * 文件路径
     */
    filePath: string;

    /**
     * 解析的 Java 文件 类型
     * RESOURCE：只会解析 public class 字段
     * ENTRY：只会解析 public class 字段及所有 public 方法出/入参
     */
    fileType: 'RESOURCE' | 'ENTRY';

    /**
     * 包名
     */
    packageName: string;

    /**
     * 描述
     */
    description: Description;

    /**
     * import 列表
     */
    imports: string[];

    /**
     * class 列表
     */
    class: JavaClass;
  }
}
