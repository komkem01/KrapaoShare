import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { TypeProvider } from '@/contexts/TypeContext';
import { UserProvider } from '@/contexts/UserContext';
import { AccountProvider } from '@/contexts/AccountContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KrapaoShare - จัดการเงินอย่างง่าย",
  description: "แอปพลิเคชันจัดการรายรับ-รายจ่าย แบ่งบิล และตั้งเป้าหมายการออมแบบมินิมอล",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <NotificationProvider>
            <CategoryProvider>
              <TypeProvider>
                <AccountProvider>
                  {children}
                </AccountProvider>
              </TypeProvider>
            </CategoryProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
