import path from 'path';
import fs from 'fs-extra';
import sinon from 'sinon';
import { expect } from 'chai';

import ModelAdapter from '../../../lib/http/adapter/model';

describe.only('lib/http/adapter/model', () => {
  let fileMetaData = fs.readJSONSync(path.join(__dirname, '../../fixture/oneapi.json'));

  afterEach(() => {
    sinon.restore();
  });

  it('constructor', () => {
    const fileMeta = fileMetaData['org.javaboy.vhr.model.ChatMsg'];
    const modelAdapter = new ModelAdapter(fileMeta);

    expect(modelAdapter['fileMeta']).to.deep.equal(fileMeta);
    expect(modelAdapter['httpAdapter']).to.deep.equal({
      filePath: '/Users/vhr/vhr/vhrserver/vhr-model/src/main/java/org/javaboy/vhr/model/ChatMsg.java',
      description: null,
      className: 'ChatMsg',
      classPath: 'org.javaboy.vhr.model.ChatMsg',
      actualType: undefined,
      fileType: 'RESOURCE',
      fields: [],
      importDeclaration: {}
    });
  });
});
