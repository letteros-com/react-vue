const changeCase = require('change-case')
const {
  TAB_INDENT,
  NATIVE
} = require('./config')
const {
  isReservedTag
} = require('./util')

/**
 * generate line feed indent code
 * @param {String} code
 * @param {Number} level
 * @return {String} code
 */
function genLFI (code, level) {
  return `\n${TAB_INDENT.repeat(level)}${code}`
}

/**
 * genetate jsx tag
 * @param {String} tag  ast tag
 * @return {String} jsx tag
 */
function genTagWeb (tag) {
  if (isReservedTag(tag)) {
    return tag
  } else {
    return changeCase.pascalCase(tag)
  }
}

/**
 * generate jsx props
 * @param {Array} attrs ast.attrs
 * @param {Number} level
 * @return {String} jsx props
 */
function genProps (attrs, level) {
  return attrs.map((v) => {
    const value = v.value.replace(/^"([\s\S]*)"$/, "'$1'")
    return `${changeCase.camelCase(v.name)}={${value}}`
  }).map((v) => genLFI(v, level)).join('')
}

/**
 * generate variable
 * @param {String} name
 * @param {Any} value
 * @param {string} type
 */
function genVariable (name, value, type = 'const') {
  const code = `${type} ${name} = ${value};`
  return code
}

/**
 * generate jsx if condition
 * @param {Object} ast
 * @param {Number} level
 * @return {String} jsx if condition
 */
function genIfCondition (ast, level) {
  let ifS = ast.ifConditions.map((v, i) => {
    if (v.exp === undefined) {
      return `${genSimpleJSX(v.block, level + i - 1)}`
    } else {
      return ` ${v.exp} ?${genSimpleJSX(v.block, level + i)}${genLFI(':', level + i)}`
    }
  }).join('')
  if (/:$/.test(ifS)) {
    ifS = `{${ifS} null}`
  } else {
    ifS = `{${ifS}}`
  }
  return genLFI(ifS, level - 1)
}

/**
 * generate text
 * @param {Object} ast
 * @param {Number} level
 * @return {String}
 */
function genText (ast, level) {
  return genLFI(ast.text, level)
}

/**
 * generate text with expression
 * @param {Object} ast
 * @param {Number} level
 * @return {String}
 */
function genTextExpression (ast, level) {
  const text = ast.text.replace(/{{/g, '{').replace(/}}/g, '}')
  return genLFI(text, level)
}

/**
 * generate text with expression
 * @param {String} value
 * @param {Number} level
 * @return {String}
 */
function genShowDirective (value, level) {
  const code = `${value} && {display: 'none'}`
  return genLFI(code, level)
}

/**
 * gengerate empty wrapper
 * @param {any} value
 * @param {Number} level
 */
function genEmptyWrapper (value, level) {
  const close = `</${NATIVE.empty}>`
  const code = `<${NATIVE.empty}>${value}${genLFI(close, level)}`
  return genLFI(code, level)
}

/**
 * generate style from static class
 * @param {String} staticClass
 * @param {Number} level
 * @return {String}
 */
