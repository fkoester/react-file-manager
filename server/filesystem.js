import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import Promise from 'bluebird';

const filesystem = new express.Router();
Promise.promisifyAll(fs);
const DATA_DIR = '/';

function pathGuard(somePath) {
  return somePath.replace(/\.\.\//g, '');
}

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return number;
}

function dateToString(date) {
  return date.getUTCFullYear() +
    '-' + pad(date.getUTCMonth() + 1) +
    '-' + pad(date.getUTCDate()) +
    ' ' + pad(date.getUTCHours()) +
    ':' + pad(date.getUTCMinutes()) +
    ':' + pad(date.getUTCSeconds());
}

filesystem.get('/list', (req, res) => {
  const requestedPath = pathGuard('.');
  const fsPath = path.join(DATA_DIR, requestedPath);

  fs.statAsync(fsPath)
  .then((stats) => {
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${fsPath} does not exist!`);
    }
  })
  .return(fs.readdirAsync(fsPath))
  .then(fileNames =>
    Promise.map(fileNames, (fileName) => {
      const filePath = path.join(fsPath, pathGuard(fileName));

      return fs.statAsync(filePath).then(stat => ({
        name: fileName,
        // rights: "Not Implemented", // TODO
        rights: 'drwxr-xr-x',
        size: stat.size,
        date: dateToString(stat.mtime),
        type: stat.isDirectory() ? 'dir' : 'file',
      }));
    })
  )
  .then((files) => {
    res.status(200);
    res.send({
      result: files,
    });
  })
  .catch((err) => {
    res.status(500);
    res.send({
      result: {
        success: false,
        error: err,
      },
    });
  });
});
export default filesystem;
