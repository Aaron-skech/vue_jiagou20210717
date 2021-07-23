import {ASSETS_TYPE }from './const'

export default function initAssetRegisters(Vue) {
     ASSETS_TYPE.forEach(type=>{
         Vue[type] = function (id,definiton) {
              if(type === 'component'){
                  //注册全局组件
                  definiton = this.options._base.extend(definiton);

              }else if(type === 'filter'){

              }else if(type === 'directive'){

              }
              this.options[type+'s'][id]=definiton;
             
         }
     })
    
}