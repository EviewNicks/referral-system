import EventCarouselClient from "./EventCarouselClient";

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

type EventCarouselProps = {
  events: CarouselItem[];
};

export default function EventCarousel({ events }: EventCarouselProps) {
  // If there are no slide-specific images, we can fall back to general ones
  return (
    <div className="w-full">
      <EventCarouselClient events={events} />
    </div>
  );
}
