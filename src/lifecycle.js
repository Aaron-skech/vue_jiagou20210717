import Watcher from "./observer/watcher";
import { patch } from './vdom/patch';
export function lifecycleMixin(Vue) {

    Vue.prototype._update = function(vnode) {
        //要通过虚拟节点 渲染出真是的dom
        const vm = this;
        // vm.$el = patch(vm.$el,vnode);// 需要用虚拟节点创建出真实节点 替换掉真是的$el
        const preVnode = vm._vnode;//将虚拟节点的内容保存在_vnode上
        //第一次的默认渲染不需要diff算法
        vnode._vnode = vnode;//真实渲染 的内容
        if(!preVnode){
            vm.$el = patch(vm.$el,vnode)
        }else{
            vm.$el = patch(preVnode,vnode)
        }

        
    }
    
}
export  function mountComponent(vm,el){

    const options = vm.$options;

    vm.$el = el;//真实的dom元素
    //渲染页面

    //Watcher 用来渲染的
    // vm._render 通过解析的render方法 渲染出虚拟dom
    //vm.update 通过虚拟dom 创建出真是的dom _c _v _s 
    callHook(vm,'beforeMount');//挂载之前调用
    let updateComponent = () => {
        //无论是渲染还是更新都会调用此方法
        vm._update(vm._render());
    }
    //渲染watcher  每一个组件都有一个watcher

    new Watcher(vm,updateComponent,()=>{},true)
    callHook(vm,'mounted');//挂载之后调用

}
export function callHook(vm,hook) {
    const handlers = vm.$options[hook];//[fn,fn,fn];
    if(handlers){ //找到对应的钩子依次执行
        for(let i=0;i<handlers.length;i++){
            handlers[i].call(vm);
        }
    }
    
}