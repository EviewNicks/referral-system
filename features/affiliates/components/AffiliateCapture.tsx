"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref") || searchParams.get("AFFIL");
    if (refCode) {
      sessionStorage.setItem("affiliate_code", refCode);
    }
  }, [searchParams]);

  return null;
}
