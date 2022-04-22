import { createReadStream, readFileSync, removeSync, mkdirpSync } from 'fs-extra'
import { join } from 'path'
import { Stats } from 'fs'
import unzip from 'unzipper'
import bufferEqual from 'buffer-equal'

import type { Options, ZipFilter } from '../src'
import { zipWrite } from '../src'

export const sourcePath = join(__dirname, 'assets')
export const zipPath = join(__dirname, 'test.zip')
export const outputPath = join(__dirname, 'output')
export const emptyDirPath = join(sourcePath, 'empty-dir')

export const cleanUp = () => {
  removeSync(outputPath)
  removeSync(zipPath)
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
  console.log({ file, sourcePath, outputPath })
  const zipBuffer = readFileSync(join(sourcePath, file))
  const fileBuffer = readFileSync(join(outputPath, file))
  expect(bufferEqual(zipBuffer, fileBuffer)).toBe(true)
}

export const zipAndUnzip = async (options: Options) => {
  await zipWrite(sourcePath, options)
  return new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzip.Extract({ path: outputPath }))
      .on('close', resolve)
      .on('error', reject)
  })
}
