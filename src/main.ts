import path from 'path';
import fs from 'fs-extra';

import { initProject } from './util/common';
import generatorService from './generator/service';
import generatorModel from './generator/model';

(async () => {
  const servicesDir = path.join(__dirname, '../services');

  // 清空目录
  fs.emptyDirSync(servicesDir);

  // 初始化数据并保存
  initProject(servicesDir, path.join(__dirname, '/result.json'));

  Promise.all([
    generatorService(),
    generatorModel(),
  ]).then(() => {
    console.log('>>>>> done: ', );
  });
})();
