import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Admin from '../views/Admin.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresAdmin && (!userInfo.isAdmin && userInfo.role !== 'admin')) {
    next('/');
  } else {
    next();
  }
});

export default router; 