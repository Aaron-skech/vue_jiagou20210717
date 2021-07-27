import { initMixin } from './init.js';
import { renderMixin } from './render.js'
import { lifecycleMixin } from './lifecycle.js';
import { initGlobalAPI } from './initGlobalAPI/index.js'

function Vue(options) {
    this._init(options);

}

initMixin(Vue);
renderMixin(Vue);
lifecycleMixin(Vue);
//初始化 全局的api

initGlobalAPI(Vue);

// demo 产生两个虚拟dom节点进行对比
// template => render 方法 =》 vnode
// import { compileToFunction } from './compiler/index.js';
// import { createElm, patch } from './vdom/patch.js'
// let vm1 = new Vue({
//     data: { name: 'hello' }
// })
// let render1 = compileToFunction(`<div a="1" id="app" style="background:red">
//            <div style="background:red" key="A">A</div>
//            <div  style="background:yellow" key="B">B</div>
//            <div  style="background:blue" key="C">C</div>
//         </div>`)
// let vnode = render1.call(vm1);

// let el = createElm(vnode);
// document.body.appendChild(el);

// let vm2 = new Vue({
//     data: { name: 'aaron', age: 23 }
// })
// let render2 = compileToFunction(`<div b="1" id="aaa" style="color:blue">
//             <div  style="background:green" key="Q">Q</div>
//             <div  style="background:red" key="A">A</div>
//             <div  style="background:yellow" key="F">F</div>
//             <div  style="background:blue" key="C">C</div>
//             <div  style="background:blue" key="N">N</div>   
//           </div>`)
// let newVnode = render2.call(vm2);

//patch(vnode, newVnode);//传入两个虚拟节点 再在内部进行比对

// 1 diff算法的特点是平级对比， 我们正常操作dom元素 很少涉及到父元素变成子元素
//或者子元素变成父元素 

export default Vue;