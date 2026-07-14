/**
 * 路由配置
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/LandingView.vue'),
      meta: { guest: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/domain',
      name: 'Domain',
      component: () => import('@/views/DomainView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mailbox',
      name: 'Mailbox',
      component: () => import('@/views/MailboxView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// 导航守卫
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next('/login');
  } else if (to.meta.guest && auth.isLoggedIn && to.name !== 'Home') {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
