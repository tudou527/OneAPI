import path from 'path';
import sinon from 'sinon';
import { expect } from 'chai';
import HttpProtocol from '../../../lib/http';
import { OpenApi } from '../../../lib/http/output/openapi';

describe('lib/http/output/openapi', () => {
  let httpPotocol: HttpProtocol = null;
  // 整个项目所有依赖的 classPath
  let projectImportClassPath: string[] = [];

  beforeEach(() => {
    httpPotocol = new HttpProtocol({
      filePath: path.join(__dirname, '../../fixture/oneapi.json'),
      saveDir: path.join(__dirname, '../../fixture'),
    });

    // 整个项目所有依赖的 classPath
    httpPotocol.adapterDataList.map(adapter => {
      Object.keys(adapter.importDeclaration).forEach(classPath => {
        if (!projectImportClassPath.includes(classPath)) {
          projectImportClassPath.push(classPath);
        }
      });
    });
  });

  afterEach(() => {
    httpPotocol = null;

    sinon.restore();
  });

  it('normal', () => {
    const result = new OpenApi({
      httpAdapter: httpPotocol.adapterDataList,
    }).convert();

    expect(result.openapi).to.be.equal('3.0.0');
    expect(result.paths).to.not.equal(null);
    expect(result.components).to.not.equal(null);
  });

  describe('addPath', () => {
    it('normal', () => {
      const result = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      const orderList = result.paths['/order/list'];
      const { tags, operationId, summary, description, parameters, responses } = orderList.get;
      
      expect(orderList).to.not.equal(null);
      expect(orderList.get).to.not.equal(null);

      expect(tags).to.not.equal(['OmsOrderController']);
      expect(operationId).to.be.equal('list');
      expect(summary).to.be.equal('查询订单');
      expect(description).to.be.equal('查询订单');

      expect(parameters).to.not.equal([
        {
          name: 'queryParam',
          in: 'query',
          description: '',
          required: false,
          schema: {
            '$ref': '#/components/schemas/OmsOrderQueryParam',
          }
        },
        {
          name: 'pageSize',
          in: 'query',
          description: '',
          required: false,
          schema: { type: 'number' }
        },
        {
          name: 'pageNum',
          in: 'query',
          description: '',
          required: true,
          schema: { type: 'number' }
        }
      ]);

      const { description: resDesc, content } = responses['200'];
      expect(resDesc).to.be.equal('');
      expect(content['application/json'].schema.$ref).to.be.equal('#/components/schemas/CommonResult<CommonPage<OmsOrder>>');
    });

    it('path variable', () => {
      httpPotocol.adapterDataList.forEach(adapter => {
        adapter.services?.forEach((service) => {
          if (service.url === '/order/{id}') {
            service.type = 'POST';
          }
        });
      });

      const { paths } = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      const orderDetail = paths['/order/{id}'];
      const { parameters } = orderDetail.post;
      expect(parameters).to.deep.equal([
        {
          name: 'id',
          in: 'path',
          description: '',
          required: true,
          type: 'number',
        },
      ]);
    });

    it('empty services', () => {
      httpPotocol.adapterDataList.forEach((adapter) => {
        delete adapter.services;
      });

      const result = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();
      
      expect(result.paths).to.not.equal({});
    });

    it('description is null', () => {
      httpPotocol.adapterDataList.forEach((adapter) => {
        adapter.services?.forEach(service => {
          delete service.description;
        });
      });

      const result = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      expect(Object.keys(result.paths).length > 1).to.be.equal(true);
      Object.keys(result.paths).forEach(path => {
        Object.keys(result.paths[path]).forEach(method => {
          const { summary, description } = result.paths[path][method];
          expect(summary).to.be.equal('');
          expect(description).to.be.equal('');
        });
      });
    });
  });

  describe('addComponents', () => {
    it('normal', () => {
      const { components: { schemas } } = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      const { type, properties } = schemas['OmsOrderQueryParam'];
      expect(type).to.be.equal('object');
      expect(properties).to.deep.equal({
        orderSn: {
          description: '订单编号',
          type: 'string',
        },
        receiverKeyword: {
          description: '收货人姓名/号码',
          type: 'string',
        },
        status: {
          description: '订单状态：0->待付款；1->待发货；2->已发货；3->已完成；4->已关闭；5->无效订单',
          type: 'number',
        },
        orderType: {
          description: '订单类型：0->正常订单；1->秒杀订单',
          type: 'number',
        },
        sourceType: {
          description: '订单来源：0->PC订单；1->app订单',
          type: 'number',
        },
        createTime: {
          description: '订单提交时间',
          type: 'string',
        },
        order: {
          description: undefined,
          '$ref': '#/components/schemas/OmsOrder',
        },
        calcAmount: {
          description: undefined,
          '$ref': '#/components/schemas/CalcAmount',
        }
      });
    });

    it('basic generic type', () => {
      const { components: { schemas } } = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      const { type, properties } = schemas['CommonPage'];
      expect(type).to.be.equal('object');
      expect(properties).to.deep.equal({
        pageNum: {
          description: '当前页码',
          type: 'number'
        },
        pageSize: {
          description: '每页数量',
          type: 'number'
        },
        totalPage: {
          description: '总页数',
          type: 'number'
        },
        total: {
          description: '总条数',
          type: 'number'
        },
        list: {
          description: '分页数据',
          type: 'array',
          items: {
            type: 'object'
          },
        },
      });
    });

    it('union generic type', () => {
      const { components: { schemas } } = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();
      
      const { type, properties } = schemas['CommonResult<OmsOrderDetail>'];
      expect(type).to.be.equal('object');
      expect(properties).to.be.deep.equal({
        code: {
          type: 'number',
        },
        message: {
          type: 'string',
        },
        data: {
          '$ref': '#/components/schemas/OmsOrderDetail',
        },
      });
    });

    it('description is null', () => {
      httpPotocol.adapterDataList.forEach((adapter) => {
        adapter.fields?.forEach(f => delete f.description);
      });

      const { components: { schemas } } = new OpenApi({
        httpAdapter: httpPotocol.adapterDataList,
      }).convert();

      Object.keys(schemas).forEach(name => {
        Object.keys(schemas[name].properties).forEach((field: string) => {
          expect(!schemas[name].properties[field].description).to.be.equal(true);
        });
      });
    });
  });
});