// import _ from 'lodash-es' // ===> 没有构建工具，浏览器找不到路径
// import _ from '../node_modules/lodash-es/lodash.default.js' //====> 没有构建工具只能这么写

// import { sum } from './js/math' // ===> 没有构建工具，浏览器找不到路径
// import { sum } from './js/math.js' //====> 没有构建工具只能这么写

//😊 安装了构建工具 vite 之后
import _ from 'lodash-es'
import { sum } from './js/math' 
import './css/style.css'
import './css/title.less'

console.log('hello word')
console.log(sum(20,30))
console.log(_.join(['abc','cba'], '-'))

// 🧚🏿‍♀️ less
const titleEl = document.createElement('div')
titleEl.className = 'title'
titleEl.innerHTML = 'hello xiang cai'
document.body.appendChild(titleEl)