import {initState} from './state.js'
export function initMixin(Vue){

    Vue.prototype._init=function(options){
        const vm = this;
        vm.$options = options;
        //初始化状态
        initState(vm);

        //如果用户传入了el属性 需要将



    }
}