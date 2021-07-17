import { isObject,def} from "../util/index";
import { arrayMethods } from './array.js';
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

     observe(value); // 递归实现深度检测
    Object.defineProperty(data,key,{
        configurable:true,
        enumerable:false,
        get(){ //  获取值的时候做一些操作
            return value;
        },
        set(newValue){ // 也可以做一些操作
           
            if(newValue === value) return;
            observe(newValue); // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象
            console.log('更新数据')
            value = newValue;
        }
    });
}

export function observe(data){
   
     let isObj = isObject(data);
     if(!isObj){
         return
     }
     return new Observer(data);

}