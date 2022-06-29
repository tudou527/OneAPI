import path from 'path';
import fs from 'fs-extra';
import { IndentationText, Project } from 'ts-morph';

import { OpenApi } from './open-api';
import { ApiGenerator } from './api-generator';
import { ServiceAdapter, ModelAdapter, IHttpAdapter } from './adapter';

export default class HttpProtocol {
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

  constructor(file: string) {
    this.fileMetaData = fs.readJSONSync(file);

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
    const sourceClassPathQueue = Object.keys(this.sourceClassPathMap).filter(cls => !this.sourceClassPathMap[cls]).sort((a, b) => {
      // 排序，让包含 $ 的 class 往后排，确保后续写文件时对应的父类文件已存在
      return a.indexOf('$') - b.indexOf('$');
    });

    sourceClassPathQueue.forEach(classPath => {
      const modelAdapter = new ModelAdapter(this.fileMetaData[classPath]).convert();
      this.adapterDataList.push(modelAdapter);
      // 更新解析状态
      this.sourceClassPathMap[modelAdapter.classPath] = true;

      Object.keys(modelAdapter.importDeclaration).forEach(classPath => {
        if (typeof this.sourceClassPathMap[classPath] ===  'undefined') {
          this.sourceClassPathMap[classPath] = false;
        }
      });
    });

    // 因为每次执行完后会有新的导入项，所以这里需要循环处理
    if (Object.keys(this.sourceClassPathMap).find(cls => !this.sourceClassPathMap[cls])) {
      this.convertModel();
    }
  }

  // 转换为 OpenAPI 格式
  generateOpenApi() {
    const openApi = new OpenApi(this.adapterDataList).convert();
    fs.writeJSONSync(path.join(__dirname, '../openApi.json'), openApi, { spaces: 2 });
  }

  // 生成 service/interface
  async generateService() {
    const project = new Project({
      manipulationSettings: {
        // 使用 2 个空格作为缩进
        indentationText: IndentationText.TwoSpaces
      },
    });

    // 整个项目所有依赖的 classPath
    let projectImportClassPath: string[] = [];
    this.adapterDataList.map(adapter => {
      Object.keys(adapter.importDeclaration).forEach(classPath => {
        if (!projectImportClassPath.includes(classPath)) {
          projectImportClassPath.push(classPath);
        }
      });
    });

    for (let adapter of this.adapterDataList) {
      const apiGenerator = new ApiGenerator(path.join(__dirname, '../../services'), project, adapter);
      await apiGenerator.generate(projectImportClassPath);
    }
  }
}
