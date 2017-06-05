import {
	parse
} from 'compiler/parser/index'

import {
	WebRenderGenerator
} from 'react-vue/compiler/codegen/index'

// import {
//   handleUnaryTag
// } from './helpers'

import {
  isPreTag,
  isUnaryTag,
  // mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace
} from './util/index'

export const baseOptions = {
  expectHTML: true,
  isPreTag,
  isUnaryTag,
  // mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace
}

export function compile (template, options) {
  let ast
  let code
  if (template) {
    ast = parse(template.trim(), Object.assign({}, baseOptions, options))
    // ast.children.forEach(v => handleUnaryTag(v))
    const renderer = new WebRenderGenerator(ast, options)
    code = renderer.generate()
  } else {
    code = 'export default () => null'
  }
  return {
    ast,
    code
  }
}
