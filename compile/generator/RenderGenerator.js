const changeCase = require('change-case')
const {
  TAB_INDENT,
  CREATE_ELEMENT
} = require('./config')
const {
  COMMON
} = require('./config')

class GenRender {
  constructor (ast, options) {
    this.ast = ast
    this.level = options.level
    this.variableDependency = []
  }

  setVariableDependency (variable) {
    if (this.variableDependency.indexOf(variable) === -1) {
      this.variableDependency.push(variable)
    }
  }

  genElement (ast, level) {
    // text
    if (ast.type === 3) {
      return this.genText(ast, level)
    }

    // text expression
    if (ast.type === 2) {
      return this.genTextExpression(ast, level)
    }

    // for
    if (ast.for && !ast.forProcessed) {
      return this.genFor(ast, level)
    }

    // if condition
    if (ast.if && !ast.ifProcessed) {
      return this.genIf(ast, level)
    }

    let s = `${CREATE_ELEMENT}(`
    let e = `)`
    s = this.genFormat(s, level)
    e = this.genFormat(e, level)

    let tag = this.genTag(ast.tag)
    tag = this.genFormat(tag, level + 1)

    let props = this.genProps(ast, level + 1) || 'null'
    props = `,${this.genFormat(props, level + 1)}`

    let children = this.genChildren(ast, level + 1)
    if (children) {
      children = `,${children}`
    }

    return `${s}${tag}${props}${children || ''}${e}`
  }

  /**
   * gen children
   * @param {Object} ast
   * @param {Number} level
   */
  genChildren (ast, level) {
    let children = ''
    if (ast.children && ast.children.length) {
      children += ast.children.map((v) => {
        return this.genElement(v, level)
      }).join(',')
    }
    return children
  }

  /**
   * gen text expression
   * @param {Object} ast
   * @param {Number} level
   */
  genTextExpression (ast, level) {
    const text = ast.text.replace(/{{/g, '').replace(/}}/g, '').trim()
    return this.genFormat(text, level)
  }

  /**
   * gen text
   * @param {Object} ast
   * @param {Number} level
   */
  genText (ast, level) {
    const text = JSON.stringify(ast.text)
    return this.genFormat(text, level)
  }

  /**
   * gen if condition
   * @param {Object} ast
   * @param {Number} level
   */
  genIf (ast, level) {
    ast.ifProcessed = true
    return this.genIfConditions(ast.ifConditions.slice(), level)
  }

  genIfConditions (conditions, level) {
    if (!conditions.length) {
      return 'null'
    }
    const condition = conditions.shift()
    let code
    if (condition.exp) {
      code = `(${condition.exp}) ?${this.genElement(condition.block, level + 1)} : ${this.genIfConditions(conditions, level + 1)}`
    } else {
      code = `${this.genElement(condition.block)}`
    }
    return this.genFormat(code, level)
  }

  /**
   * gen for
   * @param {Object} ast
   * @param {Number} level
   */
  genFor (ast, level) {
    const exp = ast.for
    const alias = ast.alias
    const iterator1 = ast.iterator1 ? `,${ast.iterator1}` : ''
    const iterator2 = ast.iterator2 ? `,${ast.iterator2}` : ''

    ast.forProcessed = true

    const code = `${COMMON.renderList.name}(${exp}, (${alias}${iterator1}${iterator2}) => ${this.genElement(ast, level + 1)})`
    this.setVariableDependency(COMMON.renderList)
    return this.genFormat(code, level)
  }

  /**
   * gen props, this funciton would be override by sub class
   * @param {Object} ast
   * @param {Number} level
   */
  genProps (ast, level) {}

  /**
   * format single row
   * @param {String} code
   * @param {Number} level
   */
  genFormat (code, level) {
    return `\n${TAB_INDENT.repeat(level)}${code}`
  }

  /**
   * generate react tag, this funciton would be override by sub class
   * @param {String} tag
   */
  genTag (tag) {
    return tag
  }
}

module.exports = GenRender
