import path from 'path';
import fs from 'fs-extra';
import sinon from 'sinon';
import { expect } from 'chai';

import ModelAdapter from '../../../lib/http/adapter/model';

describe('lib/http/adapter/model', () => {
  const fileMetaData = fs.readJSONSync(path.join(__dirname, '../../fixture/oneapi.json'));

  afterEach(() => {
    sinon.restore();
  });

  it('normal', () => {
    const adapter = new ModelAdapter('com.macro.mall.dto.PmsProductAttributeCategoryItem', fileMetaData).convert();

    expect(adapter.description.tags).to.deep.equal([]);
    expect(adapter.description.description).to.include('带有属性的商品属性分类');

    expect(adapter.className).to.equal('PmsProductAttributeCategoryItem');
    expect(adapter.classPath).to.equal('com.macro.mall.dto.PmsProductAttributeCategoryItem');

    expect(adapter.actualType).to.deep.equal(undefined);
    expect(adapter.fileType).to.equal('RESOURCE');

    // 需要引入的导入项
    expect(adapter.importDeclaration).to.deep.equal({
      'com.macro.mall.model.PmsProductAttribute': 'PmsProductAttribute',
      'com.macro.mall.model.PmsProductAttributeCategory': 'PmsProductAttributeCategory'
    });

    // 字段及类型
    expect(adapter.fields).to.have.lengthOf(1);
    expect(adapter.fields[0]).to.deep.equal({
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
      description: null,
    });

    // 父类
    expect(adapter.superClass).to.deep.equal({
      type: {
        name: 'PmsProductAttributeCategory',
        classPath: 'com.macro.mall.model.PmsProductAttributeCategory'
      },
      jsType: 'PmsProductAttributeCategory',
      items: [],
    });
  });

  it('generic super class', () => {
    const adapter = new ModelAdapter('com.macro.mall.portal.domain.OmsOrderDetail', fileMetaData).convert();

    const { superClass: { type, jsType, items } } = adapter;

    expect(type).to.deep.equal({
      name: 'CommonResult',
      classPath: 'com.macro.mall.common.api.CommonResult',
      items: [{
        name: 'ConfirmOrderResult',
        classPath: 'com.macro.mall.portal.domain.ConfirmOrderResult'
      }],
    });
    expect(jsType).to.equal('CommonResult<ConfirmOrderResult>');
    expect(items).to.deep.equal([
      {
        type: {
          name: 'ConfirmOrderResult',
          classPath: 'com.macro.mall.portal.domain.ConfirmOrderResult'
        },
        jsType: 'ConfirmOrderResult'
      },
    ]);
  });
});
