import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("all", "routes/all.tsx"),
  route("people", "routes/people.tsx"),
  route("person/:id", "routes/person.tsx"),
  route("albums", "routes/albums.tsx"),
  route("album/:id", "routes/album.tsx"),
  route("search", "routes/search.tsx"),
  route("results", "routes/results.tsx"),
] satisfies RouteConfig;
