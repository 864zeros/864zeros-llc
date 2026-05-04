/**
 * JSON-LD Construction Utilities
 * Helpers for building typed JSON-LD nodes
 */

// TODO: Implement with adapters
export function createNode(id, type, label, source, extra = {}) {
  return {
    '@id': id,
    '@type': type,
    'rdfs:label': label,
    'aether:origin': 'core',
    'aether:source': source,
    'aether:retrieved': new Date().toISOString(),
    ...extra
  };
}
