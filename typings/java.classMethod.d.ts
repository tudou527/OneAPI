import { IJavaAnnotation } from './java.annotation';
import { IJavaActualType } from './java.actualType';
import { IJavaDescription } from './java.description';
import { IJavaClassMethodParameter } from './java.classMethodParameter';

/**
 * java 类中中的方法
 */
export interface IJavaClassMethod {
  /**
   * 方法名
   */
  name: string;

  /**
   * 注释
   */
  description: IJavaDescription;

  /**
   * 方法注解
   */
  annotations: IJavaAnnotation[];

  /**
   * 入参
   */
  parameters: IJavaClassMethodParameter[];

  /**
   * 返回值类型
   */
  return: IJavaActualType;
}
