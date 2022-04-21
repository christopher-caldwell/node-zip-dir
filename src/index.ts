import { writeFileSync, readdirSync, readFileSync, statSync, Stats } from 'fs'
import path from 'path'
import asyncLib, { QueueObject } from 'async'
import Zip from 'jszip'

type Folders = Record<string, Zip>

export interface Options {
  saveTo?: string
  each?: (path: string) => void
  filter?: (path: string, stat: Stats) => boolean
  maxOpenFiles?: number
}
export type FileQueue = QueueObject<Task>

export const zipWrite = async (rootDir: string, options: Options = { maxOpenFiles: 500 }) => {
  const buffer = await zipBuffer(rootDir, options)
  if (options.saveTo) writeFileSync(options.saveTo, buffer, { encoding: 'binary' })
}

const zip = new Zip()

const zipBuffer = async (rootDir: string, options: Options) => {
  const folders: Folders = {}
  const fileQueue = generateFileQueue(folders, options)
  // Resolve the path so we can remove trailing slash if provided
  rootDir = path.resolve(rootDir)

  folders[rootDir] = zip

  dive(rootDir, options, folders, fileQueue)
  const buffer = await zip.generateAsync({
    compression: 'DEFLATE',
    type: 'nodebuffer'
  })
  return buffer
}

export interface Task {
  fullPath: string
  dir: string
  file: string
}
// var fileQueue =
const generateFileQueue = (folders: Folders, options: Options) =>
  asyncLib.queue<Task>((task, callback) => {
    try {
      const data = readFileSync(task.fullPath)

      if (options.each) {
        options.each(path.join(task.dir, task.file))
      }
      folders[task.dir].file(task.file, data)
    } catch (e) {
      callback(e as Error)
    }
  }, options.maxOpenFiles)

const addItem = async (fullPath: string, options: Options, folders: Folders, fileQueue: FileQueue) => {
  const stat = statSync(fullPath)
  if (options.filter && !options.filter(fullPath, stat)) return
  var dir = path.dirname(fullPath)
  var file = path.basename(fullPath)
  var parentZip
  if (stat.isDirectory()) {
    parentZip = folders[dir]
    if (options.each) {
      options.each(fullPath)
    }
    const newZip = parentZip.folder(file)
    if (newZip === null) throw new Error('[addItem]: Zip is null')
    folders[fullPath] = newZip
    await dive(fullPath, options, folders, fileQueue)
  } else {
    fileQueue.push({ fullPath: fullPath, dir: dir, file: file })
  }
}

const dive = (dir: string, options: Options, folders: Folders, fileQueue: FileQueue) => {
  return new Promise((resolve, reject) => {
    try {
      const files = readdirSync(dir)
      if (!files.length) resolve(null)
      let count = files.length
      files.forEach(file => {
        const fullPath = path.resolve(dir, file)
        try {
          addItem(fullPath, options, folders, fileQueue)
        } catch (addItemError) {
          if (!--count) {
            reject(addItemError)
          }
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
