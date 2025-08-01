import nlp from "compromise";
import nlpDates from "compromise-dates";
import { Navbar } from "~/navbar/navbar";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Extend compromise with the dates plugin
const nlpEx = nlp.extend(nlpDates);

function escapeSQLite(value: string): string {
  return value.replace(/'/g, "''");
}

export function generateImageSearchQuery(naturalLanguageQuery: string): string {
  const doc = nlpEx(naturalLanguageQuery);

  // --- Entity Extraction ---
  const names = doc.people().normalize().out("array");
  const places = doc.places().normalize().out("array");
  const dates = doc.dates().get();
  const times = doc.times().get();
  const durations = doc.durations().get();

  console.log("Extracted Names:", names);
  console.log("Extracted Places:", places);
  console.log("Extracted Dates:", dates);
  console.log("Extracted Times:", times);
  console.log("Extracted Durations:", durations);

  // --- Query Construction ---
  const baseSelect = "SELECT DISTINCT i.* FROM image i";
  const joins: string[] = [];
  const conditions: string[] = [];

  if (names.length > 0) {
    joins.push("JOIN image_face iface ON i.id = iface.image_id");
    joins.push("JOIN face f ON iface.face_id = f.id");

    const nameConditions = names
      .map(
        (name: any) =>
          `LOWER(f.name) LIKE '%${escapeSQLite(name.toLowerCase())}%'`
      )
      .join(" OR ");
    conditions.push(`(${nameConditions})`);
  }

  if (places.length > 0) {
    const placeConditions = places
      .map(
        (place: any) =>
          `LOWER(i.address) LIKE '%${escapeSQLite(place.toLowerCase())}%'`
      )
      .join(" OR ");
    conditions.push(`(${placeConditions})`);
  }

  if (dates.length > 0) {
    const dateRange = dates[0];
    // Ignore date if it is not a range
    if (dateRange.start != dateRange.end) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.end || dateRange.start);
      end.setHours(23, 59, 59, 999);

      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      conditions.push(
        `i.timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}`
      );
    }
  }

  if (times.length > 0) {
    const timeConditions = times
      .map((time: any) => {
        const secondsIntoDay = time.hour * 3600 + time.minute * 60;
        return `i.time_of_day BETWEEN ${secondsIntoDay - 7200} AND ${
          secondsIntoDay + 7200
        }`;
      })
      .join(" OR ");

    conditions.push(`(${timeConditions})`);
  }

  let sql = baseSelect;
  if (joins.length > 0) {
    sql += ` ${joins.join(" ")}`;
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += ";";

  return sql;
}

export function SearchView() {
  // State to hold the value of the input field
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  // Function to handle the key press event
  const handleKeyDown = (event: any) => {
    // Check if the key pressed was 'Enter'
    if (event.key === "Enter") {
      console.log(`Query: "${inputValue}"`);

      // Call your function with the input's current value
      const result = generateImageSearchQuery(inputValue);

      // Log the generated SQL and parameters to the console
      console.log("SQL:", result);

      const sqlEncoded = encodeURIComponent(result);
      navigate("/results?q=" + sqlEncoded);
    }
  };

  return (
    <main>
      <Navbar />
      <input
        type="text"
        placeholder="Search for images"
        className="w-4/5 ml-10 mr-10 mt-20 p-2 border rounded"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </main>
  );
}
