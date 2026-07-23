import { notFound } from "next/navigation";
import { getPayoutHistoryAction } from "@/features/payouts";
import AdminPayoutsClient from "@/features/payouts/components/AdminPayoutsClient";

type PageProps = {
  searchParams: Promise<{
    secret?: string;
  }>;
};

export default async function AdminPayoutsPage() {
  const res = await getPayoutHistoryAction();
  const initialData = res.success ? res.data : [];

  return <AdminPayoutsClient initialData={initialData} secret="" />;
}
