import {
  COMMON
} from 'react-vue/compiler/config'

import {
  isObjectShallowModified
} from './util'

function mergeCssModule (computed, cssModules) {
  const _computed = Object.create(computed || null)
  Object.keys(cssModules).forEach(function (key) {
    var module = cssModules[key]
    _computed[key] = function () { return module }
  })
  return _computed
}

export function pascalCaseTag (tag) {
  return tag.split('-').map(v => v.replace(/^[a-z]/, s => s.toUpperCase())).join('')
}

/**
 * for options {components}
 * @param {Object} components
 */
function pascalCaseComponentTag (components) {
  const pascalCaseComponent = {}
  for (const tag in components) {
    pascalCaseComponent[pascalCaseTag(tag)] = components[tag]
  }
  return pascalCaseComponent
}

function handleComponents (components) {
  components = pascalCaseComponentTag(components)
  for (const k in components) {
    const name = components[k].name
    if (name) {
      components[name] = components[k]
    }
  }
  return components
}

function handleDirectives (directives) {
  const obj = {}
  for (const k in directives) {
    obj[k.toLowerCase()] = directives[k]
  }
  return obj
}

/**
 * for 'this.$solts'
 * @param {this.props.children} children
 */
function getSlots (children) {
  const slots = {}
  if (children == null) {
    return slots
  }
  if (!Array.isArray(children)) {
    children = [children]
  }
  children = children.filter(v => v != null)
  children.forEach((v, _i) => {
    if (typeof v === 'string' || typeof v === 'number' || v === null) {
      slots.default = slots.default || []
      slots.default.push(v)
    } else if (v.type === COMMON.template.type) {
      slots[v['data-slot']] = slots[v['data-slot']] || []
      slots[v['data-slot']].push(v.render)
    } else if (v.props) {
      const dataSlot = v.props['data-slot']
      if (dataSlot == null) {
        slots.default = slots.default || []
        slots.default.push(v)
      } else {
        slots[dataSlot] = slots[dataSlot] || []
        slots[dataSlot].push(v)
      }
    }
  })
  return slots
}

function filterCustomEvent (props) {
  return Object.keys(props).filter(v => {
    return v.indexOf(COMMON.customEvent.name) === 0
  }).map(v => {
    return {
      name: v.replace(COMMON.customEvent.name, ''),
      handle: props[v]
    }
  })
}

function triggerDirective (newDirectiveData, oldDirectiveData, vm) {
  for (const key in Object.assign({}, oldDirectiveData, newDirectiveData)) {
    const newData = newDirectiveData[key]
    const oldData = oldDirectiveData[key]
    const directive = vm.$options.directives[newData.name]
    if (!directive) {
      continue
    }
    let ref, binding
    if (newData && oldData) { // update
      ref = newData.directive.ref
      binding = {
        name: newData.name,
        value: newData.value,
        oldValue: oldData.value,
        expression: newData.expression,
        arg: newData.arg,
        modifiers: newData.modifiers
      }
      const args = [ref, binding, newData.directive.reactElement, oldData.directive.reactElement]
      if (typeof directive === 'function') {
        directive.apply(vm, args)
      } else if (typeof directive.update === 'function') {
        directive.update.apply(vm, args)
      }
    } else if (newData && !oldData) { // bind
      ref = newData.directive.ref
      binding = {
        name: newData.name,
        value: newData.value,
        expression: newData.expression,
        arg: newData.arg,
        modifiers: newData.modifiers
      }
      const args = [ref, binding, newData.directive.reactElement]
      if (typeof directive === 'function') {
        directive.apply(vm, args)
      } else if (typeof directive.bind === 'function') {
        directive.bind.apply(vm, args)
      }
    } else if (!newData && oldData) { // unbind
      ref = oldData.directive.ref
      binding = {
        name: oldData.name,
        value: oldData.value,
        expression: oldData.expression,
        arg: oldData.arg,
        modifiers: oldData.modifiers
      }
      const args = [ref, binding, oldData.directive.reactElement]
      if (typeof directive.unbind === 'function') {
        directive.unbind.apply(vm, args)
      }
    }
  }
}

