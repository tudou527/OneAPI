/**
 * Java 注解字段
 */
export interface IJavaAnnotationField {
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
