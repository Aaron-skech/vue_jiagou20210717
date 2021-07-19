import { initMixin } from './init.js';
import {renderMixin} from './render.js'
import {lifecycleMixin } from './lifecycle.js'

function Vue(options){
    this._init(options);

}
 
initMixin(Vue);
renderMixin(Vue);
lifecycleMixin(Vue);

export default Vue;