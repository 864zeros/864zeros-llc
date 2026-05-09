/**
 * Graph Composer
 * Merges adapter fragments into a single JSON-LD knowledge graph
 *
 * This is the core of GLOVEBOX. It:
 * 1. Flattens all adapter node arrays into a single array
 * 2. Deduplicates by @id (first occurrence wins)
 * 3. Wraps in JSON-LD structure with @context
 * 4. Adds vehicle identity node
 * 5. Generates relationship edges between nodes
 */

// JSON-LD @context for GLOVEBOX knowledge graphs
const GLOVEBOX_CONTEXT = {
  'skill': 'https://aether.864zeros.com/skill/',
  'aether': 'https://aether.864zeros.com/ns/',
  'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  'xsd': 'http://www.w3.org/2001/XMLSchema#',

  // Type shortcuts
  'Concept': 'skill:Concept',
  'Rule': 'skill:Rule',
  'AntiPattern': 'skill:AntiPattern',
  'Technique': 'skill:Technique',

  // Property shortcuts
  'label': 'rdfs:label',
  'origin': 'aether:origin',
  'source': 'aether:source',

  // Relationship types
  'requires': { '@id': 'aether:requires', '@type': '@id' },
  'avoids': { '@id': 'aether:avoids', '@type': '@id' },
  'enables': { '@id': 'aether:enables', '@type': '@id' },
  'contradicts': { '@id': 'aether:contradicts', '@type': '@id' },
  'hasRecall': { '@id': 'aether:hasRecall', '@type': '@id' },
  'hasIssue': { '@id': 'aether:hasIssue', '@type': '@id' },
  'hasService': { '@id': 'aether:hasService', '@type': '@id' }
};

/**
 * Extract vehicle info from adapter nodes
 */
function extractVehicleInfo(nodes) {
  let make = null, model = null, year = null, trim = null;

  for (const node of nodes) {
    const field = node['aether:field'];
    const value = node['aether:value'];

    if (field === 'Make' && value) make = value;
    if (field === 'Model' && value) model = value;
    if (field === 'ModelYear' && value) year = value;
    if (field === 'Trim' && value) trim = value;

    // Also check for vehicle node
    if (node['@id']?.startsWith('vehicle:') && node['aether:vin']) {
      // Extract from label if present
      const label = node['rdfs:label'] || '';
      const parts = label.split(' ');
      if (!year && parts[0]?.match(/^\d{4}$/)) year = parts[0];
      if (!make && parts[1]) make = parts[1];
      if (!model && parts[2]) model = parts[2];
    }
  }

  return { make, model, year, trim };
}

/**
 * Generate relationship edges between nodes
 */
function generateEdges(nodes, vin) {
  const edges = [];
  const vehicleId = `vehicle:${vin}`;

  // Find all recall nodes and link to vehicle
  const recallNodes = nodes.filter(n => n['@id']?.startsWith('recall:'));
  for (const recall of recallNodes) {
    edges.push({
      from: vehicleId,
      to: recall['@id'],
      type: 'hasRecall'
    });
  }

  // Find all complaint nodes and link to vehicle
  const complaintNodes = nodes.filter(n => n['@id']?.startsWith('complaint:'));
  for (const complaint of complaintNodes) {
    edges.push({
      from: vehicleId,
      to: complaint['@id'],
      type: 'hasIssue'
    });
  }

  // Find maintenance nodes and link to vehicle
  const maintenanceNodes = nodes.filter(n => n['@id']?.startsWith('maintenance:'));
  for (const maint of maintenanceNodes) {
    edges.push({
      from: vehicleId,
      to: maint['@id'],
      type: 'hasService'
    });
  }

  // Link recalls to related complaints (if same component)
  for (const recall of recallNodes) {
    const recallComponent = recall['aether:component']?.toLowerCase() || '';

    for (const complaint of complaintNodes) {
      const complaintComponent = complaint['aether:component']?.toLowerCase() || '';

      // If components match or overlap, create edge
      if (recallComponent && complaintComponent &&
          (recallComponent.includes(complaintComponent) ||
           complaintComponent.includes(recallComponent))) {
        edges.push({
          from: recall['@id'],
          to: complaint['@id'],
          type: 'requires' // Recall requires attention to this known issue
        });
      }
    }
  }

  // Oil change requires oil filter
  const oilChange = nodes.find(n => n['@id'] === 'maintenance:oil_change');
  if (oilChange) {
    // Add implicit dependency (oil change includes filter)
    oilChange['aether:includes'] = 'oil filter replacement';
  }

  return edges;
}

