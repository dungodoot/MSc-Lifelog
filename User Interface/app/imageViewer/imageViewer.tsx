import React from "react";

const ImageViewer = ({
  show,
  imageUrl,
  imageDate,
  onClose,
  onNext,
  onPrevious,
}) => {
  if (!show) {
    return null;
  }
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 cursor-pointer"
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 text-white text-4xl leading-none select-none z-[51] hover:text-gray-300"
        onClick={onClose}
      >
        &times;
      </button>

      <button
        className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/50 text-white text-3xl p-3 rounded-full select-none z-[51] hover:bg-black/75 transition-colors"
        onClick={(e) => {
          stopPropagation(e);
          onPrevious();
        }}
      >
        &#10094;
      </button>

      <div
        className="flex flex-col items-center gap-4 cursor-default"
        onClick={stopPropagation}
      >
        <img
          src={imageUrl}
          alt="Enlarged view"
          className="max-w-[90vw] max-h-[85vh] object-contain"
        />

        {imageDate && (
          <p className="text-white text-lg select-none">{imageDate}</p>
        )}
      </div>

      <button
        className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/50 text-white text-3xl p-3 rounded-full select-none z-[51] hover:bg-black/75 transition-colors"
        onClick={(e) => {
          stopPropagation(e);
          onNext();
        }}
      >
        &#10095;
      </button>
    </div>
  );
};

export default ImageViewer;
