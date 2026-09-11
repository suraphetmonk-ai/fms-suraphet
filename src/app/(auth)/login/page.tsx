import { Suspense } from "react";
import { oauthProviderIds } from "@/features/identity/server";
import { LoginPanel } from "./_components/login-panel";

export default async function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPanel providers={oauthProviderIds()} />
    </Suspense>
  );
}
