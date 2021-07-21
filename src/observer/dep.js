let id = 0;
class Dep{
   constructor(){
       this.id = id++;
       this.subs = [];
   }
   addSub(watcher){
       console.log("__________________")
       this.subs.push(watcher);
       console.log(this.subs)
   }
   depend(){
      //让这个water记住dep
    //this.subs.push(Dep.target);
    Dep.target.addDep(this);
       
   }
   notify(){
        this.subs.forEach(watcher=>watcher.update())
   }
}


let stack = [];
//目前可以做到将watcher 保留起来 和移除的功能
export function pushTarget(watcher) {
    console.log(watcher,'watch')
    Dep.target = watcher;
    stack.push(watcher);
}


export function popTarget() {
    stack.pop()
    Dep.target = stack[stack.length-1]
}

export default Dep;