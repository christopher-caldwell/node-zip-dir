import { createReadStream, readFileSync, removeSync, mkdirpSync } from 'fs-extra'
import { join } from 'path'
import { Stats } from 'fs'
import unzip from 'unzipper'
import bufferEqual from 'buffer-equal'

import type { Options, ZipFilter } from '../src'
import { zipWrite } from '../src'

export const sampleZipPath = join(__dirname, 'fixtures/sampleZip')
export const xpiPath = join(__dirname, 'my.xpi')
export const outputPath = join(__dirname, 'myxpi/')
export const emptyDirPath = join(sampleZipPath, 'emptyDir')

export const cleanUp = () => {
  removeSync(outputPath)
  removeSync(xpiPath)
  removeSync(emptyDirPath)
}

/**Adds an empty directory for testing  */
export const addEmpty = () => {
  mkdirpSync(emptyDirPath)
}

export const jsonOnly: ZipFilter = (name: string, stat: Stats) => {
  return /\.json$/.test(name) || stat.isDirectory()
}

export const noDirs: ZipFilter = (_: string, stat: Stats) => {
  return !stat.isDirectory()
}

export const compareFiles = (file: string) => {
  const zipBuffer = readFileSync(join(sampleZipPath, file))
  const fileBuffer = readFileSync(join(outputPath, file))
  expect(bufferEqual(zipBuffer, fileBuffer)).toBe(true)
}

export const zipAndUnzip = async (options: Options) => {
  await zipWrite(sampleZipPath, options)
  return new Promise((resolve, reject) => {
    createReadStream(xpiPath)
      .pipe(unzip.Extract({ path: outputPath }))
      .on('close', resolve)
      .on('error', reject)
  })
}
