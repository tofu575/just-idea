import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './presentation/providers/AppProviders';
import { AppRouter } from './presentation/router/AppRouter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element was not found.');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
