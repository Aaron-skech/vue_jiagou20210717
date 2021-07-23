import { mergeOptions } from "../util/index";
export default function initExtend(Vue) {
     //为什么要有子类和父类 new Vue (Vue的构造函数)
     //创建子类 继承父类 扩展的时候扩展到自己的属性上
     let cid = 0;

    Vue.extend = function (extendOptions) {
        console.log(extendOptions,'extendOptions')
        const Sub = function  VueComponent(options) {
            this._init(options); 
        }
        Sub.cid = cid++;
        Sub.prototype = Object.create(this.prototype);
        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(
            this.options,
            extendOptions
        )
        return Sub;
    }
    
}