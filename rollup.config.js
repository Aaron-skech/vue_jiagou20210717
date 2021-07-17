import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';

export default{
    input:'./src/index.js',//文件入口
    output:{
        file:'dist/umd/vue.js',
        name:'Vue', 
        format:'umd',//统一的的模块规范
        souermap:true,//开启源码调试
    },
    plugins:[
        babel({
            exclude:'node_modules/**',
        }),
        process.env.ENV === 'development'? serve({
            open:true,
            openPage:'/public/index.html',//默认打开的路径
            port:3000,
            contentBase:''
        }):null
    ]
}