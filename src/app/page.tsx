import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import LoginScreen from "@/components/auth/LoginScreen";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const session = await getSession();
  if (session) redirect(searchParams?.next || "/today");
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
