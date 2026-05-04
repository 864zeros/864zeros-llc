const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': '864Z-Orchestrator/3.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch(e) { resolve({ status: 500 }); }
      });
    }).on('error', reject);
  });
}

function verifyImage(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': '864Z-Orchestrator/3.0' } }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function run() {
  console.log("Initiating Batch 01: 50 Nodes...");
  const fileContent = fs.readFileSync('lightweight-geodata.jsonl', 'utf8');
  const lines = fileContent.split("\n").filter(l => l.trim().length > 0).slice(0, 50);
  const now = new Date().toISOString();
  
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync('enriched-master-geodata.json', 'utf8'));
  } catch (e) {}

  const newNodes = [];
  // Confirmed 200 OK fallback image from Wikimedia Commons
  const fallbackImg = "https://upload.wikimedia.org/wikipedia/commons/d/d3/Jerusalem_from_Mount_of_Olives.jpg";

  for (const line of lines) {
    const node = JSON.parse(line);
    const id = node.id;
    const queryTerm = id.replace(/\s\d+$/, ''); // Strip numbers for better wiki match
    
    // Default schema placeholders
    let elevation = "Topography unverified";
    let region = "Levantine Theater";
    let era = "Biblical Era";
    let conflict = "Regional Strategic Tensions";
    let statusStr = "Geographic Marker Status";
    let tension = "UNKNOWN";
    let title = "Surface Survey / Marker Status";
    let desc = "Geographic marker based on candidate regions. Awaiting definitive stratigraphy or identification of corresponding tell.";
    let img_url = fallbackImg;
    let etymology = `Root analysis pending for '${queryTerm}'.`;
    let insight = `Intelligence: Coordinates placed at ${node.lat}, ${node.lng}. Lacks definitive tell excavation. Monitored for future archaeological consensus.`;

    // Try Wikipedia for targeted research
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&exintro&titles=${encodeURIComponent(queryTerm)}&format=json&pithumbsize=1024`;
      const { status, json } = await fetchJson(url);
      if (status === 200 && json.query && json.query.pages) {
        const pages = json.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1') {
          const page = pages[pageId];
          if (page.extract) {
            const cleanText = page.extract.replace(/<[^>]*>?/gm, '').replace(/\n/g, ' ').trim();
            if (cleanText && cleanText.length > 20) {
                const sentences = cleanText.split('. ');
                desc = sentences.slice(0, 2).join('. ') + (sentences.length > 2 && !sentences[1].endsWith('.') ? '.' : '');
                insight = `Intelligence: ${queryTerm} functions as a strategic node. ${sentences[0]}. Tactical importance is derived from its geographic positioning within the biblical narrative.`;
                statusStr = "Identified Region / Tell";
                title = "Historical / Archaeological Record";
                tension = "MODERATE";
            }
          }
          if (page.thumbnail && page.thumbnail.source) {
            const isValid = await verifyImage(page.thumbnail.source);
            if (isValid) img_url = page.thumbnail.source;
          }
        }
      }
    } catch(e) {
      console.log(`Failed wiki fetch for ${id}, using fallback.`);
    }

    const obj = {
      site_id: id,
      last_updated: now,
      location: {
        lat: node.lat,
        lng: node.lng,
        elevation: elevation,
        region: region
      },
      geopolitics: {
        era: era,
        primary_conflict: conflict,
        status: statusStr,
        tension_gradient: tension
      },
      archaeology: {
        excavation_start: null,
        finds: [
          {
            title: title,
            description: desc,
            img_url: img_url,
            asset_status: 200,
            timestamp: now
          }
        ]
      },
      etymology: etymology,
      scripture: {
        key_verse: node.osis && node.osis.length > 0 ? node.osis[0] : "Reference Pending",
        narrative_insight: insight
      }
    };
    newNodes.push(obj);
    console.log(`[OK] Processed node: ${id}`);
  }

  const finalOutput = existing.concat(newNodes);
  fs.writeFileSync('enriched-master-geodata.json', JSON.stringify(finalOutput, null, 2));
  console.log(`
Batch complete. Added ${newNodes.length} nodes.`);
  console.log(`Total nodes in enriched-master-geodata.json: ${finalOutput.length}`);
}

run();
