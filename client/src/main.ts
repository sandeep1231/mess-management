import { bootstrapApplication } from '@angular/platform-browser';
// Enable Bootstrap JS (collapse, dropdowns, modals, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
