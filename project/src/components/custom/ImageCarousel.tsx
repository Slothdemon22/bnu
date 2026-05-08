import Autoplay from "embla-carousel-autoplay";
import type React from "react";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";

interface ImageCarouselProps {
  images: string[];
  caseStudyId: number;
  caseStudyName: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, caseStudyName }) => {
  return (
    <div
      className="relative rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="region"
      aria-label={`${caseStudyName} project gallery`}
    >
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="h-full w-full"
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem
              key={index}
              className="h-full w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${images.length}`}
            >
              <div className="relative h-full w-full">
                <img
                  src={image}
                  alt={`${caseStudyName} project screenshot ${index + 1}: Showcasing the user interface and design`}
                  className="h-full w-full rounded-lg object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding={index === 0 ? "sync" : "async"}
                  width="800"
                  height="600"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default ImageCarousel;
