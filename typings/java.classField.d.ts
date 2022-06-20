import { IJavaAnnotation } from './java.annotation';
import { IJavaActualType } from './java.actualType';
import { IJavaDescription } from './java.description';

/**
 * java 类中的字段
 */
export interface IJavaClassField {
  /**
   * 字段名称
   */
  name: string;

  /**
   * 字段类型
   */
  type: IJavaActualType;

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
  description: IJavaDescription;

  /**
   * 字段注解
   */
  annotation: IJavaAnnotation[];
}
