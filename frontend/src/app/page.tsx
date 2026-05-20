"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/reports");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-6">
      <div className="auth-card rounded-[36px] overflow-hidden px-10 py-8">
        <div className="flex items-center gap-3 justify-center">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">
            ImpactLens
          </span>
        </div>
      </div>
    </div>
  );
}