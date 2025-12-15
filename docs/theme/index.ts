import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MyLayout from './MyLayout.vue'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    // 注册自定义全局组件
    app.component('MyGlobalComponent' /* ... */)
  }
} satisfies Theme