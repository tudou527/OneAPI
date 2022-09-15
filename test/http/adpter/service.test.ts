import path from 'path';
import fs from 'fs-extra';
import { expect } from 'chai';

import ServiceAdapter from '../../../lib/http/adapter/service';

describe('lib/http/adapter/service', () => {
  let fileMetaData = {};

  beforeEach(() => {
    fileMetaData = fs.readJSONSync(path.join(__dirname, '../../fixture/oneapi.json'));
  });

  it('normal', () => {
    const key = 'com.macro.mall.controller.OmsOrderController';
    const { description, ...attrs } = new ServiceAdapter(fileMetaData[key]).convert();

    expect(!description).to.equal(false);

    expect(attrs.fileType).to.equal('ENTRY');
    expect(attrs.className).to.equal('OmsOrderController');
    expect(attrs.classPath).to.equal(key);
    expect(attrs.importDeclaration).to.deep.equal({
      'com.macro.mall.dto.OmsOrderQueryParam': 'OmsOrderQueryParam',
      'com.macro.mall.common.api.CommonResult': 'CommonResult',
      'com.macro.mall.common.api.CommonPage': 'CommonPage',
      'com.macro.mall.model.OmsOrder': 'OmsOrder',
      'com.macro.mall.dto.OmsOrderDetail': 'OmsOrderDetail'
    });

    expect(attrs.services.length > 1).to.equal(true);

    const listService = attrs.services.find((se: any) => se.operationId === 'list');
    expect(!listService).to.equal(false);

    const { description: listDesc, ...listAttrs } = listService;

    expect(!listDesc).to.equal(false);

    // 路由前缀
    expect(listAttrs.url).to.equal('/order/list');
    // 请求类型
    expect(listAttrs.type).to.equal('GET');
    expect(listAttrs.operationId).to.equal('list');
    expect(listAttrs.classPath).to.equal(key);
    expect(listAttrs.contentType).to.equal('application/json');

    // 入参及返回值
    expect(listAttrs.parameter).to.deep.equal([
      {
        name: 'queryParam',
        isRequired: false,
        isPathVariable: false,
        type: {
          name: 'OmsOrderQueryParam',
          classPath: 'com.macro.mall.dto.OmsOrderQueryParam'
        },
        jsType: 'OmsOrderQueryParam'
      },
      {
        // 使用 annotation 中的字段别名
        name: 'pageSize',
        isRequired: false,
        isPathVariable: false,
        type: {
          name: 'Integer',
          classPath: 'java.lang.Integer',
        },
        jsType: 'number'
      },
      {
        name: 'pageNum',
        isRequired: true,
        isPathVariable: false,
        type: {
          name: 'Integer', 
          classPath: 'java.lang.Integer',
        },
        jsType: 'number'
      }
    ]);
    expect(listAttrs.response).to.deep.equal({
      jsType: 'CommonResult<CommonPage<OmsOrder>>',
      type: {
        name: 'CommonResult',
        classPath: 'com.macro.mall.common.api.CommonResult',
        items: [
          {
            name: 'CommonPage',
            classPath: 'com.macro.mall.common.api.CommonPage',
            items: [
              {
                name: 'OmsOrder',
                classPath: 'com.macro.mall.model.OmsOrder'
              }
            ]
          }
        ]
      }
    });
  });

  describe('method type', () => {
    it('default method type', () => {
      const meta = fileMetaData['com.macro.mall.controller.OmsOrderController'];
  
      const { services } = new ServiceAdapter(meta).convert();
      const closeService = services.find((se: any) => se.operationId === 'close');
      
      // methodType 应该都是 POST
      expect(closeService.type).to.equal('POST');
    });

    it('DeleteMapping should return post', () => {
      const meta = fileMetaData['com.macro.mall.controller.OmsOrderController'];
  
      const { services } = new ServiceAdapter(meta).convert();
      const deleteService = services.find((se: any) => se.operationId === 'delete');
      // methodType 应该都是 POST
      expect(deleteService.type).to.equal('POST');
    });
  });

  describe('method basic info', () => {
    it('no base uri', () => {
      const meta = fileMetaData['com.test.demo.noBaseURIController'];

      const { services } = new ServiceAdapter(meta).convert();

      expect(services[0].url).to.equal('/api/test');
    });

    it('class getMapping annotation without fields', () => {
      const meta = fileMetaData['com.macro.mall.controller.OmsOrderController'];
      meta.class.annotations = [
        {
          name: 'getMapping',
        },
      ];

      const { services } = new ServiceAdapter(meta).convert();

      expect(services[0].url).to.equal('/list');
    });

    it('method getMapping annotation without fields', () => {
      const meta = fileMetaData['com.macro.mall.controller.OmsOrderController'];
      meta.class.methods[0].annotations = meta.class.methods[0].annotations.map((an: any) => {
        if (an.name === 'RequestMapping') {
          delete an.fields;
        }
        return an;
      });

      const { services } = new ServiceAdapter(meta).convert();
      expect(services.at(0).url).to.equal('/order');
    });

    it('use method annotation field info if exist', () => {
      const fileMeta = fileMetaData['com.macro.mall.controller.OmsOrderController'];
      fileMeta.class.methods[0].parameters = fileMeta.class.methods[0].parameters.map((p: any) => {
        p.annotations = p.annotations.map((an: any) => {
          an.fields = an.fields.filter((f: any) => f.name !== 'required');
          return an;
        });
        return p;
      });

      const { services } = new ServiceAdapter(fileMeta).convert();
      const listServices = services.at(0);

      expect(listServices.parameter.find(p => p.name === 'pageNum')?.isRequired).to.equal(false);
    });

    it('form-data content type', () => {
      const meta = fileMetaData['com.macro.mall.controller.OmsOrderController'];

      const { services } = new ServiceAdapter(meta).convert();
      const uploadService = services.find((se: any) => se.operationId === 'upload');
      // 请求类型一定是 post
      expect(uploadService.type).to.equal('POST');
      expect(uploadService.contentType).to.equal('multipart/form-data');
    });
  });
});
