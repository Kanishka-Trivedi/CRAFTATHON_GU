import '../index.css';
import { AuthProvider } from '../context/AuthContext';
import { AdminProvider } from '../context/AdminContext';

export const metadata = {
  title: 'BehaveGuard | Behavioral Cybersecurity',
  description: 'Military-grade continuous authentication with Machine Learning',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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