function genStaticClass (staticClass, level) {
  const a = staticClass.replace(/'|"/g, '')
  return genLFI(`__vuernative__styles['${a}']`, level)
}

/**
 * generate style from binding class
 * @param {String} classBinding
 * @param {Number} level
 * @return {String}
 */
function genBindingClass (classBinding, level) {
  const code = `__vuernative__bindingClass(${classBinding.trim()}, __vuernative__styles)`
  return genLFI(code, level)
}

/**
 * generate style from static style
 * @param {String} style
 * @param {Number} level
 * @return {String}
 */
function genStaticStyle (style, level) {
  try {
    const o = JSON.parse(style)
    const c = Object.keys(o).map((k) => {
      const v = isNaN(parseInt(o[k], 10)) ? `'${o[k]}'` : o[k]
      return `${changeCase.camelCase(k)}: ${v}`
    }).map((v) => genLFI(v, level + 1)).join()
    return `${genLFI('{', level)}${c}${genLFI('}', level)}`
  } catch (e) {
    console.error(e)
  }

  return genLFI(style, level)
}

/**
 * generate style from binding style
 * @param {String} style
 * @param {Number} level
 * @return {String}
 */
function genBindingStyle (styleBinding, level) {
  const code = `__vuernative__bindingStyle(${styleBinding.trim()}, __vuernative__styles)`
  return genLFI(code, level)
}

/**
 * generate style
 * @param {Object} ast
 * @param {Number} level
 * @return {String}
 */
function genStyle (ast, level) {
  const styles = []

  // class
  if (ast.staticClass) {
    styles.push(genStaticClass(ast.staticClass, level + 1))
  }

  // :class
  if (ast.classBinding) {
    styles.push(genBindingClass(ast.classBinding, level + 1))
  }

  // style
  if (ast.staticStyle) {
    styles.push(genStaticStyle(ast.staticStyle, level + 1))
  }

  // :style
  if (ast.styleBinding) {
    styles.push(genBindingStyle(ast.styleBinding, level + 1))
  }

  // v-show --> {display: 'none'}
  if (Array.isArray(ast.directives)) {
    ast.directives.forEach((v) => {
      if (v.name === 'show') {
        styles.push(genShowDirective(v.value, level + 1))
      }
    })
  }

  let styleStr = ''

  if (styles.length === 0) {
    return styleStr
  }

  if (styles.length === 1) {
    styleStr = `style={${styles.join()}${genLFI('}', level)}`
  } else if (styles.length > 1) {
    styleStr = `style={[${styles.join(',')}${genLFI(']}', level)}`
  }

  return genLFI(styleStr, level)
}

/**
 * generate jsx from children
 * @param {Array} children ast.children
 * @param {Number} level
 * @return {String} jsx
 */
function genChildren (children, level) {
  return children.map((v) => {
    return genJSX(v, level)
  }).join('')
}

/**
 * generate jsx for expression
 * @param {Object} ast
 * @param {Number} level
 */
function genFor (ast, level) {
  let declare = ''
  if (/\d+/g.test(ast.for)) {
    ast.for = `Array.from(new Array(${ast.for}), (v, i) => i + 1)`
  }
  if (ast.alias) {
    declare += genLFI(genVariable(ast.alias, `${ast.for}[v]`), level + 1)
  }
  if (ast.iterator1) {
    declare += genLFI(genVariable(ast.iterator1, 'v'), level + 1)
  }
  if (ast.iterator2) {
    declare += genLFI(genVariable(ast.iterator2, 'i'), level + 1)
  }
  if (ast.key === undefined) {
    ast.key = 'i'
  }
  const keys = `Object.keys(${ast.for})`
  const body = `${genSimpleJSX(ast, level + 2)}`
  const returnBody = `${genLFI('return (', level + 1)}${body}${genLFI(');', level + 1)}`
  const code = `${keys}.map((v, i) => {${declare}${returnBody}${genLFI('})', level)}`
  return `${genLFI('{', level)}${code}}`
}

/**
 * generate event handle jsx
 * @param {Object} ast
 * @param {Number} level
 * @return {String} jsx
 */
function genEvents (ast, level) {
  if (ast.events.click) {
    const value = ast.events.click.value.replace(/\(.*\)$/, '')
    const match = ast.events.click.value.match(/\((.*)\)$/)
    let args
    if (match === null) {
      args = 'undefined'
    } else {
      args = match[1].replace(/\$event/, 'e')
    }
    const code = `<TouchableOpacity activeOpacity={1} onPress={(e) => __vuernative__click.call(this, ${value}, ${args})}>${genSimpleJSX(ast, level + 1)}${genLFI('</TouchableOpacity>', level)}`
    return genLFI(code, level)
  }
  return genSimpleJSX(ast, level)
}

/**
 * generate relative props with v-model
 * @param {Object} ast
 * @param {Number} level
 */
function genModel (ast, level) {
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
  return genSimpleJSX(ast, level)
}

/**
 * generate expression with slot
 * @param {Object} ast
 * @param {Number} level
 */
function genSlot (ast, level) {
  let children = ''
  if (Array.isArray(ast.children)) {
    children = genChildren(ast.children, level + 2)
  }
  const name = ast.slotName === undefined ? 'default' : ast.slotName
  const slotcode = `${NATIVE.slot}('${name}', this.props.children,${genEmptyWrapper(children, level + 1)})`
  return genLFI(`{${slotcode}}`, level)
}

/**
 * generate jsx without condition
 * @param {Object} ast
 * @param {Number} level
 * @return {String} jsx
 */
function genSimpleJSX (ast, level) {
  const tag = ast.tag

  if (tag === 'slot') {
    return genSlot(ast, level)
  }

  const jsxTag = genTagWeb(tag)

  let jsxProps = ''

  if (ast.key) {
    jsxProps += genLFI(`key={${ast.key}}`, level + 1)
  }
  if (Array.isArray(ast.attrs)) {
    jsxProps += genProps(ast.attrs, level + 1)
  }

  jsxProps += genStyle(ast, level + 1)

  const openJSXTag = `<${jsxTag}${jsxProps}>`
  const closeJSXTag = `</${jsxTag}>`

  let children = ''
  if (Array.isArray(ast.children)) {
    children = genChildren(ast.children, level + 1)
  }

  return `${genLFI(openJSXTag, level)}${children}${genLFI(closeJSXTag, level)}`
}

/**
 * generate code from ASTElement
 * @param {Object} ast
 * @param {Number} level
 * @return {String} generated code
 */
function genJSX (ast, level = 0) {
  if (ast.type === 3) {
    return genText(ast, level)
  }
  if (ast.type === 2) {
    return genTextExpression(ast, level)
  }
  if (Array.isArray(ast.directives)) {
    if (ast.directives.filter(v => v.name === 'model').length > 0) {
      return genModel(ast, level)
    }
  }
  if (ast.forProcessed) {
    return genFor(ast, level)
  }
  if (ast.ifConditions) {
    return genIfCondition(ast, level + 1)
  }
  if (ast.events) {
    return genEvents(ast, level)
  }
  return genSimpleJSX(ast, level)
}

module.exports = genJSX
