import { useLoaderData, useSubmit } from "react-router";
import { PhotoGallery } from "~/photoGallery/photoGallery";

export function AlbumView() {
  const { album, images } = useLoaderData();
  const submit = useSubmit();

  const handleClick = () => {
    const albumName = window.prompt(
      "Rename Album...",
      album.name || "New Album"
    );

    if (albumName && albumName.trim() !== "") {
      submit(
        {
          albumName: albumName,
          albumId: album.id,
          _action: "renameAlbum",
        },
        {
          method: "post",
        }
      );
    }
  };

  return (
    <PhotoGallery
      title={
        <span>
          {album.name}
          <span
            className="bg-gray-100 text-gray-500 text-xs rounded px-1 ml-2"
            onClick={handleClick}
          >
            Edit...
          </span>
        </span>
      }
      images={images}
    />
  );
}
