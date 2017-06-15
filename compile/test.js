import {
  bindWebStyle as __react__vue__bindStyle,
  event as __react__vue__event
} from 'react-vue-helper'
import {
  createElement as __react__vue__createElement,
  Component as __react__vue__Component
} from 'react'
export default function render(vm) {
  return __react__vue__createElement(vm.$options.components['ElButton'], [object Object](this.props.__react__vue__nativeEvents, {
    ref: (ref) => {
      this.setRootRef(ref);
      this.props['__react__vue__setRef'] && this.props['__react__vue__setRef'](ref);
    },
    className: (' ' + (this.props.className || '')).trim(),
    style: __react__vue__bindStyle(undefined, undefined, Object.assign({}, undefined, this.props.style)),
    '__react__vue__customEventclick': __react__vue__event(function($event) {
      $event.preventDefault();
      removeDomain(domain)
    }.bind(this))
  }), "删除")
}