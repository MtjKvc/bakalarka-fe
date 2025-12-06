import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Získame token z localStorage
  const token = localStorage.getItem('auth_token');

  // Ak token existuje, pridáme ho do hlavičky
  if (token) {
    // Sklonujeme požiadavku a pridáme novú hlavičku 'Authorization'
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` // 'Bearer ' je štandard
      }
    });
    // Pošleme ďalej túto upravenú požiadavku
    return next(cloned);
  }

  // Ak token nemáme (napr. pri prihlasovaní), pošleme pôvodnú požiadavku bez zmeny
  return next(req);
};
