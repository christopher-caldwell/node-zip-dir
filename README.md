# zip-dir

Zips up a directory and saves the zip to disk or returns as a buffer. Forked from [node-zip-dir](https://github.com/jsantell/node-zip-dir). This version is async, and natively TypeScript.

<p align="center">
  <h4/>
  <a href='https://www.npmjs.com/package/@caldwell619/zip-dir'>
    <img src="https://img.shields.io/npm/v/@caldwell619/zip-dir">
  </a>
  <a href='https://bundlephobia.com/result?p=@caldwell619/zip-dir'>
    <img src="https://img.shields.io/bundlephobia/min/@caldwell619/zip-dir">
  </a>
  <img src="https://codecov.io/gh/christopher-caldwell/node-zip-dir/branch/master/graph/badge.svg?token=2LA7ETDPO3">
  <img src="https://img.shields.io/github/last-commit/christopher-caldwell/node-zip-dir">
  <img src="https://img.shields.io/npm/types/@caldwell619/zip-dir">
</p>

## Installation

```bash
# Yarn
yarn add @caldwell619/zip-dir

# NPM
npm install --save @caldwell619/zip-dir
```

## Basic Example

The library is async, and will return a Buffer that you can do whatever you'd like with.

```ts
import { zipWrite } from '@caldwell619/zip-dir'

const buffer = await zipWrite('../')
```

## Options

Every option is optional, as well as the entire options object. You do not need to provide these options.

<table>
  <thead>
    <tr>
      <td>
        Name
      </td>
      <td>
        Type
      </td>
      <td>
        Description
      </td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <code>saveTo</code>
      </td>
      <td>
        <code>string</code>
      </td>
      <td>
        If present, will write the zip to the disc at the specified location. This is nice if all you want to do is write the file
      </td>
    </tr>
    <tr>
      <td>
        <code>each</code>
      </td>
      <td>
        <code>(path: string) => void</code>
      </td>
      <td>
        Callback that can be executed on each path that is explored. This will fire for files, and directories, even if they are empty.
      </td>
    </tr>
    <tr>
      <td>
        <code>filter</code>
      </td>
      <td>
        <code>(path: string, stat: Stats) => boolean</code>
      </td>
      <td>
        Filter out directories or files that you don't want to be in the zip. This is useful for <code>node modules/</code>, <code>.git/</code>, etc.
      </td>
    </tr>
    <tr>
      <td>
        <code>maxOpenFiles</code>
      </td>
      <td>
        <code>number</code>
      </td>
      <td>
        More of an internal mechanism, but exposed in case you want to push it. This is the limit of files the tool will try to process at once. Depending on your machine, this can be increased or decreased.
      </td>
    </tr>
  </tbody>
</table>

## In-depth Examples

### Saving to Disc

Zips the parent directory, and writes to `/tmp`

```ts
import { zipWrite } from '@caldwell619/zip-dir'

zipWrite('..', {
  saveTo: '/tmp/result.zip'
})
```

### Saving to Disc using `path`

Zips the entire parent directory, excluding `node_modules/`, `.git` and any `.zip` files. This will write to the current directory with a file name of `result.zip`.

```ts
import { zipWrite } from '@caldwell619/zip-dir'
import { resolve, join } from 'path'

const zipPath = join(process.cwd(), '..')
const zipOutputPath = resolve(process.cwd(), 'result.zip')

zipWrite(zipPath, {
  saveTo: zipOutputPath
})
```

### Saving to Disc with Filter

Zips the entire parent directory, excluding `node_modules/`, `.git` and any `.zip` files. This will write to the current directory with a file name of `result.zip`.

```ts
import { zipWrite } from '@caldwell619/zip-dir'
import { resolve, join } from 'path'

const zipPath = join(process.cwd(), '..')
const zipOutputPath = resolve(process.cwd(), 'result.zip')

zipWrite(zipPath, {
  filter: path => {
    const isNodeModules = /node_modules$/.test(path)
    const isGit = /\.git$/.test(path)
    const isZip = /\.zip$/.test(path)
    return !isNodeModules && !isGit && !isZip
  },
  saveTo: zipOutputPath
})
```

### Getting the Buffer

```ts
import { zipWrite } from '@caldwell619/zip-dir'

const getBuffer = async () => {
  const buffer = await zipWrite('../')
  // Whatever else you wanna do with a Buffer
}
```