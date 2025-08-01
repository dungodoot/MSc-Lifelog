import { useLoaderData } from "react-router";
import { PhotoGallery } from "~/photoGallery/photoGallery";

export function AllView() {
  return <PhotoGallery title="All Photos" images={useLoaderData().images} />;
}
