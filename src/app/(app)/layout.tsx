import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { UserProvider } from "@/components/UserContext";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <UserProvider user={session.user}>
      <AppHeader />
      <main className="max-w-[680px] mx-auto px-4 pb-28 pt-2">{children}</main>
      <BottomNav />
    </UserProvider>
  );
}
