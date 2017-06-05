const changeCase = require('change-case')
const {
  TAB_INDENT,
  NATIVE
} = require('./config')

class JSXGenetator {
  constructor (ast, level = 0) {
    this.ast = ast
    this.level = level
  }

  genJSX (ast, level = 0) {
    if (ast.type === 3) {
      return this.genText(ast, level)
    }
    if (ast.type === 2) {
      return this.genTextExpression(ast, level)
    }
    if (Array.isArray(ast.directives)) {
      if (ast.directives.filter(v => v.name === 'model').length > 0) {
        return this.genModel(ast, level)
      }
    }
    if (ast.forProcessed) {
      return this.genFor(ast, level)
    }
    if (ast.ifConditions) {
      return this.genIf(ast, level + 1)
    }
    if (ast.events) {
      return this.genEvents(ast, level)
    }
    return this.genSingleJSX(ast, level)
  }

  genSingleJSX (ast, level) {
    const tag = ast.tag

    if (tag === 'slot') {
      return this.genSlot(ast, level)
    }

    const jsxTag = this.genTag(tag)

    let jsxProps = ''

    if (ast.key) {
      jsxProps += this.genLFI(`key={${ast.key}}`, level + 1)
    }
    if (Array.isArray(ast.attrs)) {
      jsxProps += this.genProps(ast.attrs, level + 1)
    }

    jsxProps += this.genStyle(ast, level + 1)

    const openJSXTag = `<${jsxTag}${jsxProps}>`
    const closeJSXTag = `</${jsxTag}>`

    let children = ''
    if (Array.isArray(ast.children)) {
      children = this.genChildren(ast.children, level + 1)
    }

    return `${this.genLFI(openJSXTag, level)}${children}${this.genLFI(closeJSXTag, level)}`
  }

  genChildren (children, level) {
    return children.map((v) => {
      return this.genJSX(v, level)
    }).join('')
  }

  genLFI (code, level) {
    return `\n${TAB_INDENT.repeat(level)}${code}`
  }

  genEmptyWrapper (value, level) {
    const close = `</${NATIVE.empty}>`
    const code = `<${NATIVE.empty}>${value}${this.genLFI(close, level)}`
    return this.genLFI(code, level)
  }

  genSlot (ast, level) {
    let children = ''
    if (Array.isArray(ast.children)) {
      children = this.genChildren(ast.children, level + 2)
    }
    const name = ast.slotName === undefined ? 'default' : ast.slotName
    const slotcode = `${NATIVE.slot}('${name}', this.props.children,${this.genEmptyWrapper(children, level + 1)})`
    return this.genLFI(`{${slotcode}}`, level)
  }

  genShowDirective (value, level) {
    const code = `${value} && {display: 'none'}`
    return this.genLFI(code, level)
  }

  genTextExpression (ast, level) {
    const text = ast.text.replace(/{{/g, '{').replace(/}}/g, '}')
    return this.genLFI(text, level)
  }

  genText (ast, level) {
    return this.genLFI(ast.text, level)
  }

  genVariable (name, value, type = 'const') {
    const code = `${type} ${name} = ${value};`
    return code
  }

  genProps (attrs, level) {
    return attrs.map((v) => {
      const value = v.value.replace(/^"([\s\S]*)"$/, "'$1'")
      return `${changeCase.camelCase(v.name)}={${value}}`
    }).map((v) => this.genLFI(v, level)).join('')
  }

  genIf (ast, level) {
    let ifS = ast.ifConditions.map((v, i) => {
      if (v.exp === undefined) {
        return `${this.genSingleJSX(v.block, level + i - 1)}`
      } else {
        return ` ${v.exp} ?${this.genSingleJSX(v.block, level + i)}${this.genLFI(':', level + i)}`
      }
    }).join('')
    if (/:$/.test(ifS)) {
      ifS = `{${ifS} null}`
    } else {
      ifS = `{${ifS}}`
    }
    return this.genLFI(ifS, level - 1)
  }

  genModel (ast, level) {
    const model = ast.directives.filter(v => v.name === 'model')[0]
    ast.directives = ast.directives.filter(v => v.name !== 'model')
    ast.attrs = ast.attrs || []
    ast.attrs.push({
      name: 'value',
      value: model.value
    })
    ast.attrs.push({
      name: 'on-change-text',
      value: `(text) => ${model.value} = text`
    })
    return this.genSingleJSX(ast, level)
  }

  genEvents (ast, level) {}

  genTag (ast, level) {}

  genFor (ast, level) {
    let declare = ''
    if (/\d+/g.test(ast.for)) {
      ast.for = `Array.from(new Array(${ast.for}), (v, i) => i + 1)`
    }
    if (ast.alias) {
      declare += this.genLFI(this.genVariable(ast.alias, `${ast.for}[v]`), level + 1)
    }
    if (ast.iterator1) {
      declare += this.genLFI(this.genVariable(ast.iterator1, 'v'), level + 1)
    }
    if (ast.iterator2) {
      declare += this.genLFI(this.genVariable(ast.iterator2, 'i'), level + 1)
    }
    if (ast.key === undefined) {
      ast.key = 'i'
    }
    const keys = `Object.keys(${ast.for})`
    const body = `${this.genSingleJSX(ast, level + 2)}`
    const returnBody = `${this.genLFI('return (', level + 1)}${body}${this.genLFI(');', level + 1)}`
    const code = `${keys}.map((v, i) => {${declare}${returnBody}${this.genLFI('})', level)}`
    return `${this.genLFI('{', level)}${code}}`
  }
}

module.exports = JSXGenetator
