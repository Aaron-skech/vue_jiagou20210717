export function patch(oldVnode,vnode) {
     if(!oldVnode){
        //这个是组件的挂载
         let aa = createElm(vnode);
         
         //console.log(aa,'##############################')
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
           // console.log(el,'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
            return el;
        }else{
            //标签不一致直接替换
             if(oldVnode.tag !== vnode.tag){
                 oldVnode.el.parentNode.replaceChild(createElm(vnode),oldVnode.el)
             }
             //如果都是文本
             if(!oldVnode.tag){
                 if(oldVnode.el.textContent = vnode.text){

                 }
             }
             //标签一致 且都不是文本 比对属性是否一致
           let el = vnode.el = oldVnode.el;
           //vnode 是新的虚拟节点
           updateProperties(vnode,oldVnode.data)
           //比对儿子节点
           let oldChildren = oldVnode.children || [];
           let newChildern = vnode.children || [];

           if(oldChildren.length >0 && newChildern.length>0){
               updateChildern(el,oldChildren,newChildern);
               //新老都有儿子
           } else if(newChildern.length > 0){
             
               //新的有孩子 老的没有孩子 直接将虚拟节点转化为真实节点然后出插入
               for(let i=0; i<newChildern.length;i++){
                   let child = newChildern[i];
                       el.appendChild(createElm(child))
                   }
            }else if(oldChildren.length>0){
                   //老的有孩子 新的没有孩子
                   el.innerHTML = '';
               }

           

        }

     }
 
        // 需要将渲染好的结果返回 
}
function isSameVnode(oldVnode,newVnode){

    return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key)
     
}
function updateChildern(parent,oldChildren,newChildern){
    //vue采用双指针的方式进行比对
    //vue在内部比对的过程中做了很多优化策略
     
    let oldStartIndex = 0;
    let oldStartVnode = oldChildren[0];
    let oldEndIndex = oldChildren.length -1;
    let oldEndVnode = oldChildren[oldEndIndex];

    let newStartIndex = 0;
    let newStartVnode = newChildern[0];
    let newEndIndex = newChildern.length -1;
    let newEndVnode = newChildern[newEndIndex];

    const makeIndexByKey = (children)=>{
        let map = {};
        children.forEach((item,index)=>{
            if(item.key){
                map[item.key] = index;//根据key创建一个映射表
            }
        })
        return map;
    }

    let map = makeIndexByKey(oldChildren);
    console.log(map,'map')
    
    //在比对的过程中 新老节点有一方循环完毕就结束
    while(newStartIndex<= newEndIndex && oldStartIndex<= oldEndIndex){
        if(!oldStartVnode){
            //在老指针移动的过程中可能会遇到undefind
            oldStartVnode = oldChildren[++oldStartIndex];
        }else if(!oldEndVnode){
            oldEndVnode = oldChildren[--oldEndIndex];
        }else if(isSameVnode(oldStartVnode,newStartVnode)){
                //如果是同一个节点 就需要比对 元素的差异
              patch(oldStartVnode,newStartVnode);//比对开头节点
              oldStartVnode = oldChildren[++oldStartIndex];
              newStartVnode = newChildern[++newStartIndex];
            
          }else if(isSameVnode(oldEndVnode,newEndVnode)){
              //优化向前插入的情况
              patch(oldEndVnode,newEndVnode);
              oldEndVnode = oldChildren[--oldEndIndex];
              newEndVnode = newChildern[--newEndIndex];

          }else if(isSameVnode(oldStartVnode,newEndVnode)){
               //头移尾操作 (涉及到 倒序变正序)
               patch(oldStartVnode,newEndVnode);
               parent.insertBefore(oldStartVnode.el,oldEndVnode.el.nextSibling);
               oldStartVnode = oldChildren[++oldStartIndex];
               newEndVnode = newChildern[--newEndIndex];
          }else if(isSameVnode(oldEndVnode,newStartVnode)){
              console.log(oldEndVnode,newStartVnode,parent)
               patch(oldEndVnode,newStartVnode);
               parent.insertBefore(oldEndVnode.el,oldStartVnode.el)
               oldEndVnode = oldChildren[--oldEndIndex];
               newStartVnode =  newChildern[++newStartIndex]
          }else{
              //暴力比对 乱序
              // 先根据老节点的key 做一个映射表 拿新的虚拟节点去映射表中去找 如果可查找到 则进行移动操作（移到头指针的前面位置）如果找不到
              //则将元素插入即可
              let moveIndex = map[newStartVnode.key];
              if(!moveIndex){//不需要复用
                parent.insertBefore(createElm(newStartVnode),oldStartVnode.el)
              }else{
                  //如果在映射表中查找到了 则直接将元素移走 并置为空
                let moveVnode = oldChildren[moveIndex];//我要移动的那个元素
                oldChildren[moveIndex]=undefined;
                parent.insertBefore(moveVnode.el,oldStartVnode.el)
                patch(moveVnode,newStartVnode)      
              }
              newStartVnode = newChildern[++newStartIndex]

          }
         

    }
          if(newStartIndex <= newEndIndex){
              for(let i = newStartIndex; i<=newEndIndex; i++){
                  //将新增的元素直接进行插入 (可能从后插入 也可能从前插入) insertBefore
                  let el = newChildern[newEndIndex +1] == null ? null : newChildern[newEndIndex +1].el;
                 parent.insertBefore(createElm(newChildern[i]),el);
              }
          }
          console.log(oldStartIndex,oldEndIndex)
          if(oldStartIndex<=oldEndIndex){
              //老的开始和老的结束之间有元素 则将其删掉
              for(let i=oldStartIndex; i<= oldEndIndex;i++){
                  let child = oldChildren[i];
                  if(child != undefined){
                      parent.removeChild(child.el)
                  }
              }
          }

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
export function  createElm(vnode) {
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
            return vnode.el.appendChild(createElm(child))
        })

    }else{
        //虚拟dom上面映射着真实dom 方便后续更新操作
        vnode.el = document.createTextNode(text);
    }
     return vnode.el;


}

//更新属性
 
function updateProperties(vnode,oldProps={}) {

    let newProps = vnode.data || {};
    let el = vnode.el;
    //如果老的属性中有 新的属性中没有 则在真实的dom上 将这个属性删掉

    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};

    for(let key in oldStyle){
        if(!newStyle[key]){
            el.style[key]="";
        }

    }

    for(let key in oldProps){
        if(!newProps[key]){
            el.removeAttribute(key)
        }

    }

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