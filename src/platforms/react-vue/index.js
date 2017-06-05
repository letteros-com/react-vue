/** @flow */

import Vue from 'core/index'
import observer from './observer'

Vue.observer = observer

const extend = Vue.extend
Vue.extend = c => extend.call(Vue, c.options)

export default Vue
