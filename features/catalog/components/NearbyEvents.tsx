import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";

type EventItem = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  city: string;
  location: string;
  thumbnail_image: string | null;
  start_date: Date | string | null;
  minPrice: number | null;
};

type NearbyEventsProps = {
  events: EventItem[];
};

export default function NearbyEvents({ events }: NearbyEventsProps) {
  return (
    <section className="flex flex-col gap-6 py-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black">
            Event Terbaru & Terpopuler
          </h2>
          <p className="text-sm text-gray-500">
            Temukan konser musik, festival seni, dan event seru lainnya di sekitarmu
          </p>
        </div>
        <Link href="/events" className="hidden sm:inline-flex">
          <Button variant="ghost" className="text-[#2E4EEA] hover:bg-[#2E4EEA]/5 flex items-center gap-1.5 font-bold">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Grid List */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-bold mb-2">Belum ada event aktif.</p>
          <p className="text-xs text-gray-400">Silakan kembali lagi nanti untuk event seru lainnya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Mobile view 'See All' button */}
      <div className="sm:hidden mt-2 flex justify-center">
        <Link href="/events" className="w-full">
          <Button variant="outline" className="w-full border-2 border-black">
            Lihat Semua Event <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
