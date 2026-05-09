const fs = require('fs');
const https = require('https');
const http = require('http');

// Configuration
const INPUT_FILE = 'enriched-master-geodata.json';
const OUTPUT_FILE = 'enriched-master-geodata-with-images.json';
const SERP_API_KEY = process.env.SERP_API_KEY; 

// Whitelist Domains
const WHITELIST = [
  'discover.iaa.org.il',
  'bibleplaces.com',
  'biblicalarchaeology.org',
  'asor.org',
  'dornsife.usc.edu/wsrp'
];

function verifyImage(url) {
  return new Promise((resolve) => {
    try {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve(res.statusCode === 200 && (res.headers['content-type'] || '').startsWith('image/'));
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) { resolve(false); }
  });
}

async function searchImage(keyword) {
  // Ultra-simple query for higher hit rate on whitelisted sites
  const query = `"${keyword}" site:biblicalarchaeology.org OR site:bibleplaces.com`;
  const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_images&api_key=${SERP_API_KEY}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
             console.log(`    [SerpApi Error]: ${json.error}`);
             resolve([]);
          } else {
             resolve(json.images_results || []);
          }
        } catch (e) { resolve([]); }
      });
    });
    req.on('error', (e) => {
      console.log(`    [Network Error]: ${e.message}`);
      resolve([]);
    });
    req.setTimeout(10000, () => { req.destroy(); resolve([]); });
  });
}

async function run() {
  console.log(`Starting Image Sourcing Protocol...`);
  
  if (!SERP_API_KEY) {
    console.error("FATAL: SERP_API_KEY environment variable is not set.");
    return;
  }

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`FATAL: Input file ${INPUT_FILE} not found.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  // Start from node 6 (index 5) and take the next 89 nodes
  // This will bring total usage to 94 searches (preserving 6 credits safety margin)
  const batchStartIndex = 5;
  const batchSize = 89;
  const testData = data.slice(batchStartIndex, batchStartIndex + batchSize);

  console.log(`Loaded ${data.length} nodes. Processing Batch 2: Nodes ${batchStartIndex + 1} to ${batchStartIndex + testData.length}...`);

  for (let i = 0; i < testData.length; i++) {
    const node = testData[i];
    const keyword = node.site_id || node.id;
    
    console.log(`\n[${i + 1}/${testData.length}] (Global ID: ${batchStartIndex + i + 1}) Searching: ${keyword}...`);
    
    const results = await searchImage(keyword);
    let found = false;

    if (results.length === 0) {
      console.log(`  -> No results found on whitelisted sites.`);
    }

    for (const result of results) {
      const imgUrl = result.original;
      if (!imgUrl || (!imgUrl.toLowerCase().endsWith('.jpg') && !imgUrl.toLowerCase().endsWith('.png'))) continue;

      process.stdout.write(`  -> Checking: ${imgUrl.substring(0, 50)}... `);
      const isValid = await verifyImage(imgUrl);
      
      if (isValid) {
        console.log(" [200 OK]");
        if (node.archaeology && node.archaeology.finds) {
          node.archaeology.finds[0].img_url = imgUrl;
          node.archaeology.finds[0].asset_status = 200;
        } else {
          node.media_uri = imgUrl;
        }
        found = true;
        break;
      } else {
        console.log(" [FAIL]");
      }
    }

    if (!found && results.length > 0) {
      console.log(`  -> All search results failed the 200 OK verification.`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\nTest Run Finished. Results saved to ${OUTPUT_FILE}`);
}

run();
