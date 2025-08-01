import type { Route } from "./+types/home";
import { PeopleView } from "../people/people";
import { data } from "react-router-dom";
import { db } from "~/db.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lifelog Gallery" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  const people = db.prepare("SELECT * FROM face_details").all();
  return data({ people });
}

export default function People() {
  return <PeopleView />;
}
