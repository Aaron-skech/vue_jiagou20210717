import Watcher from "./observer/watcher";
export function lifecycleMixin(Vue) {

    Vue.prototype._update = function(vnode) {
        console.log(vnode,'vnode')
        
    }
    
}
export  function mountComponent(vm,el){

    const options = vm.$options;

    vm.$el = el;//真是的dom元素
    //渲染页面

    //Watcher 用来渲染的
    // vm._render 通过解析的render方法 渲染出虚拟dom
    //vm.update 通过虚拟dom 创建出真是的dom _c _v _s 

    let updateComponent = ( ) => {
        //无论是渲染还是更新都会调用此方法
        vm._update(vm._render());
    }
    //渲染watcher  每一个组件都有一个watcher

    new Watcher(vm,updateComponent,()=>{},true)

}