// 1. Initialize Dexie (IndexedDB)
const db = new Dexie("BibleInsightsDB");
db.version(1).stores({
    notes: 'id, content'
});

// 2. Map Configuration
let map;
let markers = [];
let journeyHistory = [];

function initMap() {
    try {
        // Initialized to the Middle East
        map = L.map('map', {
            maxZoom: 18 // Allow deep zooming
        }).setView([31.7683, 35.2137], 7); 

        // Esri World Topo Map (Includes Terrain + High Zoom + Labels)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            maxNativeZoom: 17, // Data exists up to here
            maxZoom: 18        // Scale the map if we go further
        }).addTo(map);

        // Dark mode / Antique filter
        const mapEl = document.getElementById('map');
        mapEl.style.filter = "sepia(15%) contrast(105%) brightness(95%)"; 
    } catch (e) {
        console.error("Map initialization failed:", e);
    }
}

function clearMarkers() {
    if (!map) {
        console.warn("[Map] clearMarkers called but map not initialized");
        markers = [];
        return;
    }
    markers.forEach(m => {
        try {
            map.removeLayer(m);
        } catch (e) {
            console.warn("[Map] Failed to remove marker:", e);
        }
    });
    markers = [];
}

// 6. Gemini Insights Simulation
// Update: Data is now loaded synchronously from enriched-data.js

let insightTimeout;
let insightInterval;

function simulateGeminiInsight(placeName) {
    console.log(`[Insight] Requested for: ${placeName}`);

    // Defensive: ensure placeName is valid
    if (!placeName || typeof placeName !== 'string') {
        console.warn(`[Insight] Invalid placeName: ${placeName}`);
        return;
    }

    const container = document.getElementById('insights-content');
    const placeholder = document.getElementById('insight-placeholder');
    const display = document.getElementById('insight-display');
    const title = document.getElementById('insight-title');
    const text = document.getElementById('insight-text');
    const img = document.getElementById('insight-image');

    // Clear any pending insight updates
    if (insightTimeout) {
        clearTimeout(insightTimeout);
        insightTimeout = null;
    }
    if (insightInterval) {
        clearInterval(insightInterval);
        insightInterval = null;
    }

    // Remove existing spinner if any
    const oldSpinner = document.getElementById('loading-spinner');
    if (oldSpinner) oldSpinner.remove();

    // Reset UI
    if (placeholder) placeholder.style.display = 'none';
    if (display) {
        display.style.display = 'none';
        display.style.opacity = 0;
    }
    
    // Simulate Loading
    const loading = document.createElement('div');
    loading.id = 'loading-spinner';
    loading.innerHTML = '<p style="text-align:center; color:var(--accent-color);">✨ Fetching Tactical Intel for ' + placeName + '...</p>';
    if (container) container.insertBefore(loading, container.firstChild);

    insightTimeout = setTimeout(() => {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.remove();
        
        // Search our new enriched database first (it's a global from enriched-data.js)
        let data;
        try {
            const site = (typeof enrichedData !== 'undefined') ? enrichedData.find(s => s.site_id === placeName || s.id === placeName) : null;
            
            if (site) {
                // Safely extract data, handling both the old flat schema and the new nested schema
                const find = site.archaeology && site.archaeology.finds && site.archaeology.finds.length > 0 ? site.archaeology.finds[0] : null;
                
                const siteDescription = find && find.description ? find.description : (site.archeology || "Historical record pending.");
                const siteImage = find && find.img_url ? find.img_url : (site.media_uri || "https://dummyimage.com/600x400/1a1a1a/bb86fc.png&text=Image+Unavailable");

                data = {
                    title: site.site_id || site.id || placeName,
                    text: siteDescription,
                    image: siteImage
                };
            } else {
                data = {
                    title: placeName,
                    text: `Intelligence: Strategic coordinates for ${placeName} verified. Detailed archaeological briefing pending higher-level clearance.`,
                    image: "https://dummyimage.com/600x400/1a1a1a/bb86fc.png&text=Image+Unavailable"
                };
            }
        } catch (err) {
            console.error("Error retrieving enriched data:", err);
            data = { title: placeName, text: "Error loading intelligence.", image: "https://dummyimage.com/600x400/1a1a1a/bb86fc.png&text=Error" };
        }

        if (title) title.innerText = data.title;
        if (text) text.innerText = data.text;
        if (img) img.src = data.image;
        
        // Fade In
        if (display) {
            display.style.display = 'block';
            let op = 0.1;
            insightInterval = setInterval(() => {
                if (op >= 1){
                    clearInterval(insightInterval);
                }
                display.style.opacity = op;
                op += 0.1;
            }, 50);
        }

    }, 800); 
}

