import '../index.css';
import { AuthProvider } from '../context/AuthContext';
import { AdminProvider } from '../context/AdminContext';

export const metadata = {
  title: 'BehaveGuard | Behavioral Cybersecurity',
  description: 'Military-grade continuous authentication powered by Machine Learning behavioral biometrics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/assets/logo.png" />
      </head>
      <body>
        <AuthProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}