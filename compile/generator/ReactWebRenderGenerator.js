const changeCase = require('change-case')
const RenderGenerator = require('./RenderGenerator')
const {
  WEB
} = require('./config')
const {
  isReservedTag,
  genHandlers
} = require('./util')

class ReactWebRenderGenerator extends RenderGenerator {
  /**
   * override
   */
  genTag (tag) {
    if (isReservedTag(tag)) {
      return `'${tag}'`
    } else {
      return changeCase.pascalCase(tag)
    }
  }

  /**
   * override
   */
  genProps (ast, level) {
    if (Array.isArray(ast.attrs)) {
      let code = ast.attrs
        .filter(v => {
          return v.name !== 'class' && v.name !== 'style'
        })
        .map((v) => {
          const value = v.value.replace(/^"([\s\S]*)"$/, "'$1'")
          return `${changeCase.camelCase(v.name)}: ${value}`
        })
        .map((v) => {
          return this.genFormat(v, level + 1)
        })
      const classProps = this.genClassProps(ast)
      if (classProps) {
        code.push(this.genFormat(classProps, level + 1))
      }
      const styleProps = this.genStyleProps(ast)
      if (styleProps) {
        code.push(this.genFormat(styleProps, level + 1))
      }
      const eventHandler = this.genEventHandler(ast)
      if (eventHandler) {
        code.push(this.genFormat(eventHandler, level + 1))
      }
      const nativeEventHandler = this.genNativeEventHandler(ast)
      if (nativeEventHandler) {
        code.push(this.genFormat(nativeEventHandler, level + 1))
      }
      code = code.join(',')
      return `{${code}${this.genFormat('}', level)}`
    }
  }

  /**
   * gen class props
   * @param {Object} ast
   */
  genClassProps (ast) {
    const classAttrsValue = ast.attrs.filter(v => v.name === 'class').map(v => v.value)
    if (classAttrsValue.length === 0) {
      return
    }
    let staticClass, dynamicClass
    classAttrsValue.forEach(v => {
      if (/^".*"$/.test(v)) {
        staticClass = v.trim() // .replace(/^"(.*)"$/, '$1')
      } else {
        dynamicClass = v
      }
    })
    let code = ''
    if (staticClass) {
      code += staticClass
    }
    if (dynamicClass) {
      code = code.replace(/"$/, ' "')
      code += ` + ${WEB.bindClass.name}(${dynamicClass})`
      this.setVariableDependency(WEB.bindClass)
    }
    code = `className: ${code.trim().replace(/^[\s]*\+[\s]*/, '')}`
    return code
  }

  /**
   * gen style props
   * @param {Object} ast
   */
  genStyleProps (ast) {
    const styleAttrsValue = ast.attrs.filter(v => v.name === 'style').map(v => v.value)
    const show = ast.directives && ast.directives.filter(v => v.name === 'show')[0]
    if (styleAttrsValue.length === 0 && !show) {
      return
    }
    let staticStyle, dynamicStyle
    styleAttrsValue.forEach(v => {
      if (/^".*"$/.test(v)) {
        staticStyle = v.trim().replace(/;*"$/, ';"')
      } else {
        dynamicStyle = v
      }
    })
    let code = ''
    if (staticStyle) {
      code += staticStyle
    }
    if (dynamicStyle) {
      code += ` + ${WEB.bindStyle.name}(${dynamicStyle})`
      this.setVariableDependency(WEB.bindStyle)
    }
    if (show) {
      code += ` + ${WEB.bindStyle.name}({display: ${show.value} ? '' : 'none'})`
      this.setVariableDependency(WEB.bindStyle)
    }
    code = `style: ${code.trim().replace(/^[\s]*\+[\s]*/, '')}`
    return code
  }

  genEventHandler (ast) {
    if (ast.events) {
      return genHandlers(ast.events)
    }
  }

  genNativeEventHandler (ast) {

  }
}

module.exports = ReactWebRenderGenerator