function moveToCoord(lat, lng, name = "") {
    console.log(`[Map] Moving to: ${name} (${lat}, ${lng})`);

    try {
        if (!map) {
            console.error("[Map] Map object is not initialized.");
            return;
        }

        // Validate coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            console.error(`[Map] Invalid coordinates: lat=${lat}, lng=${lng}`);
            return;
        }

        console.log(`[Map] Clearing ${markers.length} existing markers`);
        clearMarkers();

        // Use setView instead of flyTo to rule out animation timing issues
        console.log(`[Map] Setting view to [${lat}, ${lng}] zoom 12`);
        map.setView([lat, lng], 12);

        const marker = L.marker([lat, lng]);
        marker.addTo(map);
        marker.bindPopup(`<b>${name}</b><br>Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
        markers.push(marker);
        console.log(`[Map] Marker added successfully`);

        // Update Journey Timeline
        if (name) {
            if (journeyHistory.length === 0 || journeyHistory[journeyHistory.length - 1] !== name) {
                journeyHistory.push(name);
                if (journeyHistory.length > 5) {
                    journeyHistory.shift();
                }
                const timelinePath = document.getElementById('timeline-path');
                if (timelinePath) {
                    timelinePath.innerHTML = journeyHistory.join(' &rarr; ');
                    timelinePath.style.color = "var(--accent-color)";
                }
            }
        }

        // Trigger Gemini Insight (in separate try-catch so it doesn't break map)
        try {
            simulateGeminiInsight(name);
        } catch (insightErr) {
            console.error("[Map] Insight fetch failed (non-blocking):", insightErr);
        }

        console.log(`[Map] moveToCoord completed successfully`);
    } catch (err) {
        console.error("[Map] Error in moveToCoord:", err);
    }
}

// 3. Database & Bible Reader Logic
const locations = {
    'Jerusalem': [31.7683, 35.2137],
    'Bethel': [31.942, 35.231],
    'Gaza': [31.5, 34.466],
    'Hebron': [31.533, 35.094],
    'Shechem': [32.213, 35.272],
    'Damascus': [33.513, 36.296],
    'Joppa': [32.051, 34.752]
};

let sqliteDb;

async function initBibleReader() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        sqliteDb = new SQL.Database();
        
        // Create tables
        sqliteDb.run("CREATE TABLE bible (book TEXT, chapter INT, verse INT, text TEXT);");
        sqliteDb.run("CREATE TABLE geo_tags (book TEXT, chapter INT, verse INT, place TEXT, lat REAL, lng REAL);");

        // 1. Load Bible Text (Mock Data for POC)
        sqliteDb.run(`INSERT INTO bible VALUES 
            ('Genesis', 12, 6, 'And Abram passed through the land unto the place of Sichem, unto the plain of Moreh. And the Canaanite was then in the land.'),
            ('Genesis', 12, 8, 'And he removed from thence unto a mountain on the east of Bethel, and pitched his tent, having Bethel on the west, and Hai on the east: and there he builded an altar unto the LORD, and called upon the name of the LORD.'),
            ('Genesis', 13, 18, 'Then Abram removed his tent, and came and dwelt in the plain of Mamre, which is in Hebron, and built there an altar unto the LORD.'),
            ('Genesis', 21, 31, 'Wherefore he called that place Beer-sheba; because there they sware both of them.'),
            ('Exodus', 3, 1, 'Now Moses kept the flock of Jethro his father in law, the priest of Midian: and he led the flock to the backside of the desert, and came to the mountain of God, even to Horeb.'),
            ('Exodus', 19, 1, 'In the third month, when the children of Israel were gone forth out of the land of Egypt, the same day came they into the wilderness of Sinai.'),
            ('Joshua', 6, 1, 'Now Jericho was straitly shut up because of the children of Israel: none went out, and none came in.'),
            ('Joshua', 10, 1, 'Now it came to pass, when Adonizedek king of Jerusalem had heard how Joshua had taken Ai...'),
            ('Judges', 16, 1, 'Then went Samson to Gaza, and saw there an harlot, and went in unto her.'),
            ('2 Samuel', 2, 1, 'And it came to pass after this, that David enquired of the LORD, saying, Shall I go up into any of the cities of Judah? And the LORD said unto him, Go up. And David said, Whither shall I go up? And he said, Unto Hebron.'),
            ('2 Samuel', 5, 7, 'Nevertheless David took the strong hold of Zion: the same is the city of David.'),
            ('Jonah', 1, 3, 'But Jonah rose up to flee unto Tarshish from the presence of the LORD, and went down to Joppa, and he found a ship going to Tarshish: so he paid the fare thereof, and went down into it, to go with them unto Tarshish from the presence of the LORD.'),
            ('Acts', 9, 3, 'And as he journeyed, he came near Damascus: and suddenly there shined round about him a light from heaven.'),
            ('Acts', 11, 26, 'And when he had found him, he brought him unto Antioch. And it came to pass, that a whole year they assembled themselves with the church, and taught much people. And the disciples were called Christians first in Antioch.')
        `);

        // 2. Load Geocoding Data (Using geodata.js)
        const stmt = sqliteDb.prepare("INSERT INTO geo_tags VALUES (?, ?, ?, ?, ?, ?)");
        
        // ancientData is now loaded from geodata.js
        if (typeof ancientData !== 'undefined') {
            ancientData.forEach(data => {
            try {
                // Get Coordinates (Primary Resolution)
                const res = data.identifications?.[0]?.resolutions?.[0];
                if (!res || !res.lonlat) return;
                
                const [lng, lat] = res.lonlat.split(',').map(Number);
                const placeName = data.friendly_id;

                // Map Verses
                if (data.verses) {
                    data.verses.forEach(v => {
                        // OSIS format: "Gen.12.8" or "2Sam.2.1"
                        const parts = v.osis.split('.');
                        if (parts.length >= 3) {
                            let book = parts[0];
                            const chapter = parseInt(parts[1]);
                            const verse = parseInt(parts[2]);

                            // Normalize Book Names to match our KJV mock
                            const bookMap = {
                                'Gen': 'Genesis', 'Exod': 'Exodus', 'Num': 'Numbers', 'Deut': 'Deuteronomy',
                                'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth',
                                '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Kings', '2Kgs': '2 Kings',
                                '1Chr': '1 Chronicles', '2Chr': '2 Chronicles', 'Ezra': 'Ezra', 'Neh': 'Nehemiah',
                                'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalms', 'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes',
                                'Song': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
                                'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Joel': 'Joel', 'Amos': 'Amos',
                                'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk',
                                'Zeph': 'Zephaniah', 'Hag': 'Haggai', 'Zech': 'Zechariah', 'Mal': 'Malachi',
                                'Matt': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
                                'Rom': 'Romans', '1Cor': '1 Corinthians', '2Cor': '2 Corinthians', 'Gal': 'Galatians',
                                'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
                                '1Thess': '1 Thessalonians', '2Thess': '2 Thessalonians', '1Tim': '1 Timothy',
                                '2Tim': '2 Timothy', 'Titus': 'Titus', 'Phlm': 'Philemon', 'Heb': 'Hebrews',
                                'Jas': 'James', '1Pet': '1 Peter', '2Pet': '2 Peter', '1John': '1 John',
                                '2John': '2 John', '3John': '3 John', 'Jude': 'Jude', 'Rev': 'Revelation'
                            };
                            
                            if (bookMap[book]) book = bookMap[book];

                            stmt.run([book, chapter, verse, placeName, lat, lng]);
                        }
                    });
                }
            } catch (e) {
                // Skip malformed lines
            }
        });
        }
        stmt.free();
        console.log("Geocoding data loaded successfully (Embedded Mode).");

        renderBible();
    } catch (e) {
        console.error("Bible reader initialization failed:", e);
        document.getElementById('verse-list').innerHTML = '<p style="color:red">Error loading Bible database. Please check connection.</p>';
    }
}

function renderBible(filter = "", bookFilter = "") {
    // 1. Get Verses
    let query = "SELECT * FROM bible";
    const conditions = [];
    if (filter) conditions.push(`text LIKE '%${filter}%'`);
    if (bookFilter) conditions.push(`book = '${bookFilter}'`);
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");

    const res = sqliteDb.exec(query);
    const verseList = document.getElementById('verse-list');
    verseList.innerHTML = '';

    if (res.length === 0) {
        verseList.innerHTML = '<p>No results found.</p>';
        return;
    }

    const rows = res[0].values;
    
    // 2. Get Geotags for these verses (One big query is better)
    // For simplicity in this POC, we'll query per verse or fetch all tags for the chapter
    // A better way is: SELECT * FROM geo_tags WHERE book='Genesis' AND chapter=12
    
    rows.forEach(row => {
        const [book, chapter, verse, text] = row;
        const verseEl = document.createElement('div');
        verseEl.className = 'verse';
        
        // Find tags for this specific verse
        // Note: In a real app, optimize this to avoid N+1 queries
        const tagRes = sqliteDb.exec(`SELECT place, lat, lng FROM geo_tags WHERE book='${book}' AND chapter=${chapter} AND verse=${verse}`);
        
        let highlightedText = text;
        
        if (tagRes.length > 0) {
            const tags = tagRes[0].values;
            tags.forEach(tag => {
                const [place, lat, lng] = tag;
                if (isNaN(lat) || isNaN(lng)) return;
                
                // Escape single quotes for the JS onclick string
                const safePlace = place.replace(/'/g, "\\'");
                
                try {
                    // Escape regex special characters in place name
                    const escapedPlace = place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b(${escapedPlace})\\b`, 'gi');
                    // Use data attributes instead of inline onclick for robustness
                    highlightedText = highlightedText.replace(regex,
                        `<span class="keyword" data-lat="${lat}" data-lng="${lng}" data-place="${place.replace(/"/g, '&quot;')}">$1</span>`);
                } catch (e) {
                    console.warn(`Regex error for place: ${place}`, e);
                }
            });
        }

        verseEl.innerHTML = `<strong>${book} ${chapter}:${verse}</strong> - ${highlightedText}`;
        verseList.appendChild(verseEl);
    });
}

