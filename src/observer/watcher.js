import {pushTarget,popTarget} from './dep.js';
import {queueWatcher} from './schedular.js'
let id = 0;
class Watcher{
    constructor(vm,exprOrFn,callback,options){
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.callback = callback;
        this.options = options;
        this.id = id++;
        this.getter = exprOrFn; //将内部传过来的回调函数放到getter 属性上
        this.depsId = new Set();
        this.deps=[];
        this.get();//调用getter方法会让watcher执行


    }
    addDep(dep){//watcher里面不能放重复的dep
        let id = dep.id;
        if(!this.depsId.has(id)){
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }

    }
    get(){
        pushTarget(this);// 在渲染之前watcher存起来
        this.getter()//渲染watcher的执行
        popTarget();//渲染之后移除watcher
    }
    update(){
        //等待这 一起来更新 因为每次调用update的时候 都放入了 watcher
        //this.get();

        queueWatcher(this);
    }
    run(){
        this.get();
    }

}

export default Watcher;