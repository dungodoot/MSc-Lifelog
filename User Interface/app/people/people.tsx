import { useLoaderData } from "react-router";
import { Navbar } from "~/navbar/navbar";

export function PeopleView() {
  const { people } = useLoaderData();

  return (
    <main>
      <Navbar />
      <div className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
          <header className="flex flex-col items-center gap-9">
            <p>People View</p>
          </header>
          <div className="grid w-full gap-0.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {people.map((face: any) => {
              const topPercent = (face.location_top / face.image_height) * 100;
              const leftPercent = (face.location_left / face.image_width) * 100;

              const widthPercent =
                ((face.location_right - face.location_left) /
                  face.image_width) *
                100;
              const heightPercent =
                ((face.location_bottom - face.location_top) /
                  face.image_height) *
                100;

              return (
                <div className="aspect-square relative" key={face.id}>
                  <a
                    className="absolute inset-0 flex items-center justify-center"
                    href={"/person/" + face.id}
                  >
                    <div className="relative w-full h-full">
                      <img
                        className="absolute  w-full h-full"
                        src={face.image_path}
                      ></img>
                      <div
                        className="absolute"
                        style={{
                          width: `${widthPercent}%`,
                          height: `${heightPercent}%`,
                          top: `${topPercent}%`,
                          left: `${leftPercent}%`,
                          border: "2px solid red",
                          boxSizing: "border-box",
                        }}
                      ></div>
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white drop-shadow-2xl">
                          {face.name ? face.name : "Unknown person"}
                        </p>
                      </div>
                    </div>
                  </a>
                  <div className="absolute bottom-4 right-4 bg-white p-2 rounded">
                    {face.appearance_count}
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
