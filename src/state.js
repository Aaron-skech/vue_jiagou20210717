import { observe } from './observer/index';
import { proxy } from './util/index'
export function initState(vm){

    const opts = vm.$options;
    if(opts.props){
         initProps(vm);
    };
    if(opts.data){
         initData(vm);
    };
    if(opts.methods){
         initMethod(vm);
    };
    if(opts.computed){
         initComputed(vm);
    };
    if(opts.watch){
         initWatch(vm);
    };

}

function initProps(){

}

function initData(vm){
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm):data;
    // 为了让用户更好的使用 我希望 可以使用vm.xxx

    for(let key in data){
         proxy(vm,'_data',key)
    }
     
    observe(data)
    
}
function initMethod(){
    
}
function initComputed(){
    
}
function initWatch(){
    
}