Prompt: "Build a single-page Proof of Concept for a Bible Study Web Portal.

1. Core Tech: Use sql.js for the backend (load a sample KJV SQLite file), Dexie.js for IndexedDB, and Leaflet.js for the map.
2. Layout: Create a two-column layout.

Left Rail: A scrollable Bible reader.

Right Rail: A Leaflet.js map initialized to the Middle East.
3. Interactivity: >    * When a user clicks a verse that contains a specific keyword (e.g., 'Jerusalem', 'Bethel'), trigger a function moveToCoord(lat, lng).

Add a 'Test Bench' button that sends a hardcoded coordinate to the map to verify the listener.
4. Local Storage: >    * Add a simple text area for 'Notes'.

Use Dexie.js to automatically save the note to IndexedDB every 5 seconds.
5. Visuals: >    * Style it as a 'Clean/Dark Mode' research tool. Use a 'For His Glory' (FHHG) watermark/logo in the corner.

Provide the index.html and a main.js that handles the coordination between the SQLite query and the Map markers."