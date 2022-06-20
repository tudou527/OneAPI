/**
 * Java 类型
 */
export interface IJavaActualType {
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
  items: IJavaActualType[];
}
