import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MyLayout from './MyLayout.vue'
import { watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({app }) {
    // 注册自定义全局组件
    app.component('MyGlobalComponent' /* ... */)
    // 创建一个全局混入，让它可以访问到路由和生命周期
    // app.mixin({
    //   setup() {
    //     const route = useRoute()
    //     const applyStyle = () => {
    //       nextTick(() => {
    //         const el = document.querySelector('.VPContent.has-sidebar')
    //         if (el) el.style.paddingRight = '0'
    //       })
    //     }
    //     // 第一次挂载完成时执行
    //     applyStyle()
    //     // 监听路由变化，变化后重新执行
    //     watch(() => route.path, applyStyle)
    //     return {}
    //   }
    // })
  }
} satisfies Theme