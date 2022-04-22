import fs from 'fs-extra'
import Zip from 'jszip'
import path from 'path'

import { zipWrite } from '@/index'

import {
  compareFiles,
  zipAndUnzip,
  cleanUp,
  addEmpty,
  jsonOnly,
  noDirs,
  sourcePath,
  zipPath,
  outputPath
} from './utils'

beforeEach(async () => {
  addEmpty()
  await zipAndUnzip({ saveTo: zipPath })
})
afterEach(cleanUp)

describe.skip('Creates a zip buffer', () => {
  test('Returns a usable zip buffer', () => {
    const getBuffer = async () => {
      const buffer = await zipWrite(sourcePath)
      const JsZip = new Zip()
      const zip = await JsZip.loadAsync(buffer)
      return zip
    }
    expect(getBuffer()).resolves
  })

  test('Works with a trailing `/` in the path', () => {
    const getBuffer = async () => {
      const buffer = await zipWrite(path.join(sourcePath, path.sep))
      const zip = new Zip()
      await zip.loadAsync(buffer)
      console.log('buffer', buffer)
    }
    expect(getBuffer()).resolves
  })

  test("Throws an error when dirPath doesn't exist", () => {
    const getInvalidBuffer = async () => {
      await zipWrite(zipPath)
    }
    expect(getInvalidBuffer()).rejects
  })

  test('Throws an error when dirPath is a file', () => {
    const getInvalidBuffer = async () => {
      await zipWrite(path.join(sourcePath, 'file1.json'))
    }
    expect(getInvalidBuffer()).rejects
  })
})

describe('Writes a zip file', () => {
  test('Compresses and unpacks and all files match', () => {
    const files = ['file1.json', 'tiny.gif', 'dir/file2.json', 'dir/file3.json', 'dir/deep-dir/deeper-dir/file4.json']
    expect.assertions(files.length)
    files.forEach(compareFiles)
  })

  /*
    // No longer works in v2.0.0, cannot determine the change in
    // in JSZip that caused this.
    it("retains empty directories", function (done) {
      fs.stat(emptyDirOutputPath, function (err, stat) {
        expect(err).to.not.be.ok;
        expect(stat.isDirectory()).to.be.ok;
        done();
      });
    });
    */
})

describe.skip('If a root path is specified', () => {
  const files = ['file1.json', 'tiny.gif', 'dir/file2.json', 'dir/file3.json', 'dir/deep-dir/deeper-dir/file4.json']
  test('stores input files and folders below the root path', async () => {
    expect.assertions(files.length)
    await zipAndUnzip({ saveTo: zipPath })
    files.forEach(compareFiles)
  })
})

describe.skip('Uses `filter` to select items', () => {
  test('filters out by file name, fs.Stat', async () => {
    await zipAndUnzip({ saveTo: zipPath, filter: jsonOnly })
    const files = ['file1.json', 'dir/file2.json', 'dir/file3.json', 'dir/deep-dir/deeper-dir/file4.json']
    expect.assertions(files.length)
    files.forEach(compareFiles)
    fs.statSync(path.join(outputPath, 'tiny.gif'))
  })

  test('Filtering out directories keeps it shallow', () => {
    zipAndUnzip({ saveTo: zipPath, filter: noDirs })
    const files = ['file1.json', 'tiny.gif']
    expect.assertions(files.length)
    files.forEach(compareFiles)
    fs.statSync(path.join(outputPath, 'dir'))
  })
})

describe.skip('`each` option', function () {
  test('Calls "each" with each path added to zip', async () => {
    const paths: string[] = []
    await zipWrite(sourcePath, { each: path => paths.push(path) })
    const fileNames = [
      'file1.json',
      'tiny.gif',
      'dir/',
      'dir/file2.json',
      'dir/file3.json',
      'dir/deep-dir',
      'dir/deep-dir/deeper-dir',
      'dir/deep-dir/deeper-dir/file4.json'
    ]
    const files = fileNames.map(filePath => {
      return path.join.apply(path, [sourcePath].concat(filePath.split('/')))
    })

    files.forEach(file => {
      expect(paths.indexOf(file)).not.toEqual(-1)
    })

    expect(paths.length).toEqual(files.length)
  })

  test('Calls "each", ignoring un-added files', async () => {
    const paths: string[] = []
    const filter = (path: string) => {
      return /\.json$/.test(path) || fs.statSync(path).isDirectory()
    }
    const each = (path: string) => paths.push(path)
    await zipWrite(sourcePath, { each, filter })
    const fileNames = [
      'file1.json',
      'dir/file2.json',
      'dir/file3.json',
      'dir/',
      'dir/deep-dir',
      'dir/deep-dir/deeper-dir',
      'dir/deep-dir/deeper-dir/file4.json'
    ]

    const files = fileNames.map(name => {
      return path.join.apply(path, [sourcePath].concat(name.split('/')))
    })

    expect.assertions(files.length + 1)
    files.forEach(file => {
      expect(paths.indexOf(file)).not.toEqual(-1)
    })

    expect(paths.length).toEqual(files.length)
  })
})
