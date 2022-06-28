import path from 'path';
import fs from 'fs-extra';

// import generatorModel from './generator/model';
// import generatorService from './generator/service';
// import { initProject } from './util/common';
// import getHttpMetaData from './protocol/http/service';
import HttpProtocol from './protocol/http';
// import generatorServiceOpenApi from './openapi/service';

(async () => {
  const servicesDir = path.join(__dirname, '../services');
  // 清空目录
  fs.emptyDirSync(servicesDir);

  // 初始化数据并保存
  // initProject(servicesDir, path.join(__dirname, '/result.json'));

  // await generatorService();
  // await generatorModel();

  // await generatorServiceOpenApi();

  // httpAdapter(path.join(__dirname, '/result.json'));

  const httpPotocol = new HttpProtocol(path.join(__dirname, '/result.json'));
  // 生成 openAPI
  httpPotocol.generatorSwagger();
})();
