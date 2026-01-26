import { HttpInterceptorFn } from '@angular/common/http';
const PUBLIC_URLS = ['/login', '/register'];
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // console.log('Intercepted:', req.url);

  if (PUBLIC_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  }
  return next(req);
};
