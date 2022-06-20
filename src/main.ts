import path from 'path';
import fs from 'fs-extra';

const metaData = fs.readJsonSync(path.join(__dirname, '/result.json'));

const entry = Object.keys(metaData).filter(k => metaData[k].)
