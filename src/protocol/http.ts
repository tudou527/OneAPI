import path from 'path';
import fs from 'fs-extra';


import ModelAdapter, { IModelMeta } from './http/model';
import ServiceAdapter, { IServiceMeta } from './http/service';
import { Swagger } from './http/swagger';

export default class HttpProtocol {
  // 文件解析数据
  fileMetaData: { [key: string]: JavaMeta.FileMeta } = {};
  // 转换结果
  serviceMeta: IServiceMeta[] = [];
  modelMeta: IModelMeta[] = [];
  /**
   * 所有待写入的资源文件
   * key 为 classPath
   * value 为是否已写入
   */
  sourceClassPathMap: { [key: string]: boolean } = {};

  constructor(file: string) {
    this.fileMetaData = fs.readJSONSync(file);

    this.convertService();
    this.convertModel();
  }

  private convertService() {
    const serviceClasssPath = Object.keys(this.fileMetaData).filter(classPath => this.fileMetaData[classPath].fileType === 'ENTRY');

    // 遍历入口
    serviceClasssPath.forEach(classPath => {
      const { serviceMeta, importDeclaration } = new ServiceAdapter(this.fileMetaData[classPath]).convert();

      this.serviceMeta.push(...serviceMeta);
      Object.keys(importDeclaration).forEach(classPath => this.sourceClassPathMap[classPath] = false);
    });
  }

  private convertModel() {
    // 过滤出未生成的资源文件并排序
    const sourceClassPathQueue = Object.keys(this.sourceClassPathMap).filter(cls => !this.sourceClassPathMap[cls]).sort((a, b) => {
      // 排序，让包含 $ 的 class 往后排，确保后续写文件时对应的父类文件已存在
      return a.indexOf('$') - b.indexOf('$');
    });

    sourceClassPathQueue.forEach(classPath => {
      const { modelMeta, importDeclaration } = new ModelAdapter(this.fileMetaData[classPath]).convert();
      // 更新解析状态
      this.sourceClassPathMap[classPath] = true;

      Object.keys(importDeclaration).forEach(classPath => {
        if (typeof this.sourceClassPathMap[classPath] ===  'undefined') {
          this.sourceClassPathMap[classPath] = false;
        }
      });

      this.modelMeta.push(modelMeta);
    });

    // 因为每次执行完后会有新的导入项，所以这里需要循环处理
    if (Object.keys(this.sourceClassPathMap).find(cls => !this.sourceClassPathMap[cls])) {
      this.convertModel();
    }
  }

  generatorSwagger() {
    const swagger = new Swagger(this.serviceMeta, this.modelMeta).convert();
    fs.writeJSONSync(path.join(__dirname, '../swagger.json'), swagger, { spaces: 2 });
  }
}
