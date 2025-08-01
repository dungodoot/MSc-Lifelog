import type { Route } from "./+types/home";
import { data } from "react-router-dom";
import { db } from "~/db.server";
import { AlbumsView } from "~/albums/albums";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lifelog Gallery" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  const albums = db.prepare("SELECT * FROM album_details").all();
  return data({ albums });
}

export default function Albums() {
  return <AlbumsView />;
}
