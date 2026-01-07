import "./globals.css";

export const metadata = {
  title: "Sistema de Gestao",
  description: "Dashboard de gerenciamento com controle de acesso"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="app-body">
        <div className="ambient-glow" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
