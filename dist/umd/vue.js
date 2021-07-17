(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    function isObject(data) {
      return typeof data === 'object' && data !== null;
    }
    function def(data, key, value) {
      Object.defineProperty(data, key, {
        enumerable: false,
        configurable: false,
        value: value
      });
    }

    //我要重写数组的哪些方法 7个 push shift unshif pop reverse sort splice  
    let oldArraymethods = Array.prototype; // value.__proto__ = arrayMethods; 向上查找 先查找自己重写的方法 如果没有就会查找 arrayMethods原型上的方法

    let arrayMethods = Object.create(oldArraymethods);
    const methods = ['push', 'shift', 'unshift', 'pop', 'sort', 'splice', 'reverse'];
    methods.forEach(methods => {
      arrayMethods[methods] = function (...args) {
        console.log('用户调用了push方法'); //AOP 切片编程

        const result = oldArraymethods[methods].apply(this, args); // 调用原生的数组方法
        // push unshift 添加的元素可能还是一个对象

        let inserted; //当前用户插入的元素

        let ob = this.__ob__;

        switch (methods) {
          case 'push':
          case 'unshift':
            inserted = args;
            break;

          case 'splice':
            // 3个参数
            inserted = args.slice(2); //第三个参数 新增的数据

            break;
        }

        if (inserted) {
          ob.observerArray(inserted); //将新增的数据继续进行观测
        }

        return result;
      };
    });

    class Observer {
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
      constructor(value) {
        //value.__ob__ = this;//我给每一个监控的对象都增加一个__ob__属性
        def(value, '__ob__', this);

        if (Array.isArray(value)) {
          //如果是数组的话 并不会对索引进行观测 因为会导致性能问题
          // 前端开发中很少取操作索引 可以用 push shift unshift
          // 如果数组里面放的是对象 我再进行监控
          this.observerArray(value);
        } else {
          this.walk(value);
        }
      }

      observerArray(value) {
        value.__proto__ = arrayMethods;

        for (let i = 0; i < value.length; i++) {
          observe(value[i]);
        }
      }

      walk(data) {
        let keys = Object.keys(data); // [name,age,address]
        // 如果这个data 不可配置 直接reurn

        keys.forEach(key => {
          defineReactive(data, key, data[key]);
        });
      }

    }

    function defineReactive(data, key, value) {
      observe(value); // 递归实现深度检测

      Object.defineProperty(data, key, {
        configurable: true,
        enumerable: false,

        get() {
          //  获取值的时候做一些操作
          return value;
        },

        set(newValue) {
          // 也可以做一些操作
          if (newValue === value) return;
          observe(newValue); // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象

          console.log('更新数据');
          value = newValue;
        }

      });
    }

    function observe(data) {
      let isObj = isObject(data);

      if (!isObj) {
        return;
      }

      return new Observer(data);
    }

    function initState(vm) {
      const opts = vm.$options;

      if (opts.props) ;

      if (opts.data) {
        initData(vm);
      }

      if (opts.methods) ;

      if (opts.computed) ;

      if (opts.watch) ;
    }

    function initData(vm) {
      let data = vm.$options.data;
      data = vm._data = typeof data === 'function' ? data.call(vm) : data;
      observe(data);
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options; //初始化状态

        initState(vm); //如果用户传入了el属性 需要将
      };
    }

    function Vue(options) {
      this._init(options);
    }

    initMixin(Vue);

    return Vue;

})));
