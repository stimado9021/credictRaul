import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CreditRaul - Sistema de Creditos',
  description: 'Sistema de gestion de creditos y fiados',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-surface text-white antialiased">
        <nav className="border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="text-xl font-bold tracking-tight">
                <span className="text-white">Credit</span>
                <span className="text-brand-red">Raul</span>
              </a>
              <div className="flex items-center gap-1">
                <a
                  href="/"
                  className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-surface-hover transition-colors"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
