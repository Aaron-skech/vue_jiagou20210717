import { initMixin } from './init.js';
import {renderMixin} from './render.js'
import {lifecycleMixin } from './lifecycle.js';
import { initGlobalAPI } from './initGlobalAPI/index.js'

function Vue(options){
    this._init(options);

}
 
initMixin(Vue);
renderMixin(Vue);
lifecycleMixin(Vue);
//初始化 全局的api

initGlobalAPI(Vue);
export default Vue;