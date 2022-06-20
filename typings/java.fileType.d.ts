/**
 * 解析的 Java 文件 类型
 * 资源与入口文件的差异是资源只会解析字段
 * 入口会解析方法及出/入参
 */
export enum JavaFileType {
  /**
   * 资源
   */
  RESOURCE,

  /**
   * 入口
   */
  ENTRY,
}