/**
 * Compose multiple adapter fragments into a single JSON-LD knowledge graph
 *
 * @param {Array<Array>} fragments - Array of arrays of JSON-LD nodes from each adapter
 * @param {string} vin - Vehicle Identification Number
 * @param {object} options - Optional configuration
 * @returns {object} Complete JSON-LD knowledge graph
 */
export function compose(fragments, vin, options = {}) {
  const timestamp = new Date().toISOString();

  // 1. Flatten all fragments into single array
  const allNodes = fragments.flat();

  // 2. Deduplicate by @id (first occurrence wins)
  const seenIds = new Set();
  const uniqueNodes = [];

  for (const node of allNodes) {
    const id = node['@id'];
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueNodes.push(node);
  }

  // 3. Extract vehicle info from nodes
  const vehicleInfo = extractVehicleInfo(uniqueNodes);

  // 4. Ensure vehicle identity node exists
  const vehicleNodeId = `vehicle:${vin}`;
  let vehicleNode = uniqueNodes.find(n => n['@id'] === vehicleNodeId);

  if (!vehicleNode) {
    // Create vehicle identity node
    const identityLabel = [
      vehicleInfo.year,
      vehicleInfo.make,
      vehicleInfo.model,
      vehicleInfo.trim
    ].filter(Boolean).join(' ') || `Vehicle ${vin}`;

    vehicleNode = {
      '@id': vehicleNodeId,
      '@type': 'skill:Concept',
      'rdfs:label': identityLabel,
      'aether:origin': 'core',
      'aether:source': 'glovebox-composer',
      'aether:vin': vin,
      'aether:make': vehicleInfo.make,
      'aether:model': vehicleInfo.model,
      'aether:year': vehicleInfo.year,
      'aether:composed_at': timestamp
    };

    uniqueNodes.unshift(vehicleNode);
  }

  // 5. Generate relationship edges
  const edges = generateEdges(uniqueNodes, vin);

  // 6. Embed edges into nodes (JSON-LD style)
  for (const edge of edges) {
    const fromNode = uniqueNodes.find(n => n['@id'] === edge.from);
    if (fromNode) {
      const edgeKey = `aether:${edge.type}`;
      if (!fromNode[edgeKey]) {
        fromNode[edgeKey] = [];
      }
      if (Array.isArray(fromNode[edgeKey])) {
        fromNode[edgeKey].push({ '@id': edge.to });
      }
    }
  }

  // 7. Build complete JSON-LD graph
  const kg = {
    '@context': GLOVEBOX_CONTEXT,
    '@id': `glovebox:${vin}`,
    '@type': 'aether:KnowledgeGraph',
    'aether:vin': vin,
    'aether:composed_at': timestamp,
    'aether:node_count': uniqueNodes.length,
    'aether:edge_count': edges.length,
    '@graph': uniqueNodes
  };

  return kg;
}

/**
 * Get statistics about a composed knowledge graph
 */
export function getStats(kg) {
  const nodes = kg['@graph'] || [];

  const byType = {};
  const bySource = {};

  for (const node of nodes) {
    const type = node['@type'] || 'unknown';
    const source = node['aether:source'] || 'unknown';

    byType[type] = (byType[type] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  }

  return {
    nodeCount: nodes.length,
    edgeCount: kg['aether:edge_count'] || 0,
    byType,
    bySource
  };
}
