import { useLoaderData } from "react-router";
import { Navbar } from "~/navbar/navbar";
import { useMemo, useState } from "react";
import { PhotoGallery } from "~/photoGallery/photoGallery";

export function ResultsView() {
  return (
    <PhotoGallery title="Search Results" images={useLoaderData().images} />
  );
}
