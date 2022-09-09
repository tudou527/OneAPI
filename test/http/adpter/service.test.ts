import path from 'path';
import fs from 'fs-extra';
import sinon from 'sinon';

import ServiceAdapter from '../../../lib/http/adapter/service';
import { expect } from 'chai';

describe.only('lib/http/adapter/service', () => {
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

    const { url, type, contentType, description: serviceDesc, parameter, response, classPath: serviceClassPath, operationId } = services[0];
    expect(url).to.equal('/prefrenceArea/listAll');
    expect(type).to.equal('GET');
    expect(contentType).to.equal('application/json');
    expect(serviceDesc).to.equal(null);
    expect(parameter).to.deep.equal([]);
    expect(serviceClassPath).to.equal('com.macro.mall.controller.CmsPrefrenceAreaController');
    expect(operationId).to.equal('listAll');

    expect(response).to.deep.equal({
      jsType: 'CommonResult<Array<CmsPrefrenceArea>>',
      type: {
        name: 'CommonResult',
        classPath: 'com.macro.mall.common.api.CommonResult',
        items: [
          {
            name: 'List',
            classPath: 'java.util.List',
            items: [
              {
                name: 'CmsPrefrenceArea',
                classPath: 'com.macro.mall.model.CmsPrefrenceArea'
              }
            ]
          }
        ]
      }
    });
  });
});
