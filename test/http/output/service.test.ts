import { expect } from 'chai';
import path from 'path';
import sinon from 'sinon';
import { IndentationText, Project } from 'ts-morph';

import HttpProtocol from '../../../lib/http';
import { ServiceGenerator } from '../../../lib/http/output/service';

describe('lib/http/output/service', () => {
  let project: Project = null;
  let httpPotocol: HttpProtocol = null;
  // 整个项目所有依赖的 classPath
  let projectImportClassPath: string[] = [];

  beforeEach(() => {
    project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces
      },
    });

    httpPotocol = new HttpProtocol({
      filePath: path.join(__dirname, '../../fixture/oneapi.json'),
      projectDir: path.join(__dirname, '../../fixture'),
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
    sinon.restore();

    project = null;
    httpPotocol = null;
  });

  describe('service', () => {
    it('normal', (done) => {
      let fakeArgs: any = [];
      const adapter = httpPotocol.adapterDataList.find(adapter => adapter.className === 'OmsOrderController');
      // 只保留一个方法方便断言
      adapter.services = adapter.services.splice(0, 1);

      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../services'), project, adapter);
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      apiGenerator.generate(projectImportClassPath);
      expect(fakeArgs).to.deep.equal([]);

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => ({
        name: im.getNamedImports().at(0).getName(),
        moduleSpecifier: im.getModuleSpecifier().getText(),
      }));
      expect(importDeclarations).to.deep.equal([
        { name: 'OmsOrderQueryParam', moduleSpecifier: '"./model/dto/OmsOrderQueryParam"'},
        { name: 'CommonResult', moduleSpecifier: '"./model/api/CommonResult"' },
        { name: 'CommonPage', moduleSpecifier: '"./model/api/CommonPage"' },
        { name: 'OmsOrder', moduleSpecifier: '"./model/model/OmsOrder"' },
        { name: 'OmsOrderDetail', moduleSpecifier: '"./model/dto/OmsOrderDetail"'}
      ]);

      // method
      const methodDeclarations = apiGenerator.sourceFile.getFunctions().at(0);

      // 入参
      const params = methodDeclarations.getParameters().map((param) => ({
        name: param.getName(),
        type: param.getType().getText(),
      }));
      expect(params).to.deep.equal([
        {
          name: 'args',
          type: '{ queryParam?: OmsOrderQueryParam; pageSize?: number; pageNum: number; }'
        }
      ]);

      // 返回值类型
      const returnText = methodDeclarations.getReturnType().getText();
      expect(returnText).to.equal('Promise<CommonResult<CommonPage<OmsOrder>>>');

      // 方法体
      const methodBody = methodDeclarations.getBodyText();
      expect(methodBody.includes(`method: 'GET',`)).to.equal(true);
      expect(methodBody.includes(`url: '/order/list'`)).to.equal(true);

      expect(methodBody.includes(`queryParam: args.queryParam,`)).to.equal(true);
      expect(methodBody.includes(`pageSize: args.pageSize,`)).to.equal(true);
      expect(methodBody.includes(`pageNum: args.pageNum,`)).to.equal(true);
      
      expect(methodBody.includes(`'Content-Type': 'application/json',`)).to.equal(true);

      done();
    });

    it('post request', () => {
    });
  });

  describe('model', () => {
    it('normal', () => {
      let fakeArgs: any = [];
      const adapter = httpPotocol.adapterDataList.find(adapter => adapter.className === 'OmsOrderQueryParam');

      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../services'), project, adapter);
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      apiGenerator.generate(projectImportClassPath);
      expect(fakeArgs).to.deep.equal([]);

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => ({
        name: im.getNamedImports().at(0).getName(),
        moduleSpecifier: im.getModuleSpecifier().getText(),
      }));
      expect(importDeclarations).to.deep.equal([
        { name: 'OmsOrder', moduleSpecifier: '"../model/OmsOrder"' },
      ]);

      // interface 
      const orderFields = apiGenerator.sourceFile.getInterfaces().at(0).getProperties().map((property) => {
        return {
          name: property.getName(),
          type: property.getType().getText(),
          descText: property.getJsDocs().map(doc => doc.getText()),
        };
      });
      expect(orderFields).to.deep.equal([
        {
          name: 'orderSn',
          type: 'string',
          descText: [ '/** 订单编号 */' ],
        },
        {
          name: 'receiverKeyword',
          type: 'string',
          descText: [ '/** 收货人姓名/号码 */' ],
        },
        {
          name: 'status',
          type: 'number',
          descText: [ '/** 订单状态：0->待付款；1->待发货；2->已发货；3->已完成；4->已关闭；5->无效订单 */' ],
        },
        {
          name: 'orderType',
          type: 'number',
          descText: [ '/** 订单类型：0->正常订单；1->秒杀订单 */' ],
        },
        {
          
          name: 'sourceType',
          type: 'number',
          descText: [ '/** 订单来源：0->PC订单；1->app订单 */' ],
        },
        { 
          name: 'createTime',
          type: 'string',
          descText: [ '/** 订单提交时间 */' ],
        },
        { 
          name: 'order',
          type: 'OmsOrder',
          descText: [ '/** */' ],
        }
      ]);
    });

    it('super class', () => {
    });
  });
});
