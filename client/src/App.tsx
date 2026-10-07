import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ControlAcceso } from './modules/auth/ControlAcceso';
import { AppRoutes } from './routes/AppRoutes';

/** Composición de la aplicación: tema → sesión → control de acceso → rutas */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ControlAcceso>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ControlAcceso>
      </AuthProvider>
    </ThemeProvider>
  );
}
