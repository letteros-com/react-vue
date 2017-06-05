const fs = require('fs')
const path = require('path')
const beautify = require('js-beautify').js_beautify

const compiler = require('../packages/react-vue-template-compiler')

const originCode = fs.readFileSync(path.join(__dirname, 'test.vue')).toString()

const template = originCode // .match(/<template>([\s\S]*)<\/template>/)[1]

const result = compiler.compile(template, {
  preserveWhitespace: false,
  level: 0,
  vueConfig: {
    scope: 1
  }
})

const render = beautify(result.code, {
  'indent_size': 2
})
// console.log(code)
fs.writeFileSync('test.js', render, 'utf8')
