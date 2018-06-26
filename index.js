#!/usr/bin/env node
const glob = require('glob')
const fs = require('fs')
const i18next = require('i18next')
const deepMerge = require('deepmerge')
const chalk = require('chalk')

const argv = require('yargs')
.option('sources', { alias: 's', description: 'JavaScript source files path (glob)', required: true })
.option('resources', { alias: 'r', description: 'I18next resource files path (glob)', required: true })
.option('default-ns', { default: 'common', description: 'Default i18next namespace' })
.argv

glob(argv.resources, (err, resources) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  glob(argv.sources, (err, sources) => {
    if (err) {
      console.error(err)
      process.exit(-1)
    }

    i18next.init({
      defaultNS: argv.defaultNs,
      resources: { en: resources.map((file) => JSON.parse(fs.readFileSync(file))).reduce((all, r) => deepMerge(all, r), {}) },
      lng: 'en'
    })
    for (const file of sources) {
      const regex = /[{ ]t\('(.+?)'/g
      const content = fs.readFileSync(file, 'utf8')
      let m = regex.exec(content)
      while (m) {
        if (!i18next.exists(m[1])) {
          const line = content.substr(0, m.index).split('\n').length
          console.error(`${chalk.red(`${file}:${line}`)} Unknown translation key ${chalk.bold(m[1])}`)
          process.exitCode = -1
        }
        m = regex.exec(content)
      }
    }
  })
})