export function buildComponent (render, options, config) {
  const { Component, PropTypes, Vue, cssModules, VueConfiger } = config
  Object.assign(Vue, VueConfiger)
  if (cssModules) {
    options.computed = mergeCssModule(options.computed, cssModules)
  }
  class ReactVueComponent extends Component {
    constructor (props) {
      super(props)
      this._ref = null
      this.eventOnceUid = []
      this.newDirectiveData = {}
      this.oldDirectiveData = {}
      this.vm = {}
      this.beforeMount = []
      this.mounted = []
      this.beforeUpdate = []
      this.updated = []
      this.beforeDestroy = []
    }

    /**
     * children can access parent instance by 'this.context.owner'
     */
    getChildContext () {
      return {
        owner: this
      }
    }

    /**
     * for event modifiers v-on:xxx.once
     */
    setEventOnce (fn) {
      const name = fn.name
      return (event) => {
        if (this.eventOnceUid.indexOf(name) === -1) {
          this.eventOnceUid.push(name)
          fn(event)
        }
      }
    }

    /**
     * for custom directive v-xxx
     */
    // setDirective (directive) {
    //   directive.forEach((v) => {
    //     this.newDirectiveData[v.uid] = Object.assign({}, v, { directive })
    //   })
    // }

    setRootRef (ref) {
      if (ref) {
        ref = ref._ref || ref
        this._ref = ref
        this.vm.$el = this._ref
      }
    }

    setRef (ref, text, inFor) {
      if (ref) {
        // for buildin component, we set ref to his hold node directly
        // it means the buildin componet would be the end of $refs chain
        ref = ref.vm || ref._ref || ref
        if (inFor === true) {
          if (!this.vm.$refs[text]) {
            this.vm.$refs[text] = []
          }
          this.vm.$refs[text].push(ref)
        } else {
          this.vm.$refs[text] = ref
        }
        this.$refs = this.vm.$refs
      }
    }

    buildVM (options) {
      render._withStripped = true

      Object.assign(options, {
        render: render,
        propsData: this.props,
        parent: this.context.owner ? this.context.owner.vm : undefined,
        reactVueSlots: getSlots(this.props.children),
        reactVueCustomEvent: filterCustomEvent(this.props)
      })
      const vm = new Vue(options)

      vm.$options.components = pascalCaseComponentTag(vm.$options.components)
      for (const k in vm.$options.components) {
        const name = vm.$options.components[k].name
        if (name) {
          vm.$options.components[name] = vm.$options.components[k]
        }
      }

      vm.$options.directives = handleDirectives(vm.$options.directives)

      return vm
    }

    componentWillMount () {
      this.vm = this.buildVM(options)

      this.beforeMount = this.vm.$options.beforeMount || []
      this.mounted = this.vm.$options.mounted || []
      this.beforeUpdate = this.vm.$options.beforeUpdate || []
      this.updated = this.vm.$options.updated || []
      this.beforeDestroy = this.vm.$options.beforeDestroy || []

      this.beforeMount.forEach(v => v.call(this.vm))
    }

    componentDidMount () {
      // triggerDirective(this.newDirectiveData, this.oldDirectiveData, this.vm)
      this.mounted.forEach(v => v.call(this.vm))
    }
    componentWillUpdate () {
      // this.oldDirectiveData = this.newDirectiveData
      // this.newDirectiveData = {}
      this.beforeUpdate.forEach(v => v.call(this.vm))
    }
    componentDidUpdate () {
      // triggerDirective(this.newDirectiveData, this.oldDirectiveData, this.vm)
      this.updated.forEach(v => v.call(this.vm))
    }
    componentWillUnmount () {
      this.beforeDestroy.forEach(v => v.call(this.vm))
    }
    componentWillReceiveProps (nextProps) {
      this.vm._props && Object.assign(this.vm._props, nextProps)
      this.vm.$slots = getSlots(nextProps.children)
    }
    shouldComponentUpdate (nextProps) {
      return isObjectShallowModified(this.props, nextProps)
    }
    render () {
      return render ? render.call(this, this.vm._renderProxy) : null
    }
  }
  ReactVueComponent.childContextTypes = {
    owner: PropTypes.object
  }
  ReactVueComponent.contextTypes = {
    owner: PropTypes.object
  }

  ReactVueComponent.options = options

  return ReactVueComponent
}
