/**
 * Reference to mobx https://github.com/mobxjs/mobx-react/blob/master/src/observer.js
 */

import React from 'react'
import { Watcher } from '../dist/vue.react.js'

export default function observer (componentClass) {
  if (typeof componentClass === 'function' &&
    (!componentClass.prototype || !componentClass.prototype.render) && !componentClass.isReactClass && !React.Component.isPrototypeOf(componentClass)
  ) {
    return observer(class extends React.Component {
      static displayName = componentClass.displayName || componentClass.name;
      static contextTypes = componentClass.contextTypes;
      static propTypes = componentClass.propTypes;
      static defaultProps = componentClass.defaultProps;
      render () {
        return componentClass.call(this, this.props, this.context)
      }
    })
  }

  if (!componentClass) {
    throw new Error("Please pass a valid component to 'observer'")
  }

  const target = componentClass.prototype || componentClass
  mixinLifecycleEvents(target)
  return componentClass
}

function mixinLifecycleEvents (target) {
  for (const key in lifecycleMixin) {
    patch(target, key)
  }
}

const lifecycleMixin = {
  componentWillMount () {
    const cb = this.forceUpdate.bind(this)
    const render = this.render.bind(this)
    const watcher = new Watcher({ _watchers: [] }, render, cb, { lazy: true })
    this.render = watcher.get.bind(watcher)
    watcher.lazy = false
    watcher.run = cb
    this.$vuewatcher = watcher
  },
  componentWillUnmount () {
    this.$vuewatcher.teardown()
  }
}

function patch (target, funcName) {
  const base = target[funcName]
  const mixinFunc = lifecycleMixin[funcName]
  target[funcName] = !base ? function () {
    mixinFunc.apply(this)
  } : function () {
    mixinFunc.apply(this)
    base.apply(this, arguments)
  }
}

