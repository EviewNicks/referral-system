import React from "react";
import { notFound } from "next/navigation";
import { getAffiliateDetailAction } from "@/features/affiliates/actions";
import AffiliateDetailClient from "@/features/affiliates/components/AffiliateDetailClient";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function AffiliateDetailPage({ params }: PageProps) {
  const { code } = await params;
  const res = await getAffiliateDetailAction(code);

  if (!res.success || !res.data) {
    notFound();
  }

  return <AffiliateDetailClient data={res.data as any} />;
}
