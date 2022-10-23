import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import { expect } from 'chai';
import fsExtra from 'fs-extra';
import { FunctionDeclaration, IndentationText, Project } from 'ts-morph';

import { IHttpAdapter } from '../../../src/http/adapter';
import { ServiceGenerator } from '../../../src/http/output/service';

describe('lib/http/output/service', () => {
  let project: Project = null as unknown as Project;
  let adapterDataList: IHttpAdapter[] = [];
  // 整个项目所有依赖的 classPath
  let projectImportClassPath: string[] = [];

  beforeEach(() => {
    project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces
      },
    });

    adapterDataList = fsExtra.readJSONSync(path.resolve(__dirname, '../../fixtures/oneapi.json')).http;

    // 整个项目所有依赖的 classPath
    adapterDataList.map(adapter => {
      Object.keys(adapter.importDeclaration).forEach(classPath => {
        if (!projectImportClassPath.includes(classPath)) {
          projectImportClassPath.push(classPath);
        }
      });
    });
  });

  afterEach(() => {
    project = null as unknown as Project;
    adapterDataList = [];

    sinon.restore();
  });

  describe('service', () => {
    it('normal', () => {
      let fakeArgs: any = [];
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderController');

      // 只保留一个方法方便断言
      adapter!.services = adapter!.services?.splice(0, 1);
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        adapter!,
        []
      );
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');
      expect(fakeArgs).to.deep.equal([]);

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => {
        return {
          // 匹配 import { name } from ... 或 import name from ...  
          name: im.getNamedImports().at(0)?.getName() || im.getDefaultImport()?.getText(),
          moduleSpecifier: im.getModuleSpecifier().getText(),
        };
      });
      expect(importDeclarations).to.deep.equal([
        { name: 'request', moduleSpecifier: '"@/utils/request"' },
        { name: 'OmsOrderQueryParam', moduleSpecifier: '"./model/dto/omsOrderQueryParam"'},
        { name: 'CommonResult', moduleSpecifier: '"./model/api/commonResult"' },
        { name: 'CommonPage', moduleSpecifier: '"./model/api/commonPage"' },
        { name: 'OmsOrder', moduleSpecifier: '"./model/model/omsOrder"' },
        { name: 'PmsProductAttributeCategoryItem', moduleSpecifier: '"./model/dto/pmsProductAttributeCategoryItem"'},
        { name: 'OmsOrderDetail', moduleSpecifier: '"./model/domain/omsOrderDetail"'},
      ]);

      // method
      const methodDeclarations = apiGenerator.sourceFile.getFunctions().at(0) as FunctionDeclaration;

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
      expect(returnText).to.equal('Promise<any>');

      // 方法体
      const methodBody = methodDeclarations.getBodyText() as string;
      expect(methodBody.includes(`method: 'GET',`)).to.equal(true);
      expect(methodBody.includes(`url: '/order/list'`)).to.equal(true);

      expect(methodBody.includes(`queryParam: args.queryParam,`)).to.equal(true);
      expect(methodBody.includes(`pageSize: args.pageSize,`)).to.equal(true);
      expect(methodBody.includes(`pageNum: args.pageNum,`)).to.equal(true);

      expect(methodBody.includes(`'Content-Type': 'application/json',`)).to.equal(true);
    });

    it('services is null', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderController');
      // 删除 service
      delete adapter?.services;
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        adapter!,
        [],
      );
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // method 不存在
      const methods = apiGenerator.sourceFile.getFunctions();
      expect(methods.length).to.equal(0);
    });

    it('post method', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderController');

      adapter!.services = adapter!.services?.filter(se => se.operationId === 'upload')
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        adapter!,
        [],
      );
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // 方法体
      const methodBody = apiGenerator.sourceFile.getFunctions().at(0)!.getBodyText();
      
      expect(methodBody!.includes(`method: 'POST',`)).to.equal(true);
      expect(methodBody!.includes(`data: {`)).to.equal(true);
      expect(methodBody!.includes(`file: args.file,`)).to.equal(true);
      expect(methodBody!.includes(`'Content-Type': 'multipart/form-data',`)).to.equal(true);
    });

    it('url params', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderController');
      adapter!.services = adapter!.services?.filter(se => se.operationId === 'detail');
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        adapter!,
        [],
      );
      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // 方法体
      const methodBody = apiGenerator.sourceFile.getFunctions().at(0)!.getBodyText();

      expect(methodBody!.includes('url: `/order/${args.id}`,')).to.equal(true);
    });
  });

  describe('model', () => {
    it('normal', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderQueryParam');
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../fixtures'), project, adapter!, []);
      // mock existsSync
      sinon.stub(fs, 'existsSync').callsFake(sinon.fake(() => {
        return false;
      }));
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));
      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => ({
        name: im.getNamedImports().at(0)?.getName() || im.getDefaultImport()!.getText(),
        moduleSpecifier: im.getModuleSpecifier().getText(),
      }));
      expect(importDeclarations).to.deep.equal([
        { name: 'OmsOrder', moduleSpecifier: '"../model/omsOrder"' },
      ]);

      // interface 
      const fields = apiGenerator.sourceFile.getInterfaces().at(0)!.getProperties().map((property) => {
        return {
          name: property.getName(),
          type: property.getType().getText(),
          descText: property.getJsDocs().map(doc => doc.getText()),
        };
      });
      expect(fields).to.deep.equal([
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
        },
        { 
          name: 'calcAmount',
          type: 'OmsOrderQueryParamCalcAmount',
          descText: [ '/** */' ],
        },
      ]);
    });

    it('generic class model', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'CommonPage');
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../services'), project, adapter!, []);

      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));
      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      const interfaceText = apiGenerator.sourceFile.getInterfaces().at(0)!.getText();

      // 泛型默认值为 any      
      expect(interfaceText.includes('export interface CommonPage<T = any> {')).to.equal(true);
      expect(interfaceText.includes('list: Array<T>;')).to.equal(true);
    });

    it('empty fields', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderQueryParam');
      delete adapter?.fields;
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        adapter!,
        []
      );

      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));
      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // 空字段 
      const fields = apiGenerator.sourceFile.getInterfaces().at(0)!.getProperties();
      expect(fields.length).to.equal(0);
    });

    it('super class', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'OmsOrderDetail');
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../services'), project, adapter!, []);

      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));
      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => ({
        name: im.getNamedImports().at(0)?.getName() || im.getDefaultImport()!.getText(),
        moduleSpecifier: im.getModuleSpecifier().getText(),
      }));
      expect(importDeclarations).to.deep.equal([
        { name: 'CommonResult', moduleSpecifier: '"../api/commonResult"' },
        { name: 'OmsOrderQueryParam', moduleSpecifier: '"../dto/omsOrderQueryParam"' },
      ]);

      // interface extend
      const interfaceText = apiGenerator.sourceFile.getText();
      expect(interfaceText.includes('export interface OmsOrderDetail extends CommonResult<OmsOrderQueryParam> {')).to.equal(true);
    });

    it('super class item is null', () => {
      const adapter = adapterDataList.find(adapter => adapter.className === 'PmsProductAttributeCategoryItem');
      const apiGenerator = new ServiceGenerator(
        path.join(__dirname, '../../services'),
        project,
        { ...adapter, superClass: { ...adapter!.superClass, items: null as unknown as any } },
        [],
      );

      // mock save 方法（不写文件）
      sinon.stub(apiGenerator.sourceFile, 'saveSync').callsFake(sinon.fake(() => {}));
      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // import
      const importDeclarations = apiGenerator.sourceFile.getImportDeclarations().map(im => ({
        name: im.getNamedImports().at(0)?.getName() || im.getDefaultImport()!.getText(),
        moduleSpecifier: im.getModuleSpecifier().getText(),
      }));
      
      expect(importDeclarations).to.deep.equal([
        { name: 'PmsProductAttribute', moduleSpecifier: '"../model/pmsProductAttribute"' },
        { name: 'PmsProductAttributeCategory', moduleSpecifier: '"../model/pmsProductAttributeCategory"' },
      ]);

      // interface extend
      const interfaceText = apiGenerator.sourceFile.getText();
      expect(interfaceText.includes('export interface PmsProductAttributeCategoryItem extends PmsProductAttributeCategory {')).to.equal(true);
    });

    it('sub class', () => {
      const fileSavePath: string[] = [];
      const adapter = adapterDataList.find(ada => ada.className === 'OmsOrderQueryParam');
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../fixtures'), project, adapter!, fileSavePath);
      // 缓存写入的文件
      fileSavePath.push(apiGenerator.fileSavePath);

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      // 写入 sub class
      const subAdapter = adapterDataList.find(ada => ada.className === 'OmsOrderQueryParamCalcAmount');
      const subApiGenerator = new ServiceGenerator(path.join(__dirname, '../../fixtures'), project, subAdapter!, fileSavePath);
      // 缓存写入的文件
      fileSavePath.push(subApiGenerator.fileSavePath);
      subApiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      const modelContent: string = fs.readFileSync(fileSavePath.at(0) as any, 'utf-8');
      
      expect(modelContent.includes('export interface OmsOrderQueryParam {')).to.be.equal(true);
      expect(modelContent.includes('export interface OmsOrderQueryParamCalcAmount {')).to.be.equal(true);

      fs.rmSync(path.join(__dirname, '../../fixtures/model'), { recursive: true, force: true });
    });

    it('file exist', () => {
      const fileSavePath: string[] = [];
      const adapter = adapterDataList.find(ada => ada.className === 'OmsOrderQueryParam');
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../fixtures'), project, adapter!, []);
      // 缓存写入的文件
      fileSavePath.push(apiGenerator.fileSavePath);

      apiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');
      // 写入 sub class
      const subAdapter = adapterDataList.find(ada => ada.className === 'OmsOrderQueryParamCalcAmount');
      const subApiGenerator = new ServiceGenerator(path.join(__dirname, '../../fixtures'), project, subAdapter!, []);
      subApiGenerator.generate(projectImportClassPath, 'import request from "@/utils/request";');

      const modelContent: string = fs.readFileSync(fileSavePath.at(0) as any, 'utf-8');
      
      expect(modelContent.includes('export interface OmsOrderQueryParam {')).to.be.equal(false);
      expect(modelContent.includes('export interface OmsOrderQueryParamCalcAmount {')).to.be.equal(true);

      fs.rmSync(path.join(__dirname, '../../fixtures/model'), { recursive: true, force: true });
    });
  });
});
