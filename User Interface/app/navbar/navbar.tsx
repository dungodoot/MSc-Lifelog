import { Form } from "react-router-dom";

function createAlbum(selectedImageIds: Set<Number>) {}

export function Navbar({
  selectedImageIds,
}: {
  selectedImageIds?: Set<Number> | null;
}) {
  return (
    <div className="sticky top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="text-lg font-bold">Lifelog Gallery</div>
        <ul className="flex space-x-4">
          <li>
            <a href="/all" className="hover:underline">
              All Photos
            </a>
          </li>
          <li>
            <a href="/people" className="hover:underline">
              People
            </a>
          </li>
          <li>
            <a href="/albums" className="hover:underline">
              Albums
            </a>
          </li>
          <li>
            <a href="/search" className="hover:underline">
              Search
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
