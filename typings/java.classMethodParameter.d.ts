import { IJavaActualType } from './java.actualType';
import { IJavaDescription } from './java.description';
import { IJavaAnnotation } from './java.annotation';

/**
 * java 类中的方法参数
 */
export interface IJavaClassMethodParameter {
  /**
   * 参数名称
   */
  name: string;

  /**
   * 参数类型
   */
  type: IJavaActualType;

  /**
   * 注释
   */
  description: IJavaDescription;

  /**
   * 参数注解
   */
  annotations: IJavaAnnotation[];
}
