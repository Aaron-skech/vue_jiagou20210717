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

   function mergeAssets(parentVal, childVal) {
     const res = Object.create(parentVal);

     if (childVal) {
       for (let key in childVal) {
         res[key] = childVal[key];
       }
     }

     return res;
   }

   strats.components = mergeAssets;
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
   const isReservedTag = tagName => {
     let str = 'p,div,span,input,button,form';
     let obj = {};
     str.split(',').forEach(tag => {
       obj[tag] = true;
     });
     return obj[tagName];
   };

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

   let callbacks = [];
   let waiting = false;

   function flushCallback() {
     callbacks.forEach(cb => cb());
     waiting = false;
     callbacks = [];
   }

   function nextTick(cb) {
     //多次调用nextTick 如果还没有刷新 就把回调函数放到数组中去
     callbacks.push(cb);

     if (waiting === false) {
       setTimeout(flushCallback, 0);
       waiting = true;
     }
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
     if (!oldVnode) {
       //这个是组件的挂载
       let aa = createElm(vnode); //console.log(aa,'##############################')

       return aa;
     } else {
       //递归创建真实的节点 替换老的节点
       //1 判断是要更新 还是渲染
       const isRealElement = oldVnode.nodeType;

       if (isRealElement) {
         const oldElm = oldVnode;
         const parentElm = oldElm.parentNode; //body 需要用父节点进行操作

         let el = createElm(vnode);
         parentElm.insertBefore(el, oldElm.nextSibling);
         parentElm.removeChild(oldElm); // console.log(el,'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')

         return el;
       } else {
         //标签不一致直接替换
         if (oldVnode.tag !== vnode.tag) {
           oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
         } //如果都是文本


         if (!oldVnode.tag) {
           if (oldVnode.el.textContent = vnode.text) ;
         } //标签一致 且都不是文本 比对属性是否一致


         let el = vnode.el = oldVnode.el; //vnode 是新的虚拟节点

         updateProperties(vnode, oldVnode.data); //比对儿子节点

         let oldChildren = oldVnode.children || [];
         let newChildern = vnode.children || [];

         if (oldChildren.length > 0 && newChildern.length > 0) {
           updateChildern(el, oldChildren, newChildern); //新老都有儿子
         } else if (newChildern.length > 0) {
           //新的有孩子 老的没有孩子 直接将虚拟节点转化为真实节点然后出插入
           for (let i = 0; i < newChildern.length; i++) {
             let child = newChildern[i];
             el.appendChild(createElm(child));
           }
         } else if (oldChildren.length > 0) {
           //老的有孩子 新的没有孩子
           el.innerHTML = '';
         }
       }
     } // 需要将渲染好的结果返回 

   }

   function isSameVnode(oldVnode, newVnode) {
     return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
   }

   function updateChildern(parent, oldChildren, newChildern) {
     //vue采用双指针的方式进行比对
     //vue在内部比对的过程中做了很多优化策略
     let oldStartIndex = 0;
     let oldStartVnode = oldChildren[0];
     let oldEndIndex = oldChildren.length - 1;
     let oldEndVnode = oldChildren[oldEndIndex];
     let newStartIndex = 0;
     let newStartVnode = newChildern[0];
     let newEndIndex = newChildern.length - 1;
     let newEndVnode = newChildern[newEndIndex];

     const makeIndexByKey = children => {
       let map = {};
       children.forEach((item, index) => {
         if (item.key) {
           map[item.key] = index; //根据key创建一个映射表
         }
       });
       return map;
     };

     let map = makeIndexByKey(oldChildren);
     console.log(map, 'map'); //在比对的过程中 新老节点有一方循环完毕就结束

     while (newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
       if (!oldStartVnode) {
         //在老指针移动的过程中可能会遇到undefind
         oldStartVnode = oldChildren[++oldStartIndex];
       } else if (!oldEndVnode) {
         oldEndVnode = oldChildren[--oldEndIndex];
       } else if (isSameVnode(oldStartVnode, newStartVnode)) {
         //如果是同一个节点 就需要比对 元素的差异
         patch(oldStartVnode, newStartVnode); //比对开头节点

         oldStartVnode = oldChildren[++oldStartIndex];
         newStartVnode = newChildern[++newStartIndex];
       } else if (isSameVnode(oldEndVnode, newEndVnode)) {
         //优化向前插入的情况
         patch(oldEndVnode, newEndVnode);
         oldEndVnode = oldChildren[--oldEndIndex];
         newEndVnode = newChildern[--newEndIndex];
       } else if (isSameVnode(oldStartVnode, newEndVnode)) {
         //头移尾操作 (涉及到 倒序变正序)
         patch(oldStartVnode, newEndVnode);
         parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
         oldStartVnode = oldChildren[++oldStartIndex];
         newEndVnode = newChildern[--newEndIndex];
       } else if (isSameVnode(oldEndVnode, newStartVnode)) {
         console.log(oldEndVnode, newStartVnode, parent);
         patch(oldEndVnode, newStartVnode);
         parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
         oldEndVnode = oldChildren[--oldEndIndex];
         newStartVnode = newChildern[++newStartIndex];
       } else {
         //暴力比对 乱序
         // 先根据老节点的key 做一个映射表 拿新的虚拟节点去映射表中去找 如果可查找到 则进行移动操作（移到头指针的前面位置）如果找不到
         //则将元素插入即可
         let moveIndex = map[newStartVnode.key];

         if (!moveIndex) {
           //不需要复用
           parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
         } else {
           //如果在映射表中查找到了 则直接将元素移走 并置为空
           let moveVnode = oldChildren[moveIndex]; //我要移动的那个元素

           oldChildren[moveIndex] = undefined;
           parent.insertBefore(moveVnode.el, oldStartVnode.el);
           patch(moveVnode, newStartVnode);
         }

         newStartVnode = newChildern[++newStartIndex];
       }
     }

     if (newStartIndex <= newEndIndex) {
       for (let i = newStartIndex; i <= newEndIndex; i++) {
         //将新增的元素直接进行插入 (可能从后插入 也可能从前插入) insertBefore
         let el = newChildern[newEndIndex + 1] == null ? null : newChildern[newEndIndex + 1].el;
         parent.insertBefore(createElm(newChildern[i]), el);
       }
     }

     console.log(oldStartIndex, oldEndIndex);

     if (oldStartIndex <= oldEndIndex) {
       //老的开始和老的结束之间有元素 则将其删掉
       for (let i = oldStartIndex; i <= oldEndIndex; i++) {
         let child = oldChildren[i];

         if (child != undefined) {
           parent.removeChild(child.el);
         }
       }
     }
   }

   function createComponent$1(vnode) {
     let i = vnode.data;

     if ((i = i.hook) && (i = i.init)) {
       i(vnode);
     }

     if (vnode.componentInstance) {
       //标识是组件
       return true;
     }
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
       if (createComponent$1(vnode)) {
         //应该是返回的是真实的dom
         return vnode.componentInstance.$el;
       }

       vnode.el = document.createElement(tag);
       updateProperties(vnode);
       children.forEach(child => {
         // let aa == 
         return vnode.el.appendChild(createElm(child));
       });
     } else {
       //虚拟dom上面映射着真实dom 方便后续更新操作
       vnode.el = document.createTextNode(text);
     }

     return vnode.el;
   } //更新属性

   function updateProperties(vnode, oldProps = {}) {
     let newProps = vnode.data || {};
     let el = vnode.el; //如果老的属性中有 新的属性中没有 则在真实的dom上 将这个属性删掉

     let newStyle = newProps.style || {};
     let oldStyle = oldProps.style || {};

     for (let key in oldStyle) {
       if (!newStyle[key]) {
         el.style[key] = "";
       }
     }

     for (let key in oldProps) {
       if (!newProps[key]) {
         el.removeAttribute(key);
       }
     }

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
       const vm = this; // vm.$el = patch(vm.$el,vnode);// 需要用虚拟节点创建出真实节点 替换掉真是的$el

       const preVnode = vm._vnode; //将虚拟节点的内容保存在_vnode上
       //第一次的默认渲染不需要diff算法

       vnode._vnode = vnode; //真实渲染 的内容

       if (!preVnode) {
         vm.$el = patch(vm.$el, vnode);
       } else {
         vm.$el = patch(preVnode, vnode);
       }
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
       //无论是渲染还是更新都会调用此方法
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

   function initMixin$1(Vue) {
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

         console.log(vm, el);
         mountComponent(vm, el);
       }
     }; //用户调用的nextTick


     Vue.prototype.$nextTick = nextTick;
   }

   function createElement(vm, tag, data = {}, ...children) {
     let key = data.key;

     if (key) {
       delete data.key;
     } //判断是标签还是组件


     if (isReservedTag(tag)) {
       return vnode(tag, data, key, children, undefined);
     } else {
       //组件 找到组件的定义
       let Ctor = vm.$options.components[tag];
       return createComponent(vm, tag, data, key, children, Ctor);
     }
   }

   function createComponent(vm, tag, data, key, children, Ctor) {
     if (isObject(Ctor)) {
       Ctor = vm.$options._base.extend(Ctor);
     }

     data.hook = {
       init(vnode) {
         //当前的组件实例就是
         let child = vnode.componentInstance = new Ctor({
           _isComponent: true
         }); //组件的挂载

         child.$mount();
       }

     };
     return vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, undefined, {
       Ctor,
       children
     });
   }

   function createTextNode(vm, text) {
     return vnode(undefined, undefined, undefined, undefined, text);
   }

   function vnode(tag, data, key, children, text, componentOptions) {
     return {
       tag,
       data,
       key,
       children,
       text,
       componentOptions
     }; //虚拟节点 就是通过_c _v 实现用对象来描述dom操作 （对象）
     // 1) 将 template 转成 ast语法树 =》 生产render方法 =》 生成虚拟dom =》 真实dom 
     // 重新生成虚拟dom =》 更新dom
   }

   function renderMixin(Vue) {
     //_c 是创建元素的虚拟节点
     //_v 创建文本的虚拟节点
     //_s JSON.stringify
     Vue.prototype._c = function () {
       return createElement(this, ...arguments);
     };

     Vue.prototype._v = function (text) {
       return createTextNode(this, text);
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

   function initMixin(Vue) {
     Vue.mixin = function (mixin) {
       //如何实现两个对象的合并
       this.options = mergeOptions(this.options, mixin);
     }; // 生命周期的合并策略[beforeCreate,beforeCreate];

   }

   const ASSETS_TYPE = ['component', 'directive', 'filter'];

   function initAssetRegisters(Vue) {
     ASSETS_TYPE.forEach(type => {
       Vue[type] = function (id, definiton) {
         if (type === 'component') {
           //注册全局组件
           definiton = this.options._base.extend(definiton);
         }

         this.options[type + 's'][id] = definiton;
       };
     });
   }

   function initExtend(Vue) {
     //为什么要有子类和父类 new Vue (Vue的构造函数)
     //创建子类 继承父类 扩展的时候扩展到自己的属性上
     let cid = 0;

     Vue.extend = function (extendOptions) {
       const Sub = function VueComponent(options) {
         this._init(options);
       };

       Sub.cid = cid++;
       Sub.prototype = Object.create(this.prototype);
       Sub.prototype.constructor = Sub;
       Sub.options = mergeOptions(this.options, extendOptions);
       return Sub;
     };
   }

   function initGlobalAPI(Vue) {
     Vue.options = {};
     initMixin(Vue); //初始化全局过滤器 指令 组件

     ASSETS_TYPE.forEach(type => {
       Vue.options[type + 's'] = {};
     });
     Vue.options._base = Vue; //_base 是Vue 的构造函数

     initAssetRegisters(Vue); //注册Extend方法

     initExtend(Vue); //  Vue.options.components = {
     //  }
     //  Vue.options.filters = {
     // }
     //  Vue.options.directives = {
     // }
   }

   function Vue(options) {
     this._init(options);
   }

   initMixin$1(Vue);
   renderMixin(Vue);
   lifecycleMixin(Vue); //初始化 全局的api

   initGlobalAPI(Vue); // demo 产生两个虚拟dom节点进行对比

   return Vue;

})));
//# sourceMappingURL=vue.js.map
