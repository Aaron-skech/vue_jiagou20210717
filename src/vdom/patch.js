export function patch(oldVnode,vnode) {
     if(!oldVnode){
        //这个是组件的挂载
         let aa = createElm(vnode);
         
         console.log(aa,'##############################')
         return aa;

     }else{
            //递归创建真实的节点 替换老的节点
    //1 判断是要更新 还是渲染
        const isRealElement = oldVnode.nodeType;
        if(isRealElement){
            const oldElm = oldVnode;
            const parentElm = oldElm.parentNode;//body 需要用父节点进行操作
            let el = createElm(vnode);
            parentElm.insertBefore(el,oldElm.nextSibling);
            parentElm.removeChild(oldElm);
            console.log(el,'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
            return el;
        }

     }
 
        // 需要将渲染好的结果返回 
}
function createComponent(vnode){
   let i =  vnode.data;
   if((i= i.hook)&&(i=i.init)){
       i(vnode);
   }
    if(vnode.componentInstance){//标识是组件
        return true;
    }

}
function  createElm(vnode) {
    let { tag, children, key, data, text} = vnode;
      
    // 是标签 创建标签
    //如果不是标签就是文本

    if(typeof tag ==='string'){
        if(createComponent(vnode)){
            //应该是返回的是真实的dom
            return vnode.componentInstance.$el; 
        }
        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach((child)=>{
                   // let aa == 
            return `vnode`.el.appendChild(createElm(child))
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
    for(let key in newProps){
        if(key === 'style'){
            for(let styleName in newProps.style){
                el.style[styleName] = newProps.style[styleName];
            }
        }else if(key === 'class'){
            el.className = newProps.class;
        }else{
            el.setAttribute(key,newProps[key]);
        }
    } 
}