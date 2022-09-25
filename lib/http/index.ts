import fs from 'fs-extra';

import { ServiceAdapter, ModelAdapter, IHttpAdapter } from './adapter';

export default class HttpProtocol {
  // 原始的 .json 文件
  filePath: string;
  // 结果保存目录
  saveDir: string;
  // 从文件解析得到的数据
  fileMetaData: { [key: string]: JavaMeta.FileMeta } = {};
  // 适配 http 协议数据
  adapterDataList: IHttpAdapter[] = [];
  /**
   * 所有的资源文件
   * key 为 classPath
   * value 为是否已写入
   */
  sourceClassPathMap: { [key: string]: boolean } = {};

  loopCount: number;

  constructor(args: { filePath: string; saveDir: string; }) {
    this.filePath = args.filePath;
    this.saveDir = args.saveDir;

    this.fileMetaData = fs.readJSONSync(args.filePath);

    this.loopCount = 0;

    this.convertService();
    this.convertModel();
  }

  private convertService() {
    // 遍历入口
    Object.keys(this.fileMetaData).filter(classPath => this.fileMetaData[classPath].fileType === 'ENTRY').forEach(classPath => {
      const serviceAdapter = new ServiceAdapter(this.fileMetaData[classPath]).convert();
      
      this.adapterDataList.push(serviceAdapter);

      // 缓存待解析的 import 列表
      Object.keys(serviceAdapter.importDeclaration).forEach(classPath => {
        this.sourceClassPathMap[classPath] = false;
      });
    });
  }

  private convertModel() {
    // 过滤未处理的资源文件并排序
    Object.keys(this.sourceClassPathMap).filter(cls => !this.sourceClassPathMap[cls]).sort((a, b) => {
      // 让包含 $ 的 class 往后排，确保后续写文件时对应的父类文件已存在
      return a.indexOf('$') - b.indexOf('$');
    }).forEach(classPath => {
      const modelAdapter = new ModelAdapter(classPath, this.fileMetaData).convert();
      this.adapterDataList.push(modelAdapter);
      // 更新解析状态
      this.sourceClassPathMap[modelAdapter.classPath] = true;

      Object.keys(modelAdapter.importDeclaration).forEach(classPath => {
        if (typeof this.sourceClassPathMap[classPath] ===  'undefined') {
          this.sourceClassPathMap[classPath] = false;
        }
      });
    });

    if (this.loopCount < 100 && Object.keys(this.sourceClassPathMap).find(cls => !this.sourceClassPathMap[cls])) {
      // 因为每次执行完后会有新的导入项，所以这里需要循环处理
      this.loopCount++;
      this.convertModel();
    }
  }
}
