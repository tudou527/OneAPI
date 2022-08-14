import fs from 'fs-extra';
import sinon from 'sinon';
import stream from 'stream';
import events from 'events';
import assert from 'assert';
import cp from 'child_process';

import main from '../lib/main';
import HttpProtocol from '../lib/http';

describe('lib/main', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('without java env var', async () => {
    sinon.stub(cp, 'execSync').withArgs('which java').throws(new Error('mvn not found'));

    assert.rejects(async () => {
      await main({ projectDir: '', saveDir: '' });
    });
  });

  it('without mvn env var', async () => {
    sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').throws(new Error('mvn not found'));

    assert.rejects(async () => {
      await main({ projectDir: '', saveDir: '' });
    });
  });

  it('normal', async () => {
    const proc: any = new events.EventEmitter();
    proc.stdin = new stream.Writable();
    proc.stdout = <stream.Readable> new events.EventEmitter();
    proc.stderr = <stream.Readable> new events.EventEmitter();

    const fake = sinon.fake(() => {
      setTimeout(() => {
        proc.emit('close');
      }, 5);
      return proc;
    });
    sinon.replace(cp, 'spawn', fake);

    let fsArg: string = '';
    sinon.replace(fs, 'readJSONSync', sinon.fake((...args) => {
      fsArg = args[0];
      return {};
    }));

    sinon.stub(HttpProtocol.prototype, <any>'generateService').resolves();
    sinon.stub(HttpProtocol.prototype, <any>'convertModel').resolves();
    sinon.stub(HttpProtocol.prototype, <any>'generateOpenApi').resolves();

    await main({ projectDir: '/projectDir', saveDir: '/saveDir' });
    assert.equal(fsArg, '/saveDir/oneapi.json');
  });
});
