import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rifa de Yeka',
  description: 'Rifa para arreglar la pantalla del teléfono — $20.000 por 5 números, premio $200.000.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 text-purple-900">{children}</body>
    </html>
  );
}
