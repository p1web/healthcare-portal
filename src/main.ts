import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors  } from '@angular/common/http'; // Add this
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []), // keep existing providers
    provideHttpClient(withInterceptors([authInterceptor])),            // Provide HttpClient globally
  ]
})
.catch((err) => console.error(err));
