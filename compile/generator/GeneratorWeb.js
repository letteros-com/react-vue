const changeCase = require('change-case')
const JSXGenerator = require('./JSXGenerator')
const {
  isReservedTag
} = require('./util')

class JSXGeneratorWeb extends JSXGenerator {
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
      return this.genIfCondition(ast, level + 1)
    }
    if (ast.events) {
      return this.genEvents(ast, level)
    }
    return this.genSingleJSX(ast, level)
  }

  genSingleJSX (ast, level) {
    
  }

  genTag (tag) {
    if (isReservedTag(tag)) {
      return tag
    } else {
      return changeCase.pascalCase(tag)
    }
  }
}

module.exports = JSXGeneratorWeb
