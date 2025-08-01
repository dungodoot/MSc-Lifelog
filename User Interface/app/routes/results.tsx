import type { Route } from "./+types/home";
import { data, redirect, type ActionFunctionArgs } from "react-router-dom";
import { db } from "~/db.server";
import { ResultsView } from "~/search/results";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lifelog Gallery" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_action");

  switch (intent) {
    case "createAlbum": {
      const selectedImageIds = formData
        .getAll("selectedImageIds")
        .toString()
        .split(",")
        .map(Number);

      if (selectedImageIds.length === 0) {
        return { error: "No images selected." };
      }

      const createAlbumSql = `INSERT INTO album (name, timestamp, thumbnail_image_id) VALUES (?, ?, ?)`;
      const currentDate = Date.now();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Europe/London",
      };

      console.log("Creating album with images:", selectedImageIds);
      console.log("Thumbnail image ID:", selectedImageIds[0]);

      const result = db
        .prepare(createAlbumSql)
        .run(
          new Date(currentDate).toLocaleDateString("en-GB", options),
          currentDate,
          selectedImageIds[0]
        );

      const albumId = result.lastInsertRowid;

      const insertAlbumImageSql = `INSERT INTO album_image (album_id, image_id) VALUES (?, ?)`;
      const insertAlbumImageStmt = db.prepare(insertAlbumImageSql);
      for (const imageId of selectedImageIds) {
        insertAlbumImageStmt.run(albumId, imageId);
      }

      // Redirect to the new album page
      return redirect(`/album/${albumId}`);
    }

    case "renameAlbum": {
      const albumName = formData.get("albumName")?.toString();
      const albumId = formData.get("albumId");

      if (!albumName) {
        return { error: "Album name cannot be empty." };
      }

      const sql = "UPDATE album SET name = ? WHERE id = ?";
      db.prepare(sql).run(albumName, albumId);

      return null;
    }

    default: {
      throw new Response(`Invalid intent: ${intent}`, { status: 400 });
    }
  }
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  const images = db.prepare(query).all();
  return data({ images });
}

export default function Results() {
  return <ResultsView />;
}
