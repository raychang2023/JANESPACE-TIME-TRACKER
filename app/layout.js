import "./globals.css";

export const metadata = {
  title: "JaneSpace Logistics Operation Time Tracker",
  description: "Mobile-first warehouse sorting staff time tracker"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
