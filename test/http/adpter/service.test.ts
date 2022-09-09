import path from 'path';
import fs from 'fs-extra';
import sinon from 'sinon';

import ServiceAdapter from '../../../lib/http/adapter/service';
import { expect } from 'chai';

describe('lib/http/adapter/service', () => {
  const fileMetaData = fs.readJSONSync(path.join(__dirname, '../../fixture/oneapi.json'));

  afterEach(() => {
    sinon.restore();
  });

  it('normal', () => {
    const adapter = new ServiceAdapter(fileMetaData['com.macro.mall.controller.CmsPrefrenceAreaController']).convert();

    const { description, className, classPath, fileType, services, importDeclaration } = adapter;

    expect(description.description).to.include('商品优选管理');

    expect(className).to.equal('CmsPrefrenceAreaController');
    expect(classPath).to.equal('com.macro.mall.controller.CmsPrefrenceAreaController');

    expect(fileType).to.equal('ENTRY');
    expect(importDeclaration).to.deep.equal({
      'com.macro.mall.common.api.CommonResult': 'CommonResult',
      'com.macro.mall.model.CmsPrefrenceArea': 'CmsPrefrenceArea'
    });

    expect(services).to.has.lengthOf(1);

    console.log('>>>>> adapter: ', services);
  });
});
