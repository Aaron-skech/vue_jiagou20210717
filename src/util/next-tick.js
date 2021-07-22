let callbacks = [];

let waiting = false;

function flushCallback() {
    callbacks.forEach(cb=>cb())
    waiting = false;
    callbacks = [];
    
}

export function nextTick(cb) {
    //多次调用nextTick 如果还没有刷新 就把回调函数放到数组中去
    callbacks.push(cb);
    if(waiting === false){
         setTimeout(flushCallback,0)
         waiting = true;
    }
   
 
    
}