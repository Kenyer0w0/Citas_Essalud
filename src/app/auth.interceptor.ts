import { HttpInterceptorFn } from '@angular/common/http';

/** Sends the short-lived JWT issued by Spring Security. Never stores passwords. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const urlPath = request.url.split('?')[0];
  if (urlPath.endsWith('/auth/login') || urlPath.endsWith('/auth/registro')) {
    return next(request);
  }
  const token = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('citas.jwt');
  if (!token) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
