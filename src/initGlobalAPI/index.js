import { mergeOptions } from '../util/index.js'

export function initGlobalAPI(Vue) {
    Vue.options = {};
    Vue.mixin = function (mixin) {
        //如何实现两个对象的合并
        this.options = mergeOptions(this.options,mixin)
        
    }
    // 生命周期的合并策略[beforeCreate,beforeCreate];

    Vue.mixin({
        b:3,
        beforeCreate(){
            console.log('fn1')

        }
    })
    Vue.mixin({
        b:2,
        beforeCreate(){
            console.log('fn2')

        }
    })
}