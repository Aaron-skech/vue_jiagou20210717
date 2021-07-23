import  initMixin  from './mixin.js';
import initAssetRegisters from './initAssetRegisters';
import initExtend from './extend';
import {ASSETS_TYPE }from './const';


export function initGlobalAPI(Vue) {
    Vue.options = {};
    initMixin(Vue)

 //初始化全局过滤器 指令 组件
 ASSETS_TYPE.forEach(type=>{
     Vue.options[type+'s'] = {}
 })
 Vue.options._base = Vue; //_base 是Vue 的构造函数

 initAssetRegisters(Vue);
 //注册Extend方法
 initExtend(Vue);


//  Vue.options.components = {

//  }
//  Vue.options.filters = {
     
// }
//  Vue.options.directives = {
     
// }
  

}