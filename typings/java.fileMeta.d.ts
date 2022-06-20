import { IJavaClass } from './java.class';
import { JavaFileType } from './java.fileType';
import { IJavaDescription } from './java.description';

/**
 * Java 文件解析的元数据
 */
export interface IFileMeta {
  /**
   * 文件路径
   */
  filePath: string;

  /**
   * 资源类型
   */
  fileType: JavaFileType;

  /**
   * 包名
   */
  packageName: string;

  /**
   * 文件
   */
  description: IJavaDescription;

  /**
   * import 列表
   */
  imports: string[];

  /**
   * class 列表
   */
  classModels: IJavaClass[];
}
