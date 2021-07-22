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
   function proxy(vm, source, key) {
     Object.defineProperty(vm, key, {
       get() {
         return vm[source][key];
       },

       set(newValue) {
         vm[source][key] = newValue;
       }

     });
   }
   const LIFECYCLE_HOOKS = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestory', 'destroy'];
   let strats = {};

   function mergeHook(parentVal, childVal) {
     if (childVal) {
       if (parentVal) {
         return parentVal.concat(childVal);
       } else {
         return [childVal];
       }
     } else {
       return parentVal;
     }
   }

   LIFECYCLE_HOOKS.forEach(hook => {
     strats[hook] = mergeHook;
   });
   function mergeOptions(parent, child) {
     // debugger;
     const options = {};

     for (let key in parent) {
       mergeField(key);
     }

     for (let key in child) {
       //如果是已经合并过的就不用再合并了
       if (!parent.hasOwnProperty(key)) {
         mergeField(key);
       }
     } //默认的合并策略 但是有些属性需要特殊的合并方式


     function mergeField(key) {
       if (strats[key]) {
         return options[key] = strats[key](parent[key], child[key]);
       }

       if (typeof parent[key] === 'object' && typeof child[key] === 'object') {
         options[key] = { ...parent[key],
           ...child[key]
         };
       } else if (child[key] == null) {
         options[key] = parent[key];
       } else {
         options[key] = child[key];
       }
     }

     return options;
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

       ob.dep.notify(); //如果调用push方法 我会通知当前的dep去更新

       return result;
     };
   });

   let id$1 = 0;

   class Dep {
     constructor() {
       this.id = id$1++;
       this.subs = [];
     }

     addSub(watcher) {
       this.subs.push(watcher);
     }

     depend() {
       //让这个water记住dep
       //this.subs.push(Dep.target);
       Dep.target.addDep(this);
     }

     notify() {
       this.subs.forEach(watcher => watcher.update());
     }

   }

   let stack = []; //目前可以做到将watcher 保留起来 和移除的功能

   function pushTarget(watcher) {
     Dep.target = watcher;
     stack.push(watcher);
   }
   function popTarget() {
     stack.pop();
     Dep.target = stack[stack.length - 1];
   }

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
       this.dep = new Dep(); //单独给数组用的
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
     let dep = new Dep(); //这个dep 是为了给对象使用的
     // 这个value 可能是数组 也可能是对象 返回的结果是 Observer的实例 即当前value所对应的observer

     let childOb = observe(value); // 递归实现深度检测

     Object.defineProperty(data, key, {
       configurable: true,
       enumerable: true,

       get() {
         //  获取值的时候做一些操作
         console.log('取值'); //每一个属性都对应着一个自己watcher

         if (Dep.target) {
           //取值的时候收集依赖（watcher）
           dep.depend(); //意味着要将watcher存起来

           if (childOb) {
             childOb.dep.depend(); //收集数组的相关依赖
             //如果数组中还有数组

             if (Array.isArray(value)) {
               dependArray(value);
             }
           }
         }

         return value;
       },

       set(newValue) {
         // 也可以做一些操作
         if (newValue === value) return;
         observe(newValue); // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象

         console.log('更新数据');
         value = newValue;
         dep.notify(); //通知依赖的watcher进行一个更新的操作
       }

     });
   }

   function dependArray(value) {
     for (let i = 0; i < value.length; i++) {
       let current = value[i]; //将数组中的每一个都取出来,数据变化后 也去更新视图
       // 数组中的数组的依赖收集

       current.__ob__ && current.__ob__.dep.depend();

       if (Array.isArray(current)) {
         dependArray(current);
       }
     }
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
     data = vm._data = typeof data === 'function' ? data.call(vm) : data; // 为了让用户更好的使用 我希望 可以使用vm.xxx

     for (let key in data) {
       proxy(vm, '_data', key);
     }

     observe(data);
   }

   const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // abc-aaa

   const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // <aaa:asdads>

   const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名

   const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>

   const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的

   const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >  <div>
   function parseHTML(html) {
     let root = null; // ast语法树的树根

     let currentParent; // 标识当前父亲是谁

     let stack = [];
     const ELEMENT_TYPE = 1;
     const TEXT_TYPE = 3;

     function createASTElement(tagName, attrs) {
       return {
         tag: tagName,
         type: ELEMENT_TYPE,
         children: [],
         attrs,
         parent: null
       };
     }

     function start(tagName, attrs) {
       // 遇到开始标签 就创建一个ast元素s
       let element = createASTElement(tagName, attrs);

       if (!root) {
         root = element;
       }

       currentParent = element; // 把当前元素标记成父ast树

       stack.push(element); // 将开始标签存放到栈中
     }

     function chars(text) {
       text = text.replace(/\s/g, '');

       if (text) {
         currentParent.children.push({
           text,
           type: TEXT_TYPE
         });
       }
     }

     function end(tagName) {
       let element = stack.pop(); // 拿到的是ast对象
       // 我要标识当前这个p是属于这个div的儿子的

       currentParent = stack[stack.length - 1];

       if (currentParent) {
         element.parent = currentParent;
         currentParent.children.push(element); // 实现了一个树的父子关系
       }
     } // 不停的去解析html字符串


     while (html) {
       let textEnd = html.indexOf('<');

       if (textEnd == 0) {
         // 如果当前索引为0 肯定是一个标签 开始标签 结束标签
         let startTagMatch = parseStartTag(); // 通过这个方法获取到匹配的结果 tagName,attrs

         if (startTagMatch) {
           start(startTagMatch.tagName, startTagMatch.attrs); // 1解析开始标签

           continue; // 如果开始标签匹配完毕后 继续下一次 匹配
         }

         let endTagMatch = html.match(endTag);

         if (endTagMatch) {
           advance(endTagMatch[0].length);
           end(endTagMatch[1]); // 2解析结束标签

           continue;
         }
       }

       let text;

       if (textEnd >= 0) {
         text = html.substring(0, textEnd);
       }

       if (text) {
         advance(text.length);
         chars(text); // 3解析文本
       }
     }

     function advance(n) {
       html = html.substring(n);
     }

     function parseStartTag() {
       let start = html.match(startTagOpen);

       if (start) {
         const match = {
           tagName: start[1],
           attrs: []
         };
         advance(start[0].length); // 将标签删除

         let end, attr;

         while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
           // 将属性进行解析
           advance(attr[0].length); // 将属性去掉

           match.attrs.push({
             name: attr[1],
             value: attr[3] || attr[4] || attr[5]
           });
         }

         if (end) {
           // 去掉开始标签的 >
           advance(end[0].length);
           return match;
         }
       }
     }

     return root;
   }

   const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

   function genProps(attrs) {
     // 处理属性 拼接成属性的字符串
     let str = '';

     for (let i = 0; i < attrs.length; i++) {
       let attr = attrs[i];

       if (attr.name === 'style') {
         // style="color: red;fontSize:14px" => {style:{color:'red'},id:name,}
         let obj = {};
         attr.value.split(';').forEach(item => {
           let [key, value] = item.split(':');
           obj[key] = value;
         });
         attr.value = obj;
       }

       str += `${attr.name}:${JSON.stringify(attr.value)},`;
     }

     return `{${str.slice(0, -1)}}`;
   }

   function genChildren(el) {
     let children = el.children;

     if (children && children.length > 0) {
       return `${children.map(c => gen(c)).join(',')}`;
     } else {
       return false;
     }
   }

   function gen(node) {
     if (node.type == 1) {
       // 元素标签
       return generate(node);
     } else {
       let text = node.text; //   <div>a {{  name  }} b{{age}} c</div>

       let tokens = [];
       let match, index; // 每次的偏移量 buffer.split()

       let lastIndex = defaultTagRE.lastIndex = 0; // 只要是全局匹配 就需要将lastIndex每次匹配的时候调到0处

       while (match = defaultTagRE.exec(text)) {
         index = match.index;

         if (index > lastIndex) {
           tokens.push(JSON.stringify(text.slice(lastIndex, index)));
         }

         tokens.push(`_s(${match[1].trim()})`);
         lastIndex = index + match[0].length;
       }

       if (lastIndex < text.length) {
         tokens.push(JSON.stringify(text.slice(lastIndex)));
       }

       return `_v(${tokens.join('+')})`;
     }
   }

   function generate(el) {
     // [{name:'id',value:'app'},{}]  {id:app,a:1,b:2}
     let children = genChildren(el);
     let code = `_c("${el.tag}",${el.attrs.length ? genProps(el.attrs) : 'undefined'}${children ? `,${children}` : ''})
    `;
     return code;
   }

   // ast语法树 是用对象来描述原生语法的   虚拟dom 用对象来描述dom节点的
   function compileToFunction(template) {
     // 1) 解析html字符串 将html字符串 => ast语法树
     let root = parseHTML(template); // 需要将ast语法树生成最终的render函数  就是字符串拼接 （模板引擎）

     let code = generate(root); // 核心思路就是将模板转化成 下面这段字符串
     //  <div id="app"><p>hello {{name}}</p> hello</div>
     // 将ast树 再次转化成js的语法
     //  _c("div",{id:app},_c("p",undefined,_v('hello' + _s(name) )),_v('hello')) 
     // 所有的模板引擎实现 都需要new Function + with  都需要function + width
     // vue的render 他返回的是虚拟dom

     let renderFn = new Function(`with(this){ return ${code}}`);
     return renderFn;
   } //   hellpo
   //      <p></p>
   // </div>
   // let root = {
   //     tag:'div',
   //     attrs:[{name:'id',value:'app'}],
   //     parent:null,
   //     type:1,
   //     children:[{
   //         tag:'p',
   //         attrs:[],
   //         parent:root,
   //         type:1,
   //         children:[
   //             {
   //                 text:'hello',
   //                 type:3
   //             }
   //         ]
   //     }]
   // }

   function nextTick(cb) {
     cb();
   }

   let queue = [];
   let has = {};

   function flushSchedularQueue() {
     queue.forEach(watcher => watcher.run());
     queue = [];
     has = {};
   }

   function queueWatcher(watcher) {
     const id = watcher.id;

     if (has[id] == null) {
       queue.push(watcher);
       has[id] = true; //宏认为和微任务 
       // Vue.nextTick = promise / mutationObserver / setImmediate/ setTimeout  优雅降级  

       nextTick(flushSchedularQueue);
     }
   }

   let id = 0;

   class Watcher {
     constructor(vm, exprOrFn, callback, options) {
       this.vm = vm;
       this.exprOrFn = exprOrFn;
       this.callback = callback;
       this.options = options;
       this.id = id++;
       this.getter = exprOrFn; //将内部传过来的回调函数放到getter 属性上

       this.depsId = new Set();
       this.deps = [];
       this.get(); //调用getter方法会让watcher执行
     }

     addDep(dep) {
       //watcher里面不能放重复的dep
       let id = dep.id;

       if (!this.depsId.has(id)) {
         this.depsId.add(id);
         this.deps.push(dep);
         dep.addSub(this);
       }
     }

     get() {
       pushTarget(this); // 在渲染之前watcher存起来

       this.getter(); //渲染watcher的执行

       popTarget(); //渲染之后移除watcher
     }

     update() {
       //等待这 一起来更新 因为每次调用update的时候 都放入了 watcher
       //this.get();
       queueWatcher(this);
     }

     run() {
       this.get();
     }

   }

   function patch(oldVnode, vnode) {
     //递归创建真实的节点 替换老的节点
     //1 判断是要更新 还是渲染
     const isRealElement = oldVnode.nodeType;

     if (isRealElement) {
       const oldElm = oldVnode;
       const parentElm = oldElm.parentNode; //body 需要用父节点进行操作

       let el = createElm(vnode);
       parentElm.insertBefore(el, oldElm.nextSibling);
       parentElm.removeChild(oldElm);
       return el;
     } // 需要将渲染好的结果返回 

   }

   function createElm(vnode) {
     let {
       tag,
       children,
       key,
       data,
       text
     } = vnode; // 是标签 创建标签
     //如果不是标签就是文本

     if (typeof tag === 'string') {
       vnode.el = document.createElement(tag);
       updateProperties(vnode);
       children.forEach(child => {
         return vnode.el.appendChild(createElm(child));
       });
     } else {
       //虚拟dom上面映射着真实dom 方便后续更新操作
       vnode.el = document.createTextNode(text);
     }

     return vnode.el;
   } //更新属性


   function updateProperties(vnode) {
     let newProps = vnode.data || {};
     let el = vnode.el;

     for (let key in newProps) {
       if (key === 'style') {
         for (let styleName in newProps.style) {
           el.style[styleName] = newProps.style[styleName];
         }
       } else if (key === 'class') {
         el.className = newProps.class;
       } else {
         el.setAttribute(key, newProps[key]);
       }
     }
   }

   function lifecycleMixin(Vue) {
     Vue.prototype._update = function (vnode) {
       //要通过虚拟节点 渲染出真是的dom
       const vm = this;
       vm.$el = patch(vm.$el, vnode); // 需要用虚拟节点创建出真实节点 替换掉真是的$el
     };
   }
   function mountComponent(vm, el) {
     vm.$options;
     vm.$el = el; //真实的dom元素
     //渲染页面
     //Watcher 用来渲染的
     // vm._render 通过解析的render方法 渲染出虚拟dom
     //vm.update 通过虚拟dom 创建出真是的dom _c _v _s 

     callHook(vm, 'beforeMount'); //挂载之前调用

     let updateComponent = () => {
       console.log('update'); //无论是渲染还是更新都会调用此方法

       vm._update(vm._render());
     }; //渲染watcher  每一个组件都有一个watcher


     new Watcher(vm, updateComponent, () => {}, true);
     callHook(vm, 'mounted'); //挂载之后调用
   }
   function callHook(vm, hook) {
     const handlers = vm.$options[hook]; //[fn,fn,fn];

     if (handlers) {
       //找到对应的钩子依次执行
       for (let i = 0; i < handlers.length; i++) {
         handlers[i].call(vm);
       }
     }
   }

   function initMixin(Vue) {
     // 初始化流程
     Vue.prototype._init = function (options) {
       // 数据的劫持
       const vm = this; // vue中使用 this.$options 指代的就是用户传递的属性
       //将用户传递的和全局的进行一个合并

       vm.$options = mergeOptions(vm.constructor.options, options);
       callHook(vm, 'beforeCreate'); //初始化状态之前调用
       // 初始化状态

       initState(vm); // 分割代码

       callHook(vm, 'created'); //初始化状态之后调用
       // 如果用户传入了el属性 需要将页面渲染出来
       // 如果用户传入了el 就要实现挂载流程

       if (vm.$options.el) {
         vm.$mount(vm.$options.el);
       }
     };

     Vue.prototype.$mount = function (el) {
       const vm = this;
       const options = vm.$options;
       el = document.querySelector(el); // 默认先会查找有没有render方法，没有render 会 采用template template也没有就用el中的内容

       if (!options.render) {
         // 对模板进行编译
         let template = options.template; // 取出模板

         if (!template && el) {
           template = el.outerHTML;
         }

         const render = compileToFunction(template);
         options.render = render; // 我们需要将template 转化成render方法 vue1.0 2.0虚拟dom 
         //  console.log(render,options.render);
         //渲染当前的组件 挂载当前的组件

         mountComponent(vm, el);
       }
     };
   }

   function createElement(tag, data = {}, ...children) {
     let key = data.key;

     if (key) {
       delete data.key;
     }

     return vnode(tag, data, key, children, undefined);
   }
   function createTextNode(text) {
     return vnode(undefined, undefined, undefined, undefined, text);
   }

   function vnode(tag, data, key, children, text) {
     return {
       tag,
       data,
       key,
       children,
       text
     }; //虚拟节点 就是通过_c _v 实现用对象来描述dom操作 （对象）
     // 1) 将 template 转成 ast语法树 =》 生产render方法 =》 生成虚拟dom =》 真实dom 
     // 重新生成虚拟dom =》 更新dom
   }

   function renderMixin(Vue) {
     //_c 是创建元素的虚拟节点
     //_v 创建文本的虚拟节点
     //_s JSON.stringify
     Vue.prototype._c = function () {
       return createElement(...arguments);
     };

     Vue.prototype._v = function (text) {
       return createTextNode(text);
     };

     Vue.prototype._s = function (val) {
       return val === null ? '' : typeof val === 'object' ? JSON.stringify(val) : val;
     };

     Vue.prototype._render = function () {
       const vm = this;
       const {
         render
       } = this.$options;
       let vnode = render.call(vm);
       return vnode;
     };
   }

   function initGlobalAPI(Vue) {
     Vue.options = {};

     Vue.mixin = function (mixin) {
       //如何实现两个对象的合并
       this.options = mergeOptions(this.options, mixin);
     }; // 生命周期的合并策略[beforeCreate,beforeCreate];


     Vue.mixin({
       b: 3,

       beforeCreate() {
         console.log('fn1');
       }

     });
     Vue.mixin({
       b: 2,

       beforeCreate() {
         console.log('fn2');
       }

     });
   }

   function Vue(options) {
     this._init(options);
   }

   initMixin(Vue);
   renderMixin(Vue);
   lifecycleMixin(Vue); //初始化 全局的api

   initGlobalAPI(Vue);

   return Vue;

})));
//# sourceMappingURL=vue.js.map
