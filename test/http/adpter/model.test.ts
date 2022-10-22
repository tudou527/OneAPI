import path from 'path';
import fs from 'fs-extra';
import sinon from 'sinon';
import { expect } from 'chai';

import * as util from '../../../src/http/adapter/index';
import ModelAdapter from '../../../src/http/adapter/model';
import { IAdapterField } from '../../../src/http/adapter/index';

describe('lib/http/adapter/model', () => {
  let fileMetaData = {};

  beforeEach(() => {
    sinon.stub(util, 'getJsDoc').resolves({ description: '', });
    fileMetaData = fs.readJSONSync(path.join(__dirname, '../../fixtures/oneapi-origin.json'));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('normal', () => {
    const { description, ...attrs } = new ModelAdapter('com.macro.mall.dto.PmsProductAttributeCategoryItem', fileMetaData).convert();
    // 不断言 description
    expect(!description).to.equal(false);

    expect(attrs.className).to.equal('PmsProductAttributeCategoryItem');
    expect(attrs.classPath).to.equal('com.macro.mall.dto.PmsProductAttributeCategoryItem');

    expect(attrs.actualType).to.deep.equal(undefined);
    expect(attrs.fileType).to.equal('RESOURCE');

    // 需要引入的导入项
    expect(attrs.importDeclaration).to.deep.equal({
      'com.macro.mall.model.PmsProductAttribute': 'PmsProductAttribute',
      'com.macro.mall.model.PmsProductAttributeCategory': 'PmsProductAttributeCategory'
    });

    // 字段及类型
    expect(attrs.fields).to.have.lengthOf(1);

    const { description: fieldDesc, ...fileAttrs } = attrs.fields!.at(0) as unknown as IAdapterField;

    expect(!fieldDesc).to.equal(false);
    expect(fileAttrs).to.deep.equal({
      name: 'productAttributeList',
      type: {
        name: 'List',
        classPath: 'java.util.List',
        items: [
          {
            name: 'PmsProductAttribute',
            classPath: 'com.macro.mall.model.PmsProductAttribute'
          }
        ]
      },
      jsType: 'Array<PmsProductAttribute>',
    });

    // 父类
    expect(attrs.superClass).to.deep.equal({
      type: {
        name: 'PmsProductAttributeCategory',
        classPath: 'com.macro.mall.model.PmsProductAttributeCategory'
      },
      jsType: 'PmsProductAttributeCategory',
      items: [],
    });
  });

  it('file meta is null', () => {
    const adapter = new ModelAdapter('com.demo', fileMetaData).convert();
    const { description, ...attrs } = adapter;

    expect(attrs).to.deep.equal({
      filePath: undefined,
      className: 'demo',
      classPath: 'com.demo',
      actualType: undefined,
      fileType: undefined,
      fields: [],
      importDeclaration: {}
    });
  });

  it('generic super class', () => {
    const adapter = new ModelAdapter('com.macro.mall.portal.domain.OmsOrderDetail', fileMetaData).convert();
    const superClass = adapter.superClass!
    const { type, jsType, items } = superClass;

    expect(type).to.deep.equal({
      name: 'CommonResult',
      classPath: 'com.macro.mall.common.api.CommonResult',
      items: [{
        name: 'OmsOrderQueryParam',
        classPath: 'com.macro.mall.dto.OmsOrderQueryParam'
      }],
    });
    expect(jsType).to.equal('CommonResult<OmsOrderQueryParam>');
    expect(items).to.deep.equal([
      {
        type: {
          name: 'OmsOrderQueryParam',
          classPath: 'com.macro.mall.dto.OmsOrderQueryParam'
        },
        jsType: 'OmsOrderQueryParam'
      },
    ]);
  });
});
