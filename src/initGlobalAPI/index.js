import  initMixin  from './mixin.js';
import { mergeOptions } from '../util/index.js'

export function initGlobalAPI(Vue) {
    Vue.options = {};
    initMixin(Vue)
  

}