import "./globals.css";import { WalletProvider } from "@/components/WalletProvider";
export const metadata={title:"TRUSS · release admission",description:"Independent software release admission on GenLayer"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html>}
