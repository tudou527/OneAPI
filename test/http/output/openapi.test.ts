import { expect } from 'chai';
import path from 'path';
import sinon from 'sinon';
import { IndentationText, Project } from 'ts-morph';

import HttpProtocol from '../../../lib/http';
import { ServiceGenerator } from '../../../lib/http/output/service';

describe('lib/http/output/openapi', () => {
  let project: Project = null;
  let httpPotocol: HttpProtocol = null;

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
  });

  afterEach(() => {
    sinon.restore();

    project = null;
    httpPotocol = null;
  });

  describe('entry', () => {
    it('normal', () => {
      let fakeArgs: any = [];
      const adapter = httpPotocol.adapterDataList.at(0);
      const apiGenerator = new ServiceGenerator(path.join(__dirname, '../../services'), project, adapter);

      sinon.stub(apiGenerator.sourceFile, 'save').callsFake(sinon.fake(async (...args) => {
        fakeArgs = args;
      }));

      expect(fakeArgs).to.deep.equal([]);
      console.log('>>>>> sourceFile: ', apiGenerator.sourceFile);
    });
  });
});
