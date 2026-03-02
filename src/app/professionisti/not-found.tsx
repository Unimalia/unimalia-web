"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFoundPro() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/professionisti");
  }, [router]);

  return null;
}