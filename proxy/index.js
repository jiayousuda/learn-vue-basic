// vue2的响应式原理

// 以属性name为例
// data(){
//    return {  name: ‘标题’,  }
// }
// Vue将遍历return 出来的对象  {  name: ‘标题’,  }
// 使用Object.defineProperty 将 对象 转换成 一个个 getter/setter 



// 当 data.name时 —— 触发getter
// 开始收集依赖，收集的依赖是一个个实例化对象（dep类）: 


// const nameDep = new Dep()

// name —> nameDep实例对象 — 实例对象携带通知的方法以及依赖的数据
// nameDep:{
//     subs: [nameNode1, nameNode2], // 所有能访问到name的地方进行标记
//     notify(){
//         nameNode1.update…
//         nameNode2.update…
//     }
// }
// Dep类
// class Dep{
    // constructor(){    this.subs = [] },
//   addSups(watcher){
//     This.subs.push(watcher) 
//   }
//   notify(){
//     This.subs.forEach(item => {
//        Item.updata() //派发更新事件
//     })
//   }
// }



// 当 data.name = ‘1’时 ——- 触发setter

// 在触发setter时，会触发name的 nameDep对象 的 notify函数  进行派发更新事件，来实现响应式。

// Vue3的响应式原理

// vue3中，data选项中 返回的 普通js 对象 还是 composition Api 使用reactive创建的对象 都将被包裹在  一个带有get、set 处理程序的 Proxy中。

// Proxy是什么？

// 它用于创建一个对象代理，从而实现基本操作的拦截和自定义（如属性查找属性、更改属性等）
// 其基础语法类似于:
// const p = new Proxy(target, handler)

// 😊 基础用法

// let data = { foo: 'foo' }
// let p = new Proxy(data, {
//     get(target, key, receiver) {
//           console.log('get--->',receiver)  // 已经被代理过的对象
//           return target[key]
//     },
//     set(target, key, value, receiver) {
//          console.log('set value-->',target,key,value,receiver)
//          target[key] = value
//      }
// })
// console.log(p) // ====> Proxy{ foo: 'foo' }
// p.foo
// p.foo = 123

// 😊 数组被代理

// let data = [1,2,3]
// let p = new Proxy(data, {
//      get(target, key, receiver) {
//            console.log('get value:', key)
//            return target[key]
//      },
//      set(target, key, value, receiver) {
//           console.log('set value:', key, value)
//           target[key] = value
//           return true
//       }
// })
// p.push(1)

// 😊 使用Reflect 返回 动作的 默认行为


// 😊 proxy 只能代理一层,而对象内部的深度侦测，是vue开发者自己实现的。同样的，对于对象内部的数据也是一样

// let obj2 = {ary:['a','b']}
// let p = new Proxy(obj2, {
//     get(target, key, receiver) {
//           console.log('get value:', key)
//           return Reflect.get(target, key, receiver)
//     },
//     set(target, key, value, receiver) {
//          console.log('set value:', key, value)
//          return Reflect.set(target, key, value, receiver)
//     }
// })

// p.ary.push('c') // get value: ary 只感应到了get 并未触发set








// 😊 实现一个最最简单的Vue3 reactive 方法

// let ary = [1, 2]
// //  第一个是被代理的数据 obj ，还有一个回调函数 cb， 我们这里先简单的在 cb 中打印 ‘更新’ 操作，来模拟通知外部数据的变化
// let p = reactive(ary, () => {
//   console.log("更新");
// });

// function reactive(data, cb) {
//   return new Proxy(data, {
//     get(target, key, receiver) {
//       return Reflect.get(target, key, receiver);
//     },
//     set(target, key, value, receiver) {
//       cb();
//       return Reflect.set(target, key, value, receiver);
//     },
//   });
// }

// p.push(3) // 执行了两次更新，是因为执行了两次 set，不友好



//◆◆◆◆◆◆◆◆◆◆◆◆◆目前为止，我们使用proxy进行对象代理时，有两点问题：1. 多次调用set,触发更新函数 2.只能代理一层◆◆◆◆◆◆◆◆◆◆◆◆◆

// 😊 解决执行两次问题--setTimeOut
// let ary = [1, 2];
// let p = reactive(ary, () => {
//   console.log("更新");
// });

// function reactive(data, cb) {
//   let timer = null;
//   return new Proxy(data, {
//     get(target, key, receiver) {
//       return Reflect.get(target, key, receiver);
//     },
//     set(target, key, value, receiver) {
//       //  每次调用 cb 之前，都清除定时器，来实现类似于 debounce 的操作
//       clearTimeout(timer);
//       timer = setTimeout(() => {
//         cb && cb();
//       }, 0);

//       return Reflect.set(target, key, value, receiver);
//     },
//   });
// }

// p.push(3);

// // 😊 解决数据深度侦测--使用递归代理

// let data = { foo: "foo", bar: [1, 2] };
// function reactive(data, cb) {
//   let res = null;
//   let timer = null;

//   res = data instanceof Array ? [] : {}; // 被代理对象是数组还是对象  // {}

