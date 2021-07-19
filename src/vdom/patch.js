export function patch(oldVnode,vnode) {
    console.log(oldVnode,vnode);

    //递归创建真实的节点 替换老的节点
    //1 判断是要更新 还是渲染

    const isRealElement = oldVnode.nodeType;

    if(isRealElement){
        const oldElm = oldVnode;
        const parentElm = oldElm.parentNode;//body 需要用父节点进行操作
        let el = createElm(vnode);
        parentElm.insertBefore(el,oldElm.nextSibling);
        parentElm.removeChild(oldElm);
    }
    
  
}

function  createElm(vnode) {
    let { tag, children, key, data, text} = vnode;
      
    // 是标签 创建标签
    //如果不是标签就是文本

    if(typeof tag ==='string'){
        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach((child)=>{
            return vnode.el.appendChild(createElm(child))
        })

    }else{
        //虚拟dom上面映射着真实dom 方便后续更新操作
        vnode.el = document.createTextNode(text);
    }

     return vnode.el;


}

//更新属性
 
function updateProperties(vnode) {

    let newProps = vnode.data || {};
    let el = vnode.el;
    console.log(newProps,el)
    
}