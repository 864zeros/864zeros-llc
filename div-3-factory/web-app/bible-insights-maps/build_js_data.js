const fs = require('fs');
const data = fs.readFileSync('enriched-master-geodata-with-images.json', 'utf8');
fs.writeFileSync('enriched-data.js', `const enrichedData = ${data};`);
console.log('Converted to enriched-data.js');