//   for (let key in data) {
//     if (typeof data[key] === "object") { // 判断 每一个属性是不是 对象类型
//       res[key] = reactive(data[key], cb); // 递归 [1,2]数组已经成了一个被代理过的数组
//     } else {
//       res[key] = data[key];
//     }
//   }
//   //  res = { foo: 'foo', bar: Proxy [ 1, 2 ] }
//   return new Proxy(res, {
//     get(target, key) {
//       return Reflect.get(target, key);
//     },
//     set(target, key, val) {
//       let res = Reflect.set(target, key, val);
//       clearTimeout(timer);
//       timer = setTimeout(() => {
//         cb && cb();
//       }, 0);
//       return res;
//     },
//   });
// }

// let p = reactive(data, () => {
//   console.log("更新"); // 输出更新，就是说明触发了set，现在就能代理深层对象了
// });
// // p = Proxy { foo: 'foo', bar: Proxy[ 1, 2 ] } // 被代理后的对象，都携带 proxy 的标志
// p.bar.push(3);

// 😊 vue3 的reactivity
//    packages/reactivity/src/reactive.ts/reactive函数
//    当数据对象比较大时，递归的 proxy 会消耗比较大的性能，并且有些数据并非需要侦测，我们需要对数据侦测做更细的控制

// reactive

/*
  1.rawToReactive（保存原始数据） 和 reactiveToRaw（保存可响应数据） 是两个弱引用的 Map 结构
  2.在函数 createReactiveObject 中，toProxy 和 toRaw 传入的便是这两个 Map 。
  3.我们可以通过它们，找到任何代理过的数据是否存在，以及通过代理数据找到原始的数据。
*/
// const rawToReactive = new WeakMap(); // 可以查 一个普通 对象里面 是否有 它自己的 响应式对象
// const reactiveToRaw = new WeakMap(); // 可以查 一个代理对象 对应的原始 数据 

// function isObject(val) {
//   return typeof val === "object";
// }
// function hasOwn(val, key) {
//   const hasOwnProperty = Object.prototype.hasOwnProperty;
//   return hasOwnProperty.call(val, key);
// }
// // get
// // 深度侦测数据是通过 createGetter 函数实现的
// function createGetter() {
//   return function get(target, key, receiver) {
//     const res = Reflect.get(target, key, receiver);
//     return isObject(res) ? reactive(res) : res; // 是对象的话 执行 reactive(res) 否则直接返回 res
//   };
// }
// // set
// function set(target, key, val, receiver) {
//   const hadKey = hasOwn(target, key); // key 是否是 target对象的 属性
//   const oldValue = target[key]; // 旧值

// //   val = reactiveToRaw.get(val) || val;
  
//   const result = Reflect.set(target, key, val, receiver);
//   // 新增属性   
//   if (!hadKey) { 
//     console.log("trigger ... 新增");
//     // 更改数据
//   } else if (val !== oldValue) {
//     console.log("trigger ... 修改");
//   }

//   return result;
// }

// // 陷阱拦截器
// const baseHandlers = {
//   get: createGetter(),
//   set: set,
// };

// /* 
// target：目标对象，想要生成响应式的原始对象。
// isReadonly：生成的代理对象是否只读。
// baseHandlers：生成代理对象的 handler 参数。当 target 类型是 Array 或 Object 时使用该 handler。
// collectionHandlers：当 target 类型是 Map、Set、WeakMap、WeakSet 时使用该 handler。
// proxyMap：存储生成代理对象后的 Map 对象。
// */
// function reactive(target) {
//   return createReactiveObject(
//     target, 
//     rawToReactive,
//     reactiveToRaw,
//     baseHandlers
//   );
// }

// // 实际上执行它
// function createReactiveObject(target, toProxy, toRaw, baseHandlers) {

//     // 这里进行了一系列的判断，只为做更细的控制
//     // 前面还判断了是否是只读对象，这里进行省略
//     // 如果不是对象类型将不被代理
 
//     // toProxy（rawToReactive）对象里面有没有 源对象 的响应式数据
//     let observed = toProxy.get(target) 
//     // 如果已经存在了响应式数据, 可直接返回可响应数据----不在进行响应式代理处理了
//     // 判断是不是已经代理过了避免重复代理情况
//     if (observed !== void 0) {
//       return observed // 返回代理过的数据
//     }
//     // 原数据已经是可响应数据
//     if (toRaw.has(target)) {
//       return target
//     }


//     // observed 就是 代理对象
//     // 走到这一步 target就是一个普通的可被代理的对象
//     observed = new Proxy(target, baseHandlers)
//     // 对数据进行一一存储
//     toProxy.set(target, observed)
//     toRaw.set(observed, target)
//     // 返回代理对象
//     return observed
// }

// let obj3 = {foo:[1,2,3], bar:1}

// let o = reactive(obj3)
// console.log('000000',o)  // Proxy{foo: Proxy[1,2,3], bar:1}

// // o.foo.push(4) // 新增

// o.bar = 2 // 修改

