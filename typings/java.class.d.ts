import { IJavaAnnotation } from './java.annotation';
import { IJavaActualType } from './java.actualType';
import { IJavaDescription } from './java.description';
import { IJavaClassField } from './java.classField';
import { IJavaClassMethod } from './java.classMethod';

/**
 * java 类
 */
export interface IJavaClass {
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
  actualType: IJavaActualType[];

  /**
   * 注释
   */
  description: IJavaDescription;

  /**
   * 注解
   */
  annotations: IJavaAnnotation[];

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
  superClass: IJavaActualType;

  /**
   * 属性
   */
  fields: IJavaClassField[];

  /**
   * 方法
   */
  methods: IJavaClassMethod[];
}
