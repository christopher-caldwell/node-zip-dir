import fs from 'fs-extra'
import Zip from 'jszip'
import path from 'path'

import { zipWrite } from '../src'

import {
  compareFiles,
  zipAndUnzip,
  cleanUp,
  addEmpty,
  jsonOnly,
  noDirs,
  sampleZipPath,
  xpiPath,
  outputPath
} from './utils'

describe.skip('Creates a zip buffer', () => {
  test('Returns a usable zip buffer', () => {
    const getBuffer = async () => {
      const buffer = await zipWrite(sampleZipPath)
      const JsZip = new Zip()
      const zip = await JsZip.loadAsync(buffer)
      return zip
    }
    expect(getBuffer()).resolves
  })

  test('Works with a trailing `/` in the path', () => {
    const getBuffer = async () => {
      const buffer = await zipWrite(path.join(sampleZipPath, path.sep))
      const zip = new Zip()
      await zip.loadAsync(buffer)
      console.log('buffer', buffer)
    }
    expect(getBuffer()).resolves
  })

  test("Throws an error when dirPath doesn't exist", () => {
    const getInvalidBuffer = async () => {
      await zipWrite(xpiPath)
    }
    expect(getInvalidBuffer()).rejects
  })

  test('Throws an error when dirPath is a file', () => {
    const getInvalidBuffer = async () => {
      await zipWrite(path.join(sampleZipPath, 'file1.json'))
    }
    expect(getInvalidBuffer()).rejects
  })
})

describe('Writes a zip file', function () {
  beforeEach(async () => {
    addEmpty()
    await zipAndUnzip({ saveTo: xpiPath })
  })
  afterEach(cleanUp)

  test('Compresses and unpacks and all files match', () => {
    const files = ['file1.json', 'tiny.gif', 'dir/file2.json', 'dir/file3.json', 'dir/deepDir/deeperDir/file4.json']
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
  afterEach(cleanUp)

  const files = ['file1.json', 'tiny.gif', 'dir/file2.json', 'dir/file3.json', 'dir/deepDir/deeperDir/file4.json']
  test('stores input files and folders below the root path', async () => {
    expect.assertions(files.length)
    await zipAndUnzip({ saveTo: xpiPath })
    files.forEach(compareFiles)
  })
})

describe.skip('Uses `filter` to select items', () => {
  afterEach(cleanUp)

  test('filters out by file name, fs.Stat', async () => {
    await zipAndUnzip({ saveTo: xpiPath, filter: jsonOnly })
    const files = ['file1.json', 'dir/file2.json', 'dir/file3.json', 'dir/deepDir/deeperDir/file4.json']
    expect.assertions(files.length)
    files.forEach(compareFiles)
    fs.statSync(path.join(outputPath, 'tiny.gif'))
  })

  test('Filtering out directories keeps it shallow', () => {
    zipAndUnzip({ saveTo: xpiPath, filter: noDirs })
    const files = ['file1.json', 'tiny.gif']
    expect.assertions(files.length)
    files.forEach(compareFiles)
    fs.statSync(path.join(outputPath, 'dir'))
  })
})

describe.skip('`each` option', function () {
  afterEach(cleanUp)

  test('Calls "each" with each path added to zip', async () => {
    const paths: string[] = []
    await zipWrite(sampleZipPath, { each: path => paths.push(path) })
    const fileNames = [
      'file1.json',
      'tiny.gif',
      'dir/',
      'dir/file2.json',
      'dir/file3.json',
      'dir/deepDir',
      'dir/deepDir/deeperDir',
      'dir/deepDir/deeperDir/file4.json'
    ]
    const files = fileNames.map(filePath => {
      return path.join.apply(path, [sampleZipPath].concat(filePath.split('/')))
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
    await zipWrite(sampleZipPath, { each, filter })
    const fileNames = [
      'file1.json',
      'dir/file2.json',
      'dir/file3.json',
      'dir/',
      'dir/deepDir',
      'dir/deepDir/deeperDir',
      'dir/deepDir/deeperDir/file4.json'
    ]

    const files = fileNames.map(name => {
      return path.join.apply(path, [sampleZipPath].concat(name.split('/')))
    })

    expect.assertions(files.length + 1)
    files.forEach(file => {
      expect(paths.indexOf(file)).not.toEqual(-1)
    })

    expect(paths.length).toEqual(files.length)
  })
})
