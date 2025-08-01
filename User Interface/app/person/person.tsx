import { useLoaderData, useSubmit } from "react-router";
import { PhotoGallery } from "~/photoGallery/photoGallery";

export function PersonView() {
  const { person, images } = useLoaderData();
  const submit = useSubmit();

  const handleClick = () => {
    const personName = window.prompt(
      "Rename Person...",
      person.name || "Unknown Person"
    );

    if (personName && personName.trim() !== "") {
      submit(
        {
          personName: personName,
          personId: person.id,
          _action: "renamePerson",
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
          {person.name ? person.name : "Unknown Person"}
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
