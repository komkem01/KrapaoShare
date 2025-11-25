import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { TypeProvider } from '@/contexts/TypeContext';
import { UserProvider } from '@/contexts/UserContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { BudgetProvider } from '@/contexts/BudgetContext';
import { BillProvider } from '@/contexts/BillContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { SharedGoalProvider } from '@/contexts/SharedGoalContext';
import { DebtProvider } from '@/contexts/DebtContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KrapaoShare",
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
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          theme="light"
          toastOptions={{
            style: {
              padding: '16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
        <UserProvider>
          <NotificationProvider>
            <CategoryProvider>
              <TypeProvider>
                <AccountProvider>
                  <TransactionProvider>
                    <BudgetProvider>
                      <BillProvider>
                        <GoalProvider>
                          <SharedGoalProvider>
                            <DebtProvider>
                              {children}
                            </DebtProvider>
                          </SharedGoalProvider>
                        </GoalProvider>
                      </BillProvider>
                    </BudgetProvider>
                  </TransactionProvider>
                </AccountProvider>
              </TypeProvider>
            </CategoryProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
