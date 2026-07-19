import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import React from "react";

type EventCardProps = {
  event: {
    id: string;
    name: string;
    code: string;
    category: string | null;
    city: string;
    location: string;
    thumbnail_image: string | null;
    start_date: Date | string | null;
  };
};

export default function EventCard({ event }: EventCardProps) {
  // Map category to brutalist shadow color
  const getShadowColor = (cat: string | null, name: string) => {
    if (!cat) return "#2C1F63"; // default deep purple
    const c = cat.toLowerCase();
    const n = name.toLowerCase();

    if (n.includes("sharing time") || c.includes("religi") || c.includes("agama")) {
      if (n.includes("palembang")) return "#DF135C"; // Pink
      return "#FF9500"; // Orange
    }
    if (c.includes("music") || c.includes("konser")) return "#FFBC05"; // Yellow/Orange
    if (c.includes("sport") || c.includes("olahraga")) return "#2E4EEA"; // Blue
    if (c.includes("art") || c.includes("pameran") || c.includes("entertainment")) return "#CAFF04"; // Green
    return "#2C1F63";
  };

  const shadowColor = getShadowColor(event.category, event.name);

  return (
    <Link href={`/events/${event.code}`} className="block h-full">
      <div 
        className="flex flex-col h-full bg-white border-2 border-black rounded-[16px] overflow-hidden transition-all duration-200 shadow-[5px_5px_0px_var(--shadow-color)] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-none cursor-pointer select-none"
        style={{ "--shadow-color": shadowColor } as React.CSSProperties}
      >
        {/* Event Thumbnail */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 border-b-2 border-black">
          <Image
            src={event.thumbnail_image || "/images/placeholder.png"}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Card Content */}
        <div className="flex flex-col flex-grow p-4 gap-2">
          {/* Event Title */}
          <h3 className="font-extrabold text-[15px] sm:text-base leading-tight text-[#2C1F63] line-clamp-2 min-h-[40px]">
            {event.name}
          </h3>

          {/* Category Text (Plain orange text below title) */}
          <div className="text-xs font-bold text-[#E28A00]">
            {event.category || "General"}
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-gray-200 my-1" />

          {/* Event Metadata (Date, Time, Location) */}
          <div className="flex flex-col gap-2 text-xs text-gray-600 font-semibold mt-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{formatTime(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
