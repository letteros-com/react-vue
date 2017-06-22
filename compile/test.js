import {
  bindWebStyle as __react__vue__bindStyle,
  event as __react__vue__event,
  _toString as __react__vue__toString
} from 'react-vue-helper'
import {
  createElement as __react__vue__createElement,
  Component as __react__vue__Component
} from 'react'

export default function render(vm) {
  return __react__vue__createElement('div', {
    className: (' ' + (this.props.className || '')).trim(),
    style: __react__vue__bindStyle(undefined, undefined, Object.assign({}, undefined, this.props.style)),
    onClick: __react__vue__event(({
      nativeEvent: $event
    }) => {
      increase($event)
    })
  }, __react__vue__toString(count))
}