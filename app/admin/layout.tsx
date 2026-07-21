import { AdminHeader, AdminSidebar } from "@/features/admin";
import { Suspense } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9FD] flex flex-col font-sans">
      <AdminHeader />
      <div className="flex flex-1">
        <Suspense fallback={<aside className="hidden lg:flex w-64 border-r border-gray-100 bg-white flex-col py-6 shrink-0" />}>
          <AdminSidebar />
        </Suspense>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
          {children}
        </main>
      </div>
    </div>
  );
}
