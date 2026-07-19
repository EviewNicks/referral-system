"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type CarouselItem = {
  id: string;
  name: string;
  code: string;
  city: string;
  location: string;
  slide_image: string | null;
  thumbnail_image: string | null;
  start_date: Date | string | null;
};

type EventCarouselClientProps = {
  events: CarouselItem[];
};

export default function EventCarouselClient({ events }: EventCarouselClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (events.length === 0) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const currentEvent = events[activeIndex];
  const displayImage = currentEvent.slide_image || currentEvent.thumbnail_image || "/images/placeholder.png";

  return (
    <div className="relative w-full overflow-hidden rounded-[16px] border-2 border-black bg-[#0B0A0F] shadow-[6px_6px_0px_#000] aspect-[21/9] min-h-[220px]">
      
      {/* Slide Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={displayImage}
          alt={currentEvent.name}
          fill
          priority
          className="object-cover opacity-80"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Slide Details */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex flex-col justify-end text-white max-w-2xl gap-2 z-10">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md text-white line-clamp-1 sm:line-clamp-2">
          {currentEvent.name}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-200 mt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#CAFF04]" />
            <span>{formatDate(currentEvent.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#CAFF04]" />
            <span className="truncate">{currentEvent.location}, {currentEvent.city}</span>
          </div>
        </div>

        <div className="mt-3">
          <Link href={`/events/${currentEvent.code}`}>
            <Button variant="default" shape="pill" size="default" className="text-black bg-[#CAFF04] hover:bg-[#b0df03] scale-90 sm:scale-100 origin-left">
              Beli Tiket
            </Button>
          </Link>
        </div>
      </div>

      {/* Left/Right Controls */}
      {events.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none z-20">
          <Button
            onClick={prevSlide}
            variant="outline"
            size="icon"
            className="rounded-full bg-white text-black border-2 border-black pointer-events-auto shadow-[2px_2px_0px_#000] hover:translate-y-0 h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={nextSlide}
            variant="outline"
            size="icon"
            className="rounded-full bg-white text-black border-2 border-black pointer-events-auto shadow-[2px_2px_0px_#000] hover:translate-y-0 h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? "w-6 bg-[#CAFF04]" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