// 4. Listeners
async function setupListeners() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderBible(e.target.value, document.getElementById('book-select').value);
    });

    document.getElementById('book-select').addEventListener('change', (e) => {
        renderBible(document.getElementById('search-input').value, e.target.value);
    });

    // Delegated click handler for location keywords (replaces inline onclick)
    document.getElementById('verse-list').addEventListener('click', (e) => {
        const keyword = e.target.closest('.keyword');
        if (!keyword) return;

        const lat = parseFloat(keyword.dataset.lat);
        const lng = parseFloat(keyword.dataset.lng);
        const place = keyword.dataset.place;

        console.log(`[Click] Keyword clicked: ${place} (${lat}, ${lng})`);

        if (isNaN(lat) || isNaN(lng)) {
            console.error(`[Click] Invalid coordinates for ${place}`);
            return;
        }

        moveToCoord(lat, lng, place);
    });
}

// 4. Auto-save Notes Logic
async function setupNotes() {
    const notesArea = document.getElementById('study-notes');
    const status = document.getElementById('save-status');

    // Load initial note
    const savedNote = await db.notes.get(1);
    if (savedNote) {
        notesArea.value = savedNote.content;
    }

    // Auto-save every 5 seconds
    setInterval(async () => {
        const content = notesArea.value;
        await db.notes.put({ id: 1, content: content });
        
        status.innerText = "Auto-saved at " + new Date().toLocaleTimeString();
        status.style.opacity = "1";
        setTimeout(() => {
            status.style.opacity = "0.5";
        }, 1000);
    }, 5000);
}

// 5. Action Listeners
function setupActions() {
    document.getElementById('test-bench').addEventListener('click', () => {
        moveToCoord(31.7683, 35.2137, "Jerusalem");
    });

    document.getElementById('surprise-me').addEventListener('click', () => {
        // Query for all verses that have geo tags
        const res = sqliteDb.exec("SELECT DISTINCT place, lat, lng, book, chapter, verse FROM geo_tags JOIN bible USING(book, chapter, verse) ORDER BY RANDOM() LIMIT 1");
        if (res.length > 0 && res[0].values.length > 0) {
            const [place, lat, lng, book, chapter, verse] = res[0].values[0];
            
            // Filter reader to show this book
            document.getElementById('book-select').value = book;
            renderBible("", book);
            
            // Fly to location
            moveToCoord(lat, lng, place);

            // Highlight the verse in the reader (optional future improvement)
            console.log(`Surprising you with ${place} from ${book} ${chapter}:${verse}`);
        }
    });
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await initBibleReader();
    setupNotes();
    setupListeners();
    setupActions();
});
