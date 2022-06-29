import path from 'path';
import fs from 'fs-extra';

import HttpProtocol from './http-protocol/index';

(async () => {
  const servicesDir = path.join(__dirname, '../services');
  // 清空目录
  fs.emptyDirSync(servicesDir);

  const httpPotocol = new HttpProtocol(path.join(__dirname, '/result.json'));
  // 生成 OpenAPI
  httpPotocol.generateOpenApi();
  // 生成 service/interface
  await httpPotocol.generateService();
})();
