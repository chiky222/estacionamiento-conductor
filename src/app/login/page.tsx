import { Suspense } from "react";
import { LoginView } from "@/components/sesion/LoginView";

export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
