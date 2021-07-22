import { isObject,def} from "../util/index";
import { arrayMethods } from './array.js';
import Dep from "./dep";
class Observer{
    // constructor(value){  // 仅仅是初始化的操作
    //     // vue如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法
    //     // value.__ob__ = this; // 我给每一个监控过的对象都增加一个__ob__属性
    //     def(value,'__ob__',this);
    //     if(Array.isArray(value)){
    //         // 如果是数组的话并不会对索引进行观测 因为会导致性能问题
    //         // 前端开发中很少很少 去操作索引 push shift unshift 
    //         value.__proto__ = arrayMethods;
    //         // 如果数组里放的是对象我再监控
    //         this.observerArray(value);
    //     }else{
    //          // 对数组监控
    //         this.walk(value); // 对对象进行观测
    //     }
    // }
    // observerArray(value){ // [{}]
    //     for(let i = 0; i < value.length;i++){
    //         observe(value[i]);
    //     }
    // }
      constructor(value){
          
          this.dep = new Dep();//单独给数组用的
          //value.__ob__ = this;//我给每一个监控的对象都增加一个__ob__属性
           def(value,'__ob__',this)
          if(Array.isArray(value)){
              //如果是数组的话 并不会对索引进行观测 因为会导致性能问题
              // 前端开发中很少取操作索引 可以用 push shift unshift
              // 如果数组里面放的是对象 我再进行监控
              this.observerArray(value);
          }else{
              this.walk(value);
          }
      }
    observerArray(value){
        value.__proto__ = arrayMethods;
        for(let i=0; i<value.length; i++){
            observe(value[i]);
        }
    }
    walk(data){
        let keys = Object.keys(data); // [name,age,address]
        // 如果这个data 不可配置 直接reurn
        keys.forEach((key)=>{
            defineReactive(data,key,data[key]);
        });
    }
}


function defineReactive(data,key,value){
       let dep = new Dep() //这个dep 是为了给对象使用的
       // 这个value 可能是数组 也可能是对象 返回的结果是 Observer的实例 即当前value所对应的observer
      let childOb = observe(value); // 递归实现深度检测
    Object.defineProperty(data,key,{
        configurable:true,
        enumerable:true,
        get(){ //  获取值的时候做一些操作
            console.log('取值')//每一个属性都对应着一个自己watcher
            if(Dep.target){
                //取值的时候收集依赖（watcher）
                dep.depend()//意味着要将watcher存起来
                if(childOb){
                    childOb.dep.depend(); //收集数组的相关依赖
                    //如果数组中还有数组
                    if(Array.isArray(value)){
                        dependArray(value);
                    }
                }
            }
            return value;
        },
        set(newValue){ // 也可以做一些操作
            if(newValue === value) return;
            observe(newValue); // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象
            console.log('更新数据');
            value = newValue;
            dep.notify();//通知依赖的watcher进行一个更新的操作
        }
    });
}

function dependArray(value) {
    for( let i = 0; i<value.length;i++){
        let current = value[i];//将数组中的每一个都取出来,数据变化后 也去更新视图
       // 数组中的数组的依赖收集
        current.__ob__&&current.__ob__.dep.depend();
        if(Array.isArray(current)){
            dependArray(current);
        }
    }
    
}
export function observe(data){
   
     let isObj = isObject(data);
     if(!isObj){
         return
     }
     return new Observer(data);

}