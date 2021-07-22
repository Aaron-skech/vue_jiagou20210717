//我要重写数组的哪些方法 7个 push shift unshif pop reverse sort splice  

let oldArraymethods = Array.prototype;
// value.__proto__ = arrayMethods; 向上查找 先查找自己重写的方法 如果没有就会查找 arrayMethods原型上的方法

export let arrayMethods = Object.create(oldArraymethods);

const methods =[
    'push',
    'shift',
    'unshift',
    'pop',
    'sort',
    'splice',
    'reverse'
];
methods.forEach(methods=>{
    arrayMethods[methods] = function(...args){
        console.log('用户调用了push方法')//AOP 切片编程
           const result =  oldArraymethods[methods].apply(this,args);// 调用原生的数组方法
            // push unshift 添加的元素可能还是一个对象
            let  inserted;  //当前用户插入的元素
            let  ob = this.__ob__;
            switch(methods){
                case 'push':
                case 'unshift':
                    inserted = args
                    break;
                case 'splice':  // 3个参数
                     inserted = args.slice(2)//第三个参数 新增的数据
                    break;
                    default:
                     break
            };
            if(inserted){
                ob.observerArray(inserted)//将新增的数据继续进行观测
            }
            ob.dep.notify();//如果调用push方法 我会通知当前的dep去更新
           return result;
    }
})