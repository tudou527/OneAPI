import { IJavaAnnotationField } from './java.annotationField';

/**
 * Java 注解
 */
export interface IJavaAnnotation {
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
  fields: IJavaAnnotationField[];
}
