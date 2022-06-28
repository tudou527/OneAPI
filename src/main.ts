import path from 'path';
import fs from 'fs-extra';

import generatorModel from './generator/model';
import generatorService from './generator/service';
import { initProject } from './util/common';

(async () => {
  const servicesDir = path.join(__dirname, '../services');

  // 清空目录
  fs.emptyDirSync(servicesDir);

  // 初始化数据并保存
  initProject(servicesDir, path.join(__dirname, '/result.json'));

  await generatorService();
  await generatorModel();

  console.log('========', );
})();
