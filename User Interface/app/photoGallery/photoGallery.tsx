import React, { useState, useMemo } from "react";
import { Form } from "react-router-dom";
import ImageViewer from "~/imageViewer/imageViewer";
import { Navbar } from "~/navbar/navbar";

interface Image {
  id: number | string;
  timestamp: number;
  path: string;
}

interface PhotoGalleryProps {
  title: string | React.ReactNode;
  images: Image[];
}

export function PhotoGallery({ title, images }: PhotoGalleryProps) {
  const imagesByDay = useMemo(() => {
    const groups = new Map<string, Image[]>();
    images.forEach((image) => {
      const date = new Date(image.timestamp * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayOfMonth = String(date.getDate()).padStart(2, "0");
      const dayKey = `${year}-${month}-${dayOfMonth}`;

      if (!groups.has(dayKey)) {
        groups.set(dayKey, []);
      }
      groups.get(dayKey)!.push(image);
    });
    return groups;
  }, [images]);

  const sortedDays = Array.from(imagesByDay.entries()).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  // State for image selection
  const [selectedImageIds, setSelectedImageIds] = useState(
    new Set<number | string>()
  );

  const handleCheckboxChange = (imageId: number | string) => {
    const newSelectedIds = new Set(selectedImageIds);
    if (newSelectedIds.has(imageId)) {
      newSelectedIds.delete(imageId);
    } else {
      newSelectedIds.add(imageId);
    }
    setSelectedImageIds(newSelectedIds);
  };

  // State and handlers for the image viewer
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleImageClick = (imageId: number | string) => {
    const globalIndex = images.findIndex((image) => image.id === imageId);
    if (globalIndex !== -1) {
      setCurrentIndex(globalIndex);
      setIsViewerOpen(true);
    }
  };

  const closeViewer = () => setIsViewerOpen(false);
  const showNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const showPrevious = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <main>
      <Navbar />
      <Form method="post">
        <div className="flex items-center justify-center pt-16 pb-4">
          <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
            <header className="flex flex-col items-center gap-9">
              <p className="text-2xl font-bold">{title}</p>
            </header>
            {sortedDays.map(([day, dayImages]) => {
              const displayDate = new Date(day).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Europe/London",
              });

              return (
                <div
                  key={day}
                  className="w-full flex flex-col items-center gap-4"
                >
                  <h2 className="text-lg font-semibold">{displayDate}</h2>
                  <div className="grid w-full gap-0.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                    {dayImages
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((image) => (
                        <div className="aspect-square relative" key={image.id}>
                          <a
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            onClick={() => handleImageClick(image.id)}
                          >
                            <div className="relative w-full h-full">
                              <img
                                className="absolute w-full h-full object-scale-down"
                                src={image.path}
                                alt=""
                              />
                            </div>
                          </a>
                          <div className="absolute top-4 right-4 z-10">
                            <input
                              type="checkbox"
                              className="cursor-pointer h-5 w-5"
                              name="selectedImageIds"
                              value={image.id}
                              checked={selectedImageIds.has(image.id)}
                              onChange={() => handleCheckboxChange(image.id)}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          className="fixed bottom-10 right-10 bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-200 transition-colors z-50"
          hidden={selectedImageIds.size == 0}
          type="submit"
          name="_action"
          value="createAlbum"
        >
          Create Album
        </button>
      </Form>
      <ImageViewer
        show={isViewerOpen}
        imageUrl={images[currentIndex]?.path}
        imageDate={new Date(
          images[currentIndex].timestamp * 1000
        ).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Europe/London",
        })}
        onClose={closeViewer}
        onNext={showNext}
        onPrevious={showPrevious}
      />
    </main>
  );
}
