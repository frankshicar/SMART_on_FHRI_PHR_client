import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app';

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');
  const isLoginPage = to.path === '/login';

  if (!token.value && !isLoginPage) {
    return navigateTo('/login');
  }

  if (token.value && isLoginPage) {
    return navigateTo('/appointment');
  }
});
