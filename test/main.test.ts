import fs from 'fs-extra';
import sinon from 'sinon';
import stream from 'stream';
import events from 'events';
import { expect } from 'chai';
import cp from 'child_process';

import main from '../lib/main';
import HttpProtocol from '../lib/http';

describe('lib/main', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('without java env var', function() {
    return new Promise(async (resolve) => {
      sinon.stub(cp, 'execSync').withArgs('which java').throws(new Error('mvn not found'));

      try {
        await main({ projectDir: '', saveDir: '' });
      } catch(e) {
        expect(e.message).to.include('Java');
      }

      resolve('');
    });
  });

  it('without mvn env var', function() {
    return new Promise(async (resolve) => {
      sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').throws(new Error('mvn not found'));

      try {
        await main({ projectDir: '', saveDir: '' });
      } catch(e) {
        expect(e.message).to.include('Maven');
      }

      resolve('');
    });
  });

  it('normal', function() {
    return new Promise(async (resolve) => {
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

      sinon.stub(fs, 'writeJSONSync').callsFake(() => {});

      sinon.stub(HttpProtocol.prototype as any, 'convertService').callsFake(() => {});
      sinon.stub(HttpProtocol.prototype as any, 'convertModel').callsFake(() => {});

      sinon.stub(HttpProtocol.prototype, 'generateService').callsFake(() => {});
      sinon.stub(HttpProtocol.prototype, 'generateOpenApi').callsFake(() => {});

      await main({ projectDir: '/projectDir', saveDir: '/saveDir' });
      expect(fsArg).to.equal('/saveDir/oneapi.json');

      resolve('');
    });
  });
});
