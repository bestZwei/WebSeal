import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页 - WebSeal'
    }
  },
  {
    path: '/screenshot',
    name: 'Screenshot',
    component: () => import('@/views/Screenshot.vue'),
    meta: {
      title: '网页截图 - WebSeal'
    }
  },
  {
    path: '/detect',
    name: 'Detect',
    component: () => import('@/views/WatermarkDetect.vue'),
    meta: {
      title: '水印检测 - WebSeal'
    }
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/Records.vue'),
    meta: {
      title: '存证记录 - WebSeal'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于我们 - WebSeal'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
