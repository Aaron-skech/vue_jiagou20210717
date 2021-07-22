let callbacks = [];

function flushCallback() {
    callbacks.forEach(cb=>cb())
    
}

export function nextTick(cb) {
    callbacks.push(cb);
    setTimeout(flushCallback,0)
 
    
}