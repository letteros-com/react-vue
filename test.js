import {
  createElement as __react__vue__createElement,
  Component as __react__vue__Component
} from 'react'
export default function render(vm) {
  return __react__vue__createElement(vm.$options.components['ElSlider'], {
    'step': 10,
    'showStops': true
  })
}