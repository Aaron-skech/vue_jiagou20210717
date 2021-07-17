import { observe } from './observer/index'
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
     
    observe(data)
    
}
function initMethod(){
    
}
function initComputed(){
    
}
function initWatch(){
    
}