import { useLoaderData } from "react-router";
import { Navbar } from "~/navbar/navbar";

export function AlbumsView() {
  const { albums } = useLoaderData();

  return (
    <main>
      <Navbar />
      <div className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
          <header className="flex flex-col items-center gap-9">
            <p>Albums</p>
          </header>
          <div className="grid w-full gap-0.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {albums.map((album: any) => {
              return (
                <div className="aspect-square relative" key={album.id}>
                  <a
                    className="absolute inset-0 flex items-center justify-center"
                    href={"/album/" + album.id}
                  >
                    <div className="relative w-full h-full">
                      <img
                        className="absolute  w-full h-full object-cover"
                        src={album.thumbnail_image_path}
                      ></img>
                    </div>
                  </a>
                  <div className="absolute bottom-4 right-4 bg-white p-2 rounded">
                    {String(album.image_count) +
                      (album.image_count > 1 ? " images" : " image")}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white drop-shadow-2xl">{album.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
