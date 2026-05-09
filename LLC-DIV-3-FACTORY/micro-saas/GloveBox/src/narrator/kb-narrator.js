/**
 * KB Narrator
 * Uses LLM to generate first-person narrative from knowledge graph
 *
 * The car speaks about itself: "I'm a 2019 Honda Civic..."
 */

/**
 * Extract key facts from knowledge graph for narration
 */
function extractFacts(kg) {
  const nodes = kg['@graph'] || [];
  const facts = {
    vehicle: { vin: null, make: null, model: null, year: null, label: null },
    specs: [],
    recalls: [],
    issues: [],
    fuel: null,
    safety: null,
    maintenance: []
  };

  for (const node of nodes) {
    const id = node['@id'] || '';
    const label = node['rdfs:label'] || '';

    // Vehicle identity node
    if (id.startsWith('vehicle:')) {
      facts.vehicle.vin = node['aether:vin'];
      facts.vehicle.label = label;
      // These may or may not be present on vehicle node
      if (node['aether:make']) facts.vehicle.make = node['aether:make'];
      if (node['aether:model']) facts.vehicle.model = node['aether:model'];
      if (node['aether:year']) facts.vehicle.year = node['aether:year'];
    }
    // Specs - also extract Make/Model/Year from spec nodes
    else if (id.startsWith('spec:')) {
      const field = node['aether:field'];
      const value = node['aether:value'];
      facts.specs.push({ field, value });

      // Extract vehicle identity from spec nodes
      if (field === 'Make' && value) facts.vehicle.make = facts.vehicle.make || value;
      if (field === 'Model' && value) facts.vehicle.model = facts.vehicle.model || value;
      if (field === 'ModelYear' && value) facts.vehicle.year = facts.vehicle.year || value;
    }
    // Recalls
    else if (id.startsWith('recall:')) {
      facts.recalls.push({
        campaign: node['aether:campaign'],
        component: node['aether:component'],
        summary: node['aether:summary'],
        remedy: node['aether:remedy']
      });
    }
    // Complaints/Issues
    else if (id.startsWith('complaint:')) {
      facts.issues.push({
        component: node['aether:component'],
        count: node['aether:count'],
        hasCrash: node['aether:crash'],
        hasFire: node['aether:fire']
      });
    }
    // Fuel economy
    else if (id === 'fuel:economy') {
      facts.fuel = {
        city: node['aether:city_mpg'],
        highway: node['aether:highway_mpg'],
        combined: node['aether:combined_mpg'],
        annualCost: node['aether:annual_fuel_cost']
      };
    }
    // Safety
    else if (id === 'safety:overall') {
      facts.safety = {
        overall: node['aether:overall_rating'],
        frontal: node['aether:frontal_rating'],
        side: node['aether:side_rating'],
        rollover: node['aether:rollover_rating']
      };
    }
    // Maintenance
    else if (id.startsWith('maintenance:')) {
      facts.maintenance.push({
        service: node['aether:service_type'],
        intervalMiles: node['aether:interval_miles'],
        nextDue: node['aether:next_due_miles'],
        description: label
      });
    }
  }

  return facts;
}

/**
 * Build narration prompt from facts
 */
function buildPrompt(facts) {
  const v = facts.vehicle || {};
  const identity = `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() || 'vehicle';

  let prompt = `You are a ${identity}. Write a first-person narrative (500-800 words) describing yourself to your owner. Speak as if you ARE the car. Be helpful, informative, and personable.

Include the following information about yourself:

IDENTITY:
- VIN: ${v.vin || 'Unknown'}
- Year/Make/Model: ${identity}

`;

  // Specs
  if (facts.specs.length) {
    prompt += `SPECIFICATIONS:\n`;
    for (const spec of facts.specs.slice(0, 10)) {
      prompt += `- ${spec.field}: ${spec.value}\n`;
    }
    prompt += '\n';
  }

  // Safety
  if (facts.safety) {
    prompt += `SAFETY RATINGS:\n`;
    prompt += `- Overall: ${facts.safety.overall || 'N/A'} stars\n`;
    prompt += `- Frontal crash: ${facts.safety.frontal || 'N/A'} stars\n`;
    prompt += `- Side crash: ${facts.safety.side || 'N/A'} stars\n`;
    prompt += `- Rollover: ${facts.safety.rollover || 'N/A'} stars\n\n`;
  }

  // Fuel economy
  if (facts.fuel) {
    prompt += `FUEL ECONOMY:\n`;
    prompt += `- City: ${facts.fuel.city} MPG\n`;
    prompt += `- Highway: ${facts.fuel.highway} MPG\n`;
    prompt += `- Combined: ${facts.fuel.combined} MPG\n`;
    prompt += `- Annual fuel cost: $${facts.fuel.annualCost}\n\n`;
  }

  // Recalls
  if (facts.recalls.length) {
    prompt += `OPEN RECALLS (${facts.recalls.length}):\n`;
    for (const recall of facts.recalls) {
      prompt += `- ${recall.component}: ${recall.summary?.substring(0, 100) || 'See details'}...\n`;
      prompt += `  Remedy: ${recall.remedy?.substring(0, 100) || 'Contact dealer'}...\n`;
    }
    prompt += '\n';
  }

  // Known issues
  if (facts.issues.length) {
    const topIssues = facts.issues.slice(0, 5);
    prompt += `KNOWN ISSUES (top ${topIssues.length} by complaint volume):\n`;
    for (const issue of topIssues) {
      let warning = '';
      if (issue.hasCrash) warning += ' [crash reported]';
      if (issue.hasFire) warning += ' [fire reported]';
      prompt += `- ${issue.component}: ${issue.count} complaints${warning}\n`;
    }
    prompt += '\n';
  }

  // Maintenance
  if (facts.maintenance.length) {
    const upcoming = facts.maintenance.filter(m => m.nextDue).slice(0, 5);
    if (upcoming.length) {
      prompt += `UPCOMING MAINTENANCE:\n`;
      for (const maint of upcoming) {
        prompt += `- ${maint.description} (next due: ${maint.nextDue?.toLocaleString()} miles)\n`;
      }
      prompt += '\n';
    }
  }

  prompt += `Write naturally as if you're introducing yourself to your new owner. Be proud of your strengths, honest about your issues, and helpful about maintenance. End with a friendly note about taking care of each other.`;

  return prompt;
}

/**
 * Generate KB narrative using LLM
 * @param {object} kg - Composed knowledge graph
 * @param {function} llmFn - LLM function (prompt) => response. If null, returns template.
 * @returns {Promise<string>} Markdown narrative
 */
export async function narrateKB(kg, llmFn) {
  const facts = extractFacts(kg);
  const prompt = buildPrompt(facts);

  // If no LLM function provided, return a template narrative
  if (!llmFn) {
    return generateTemplateNarrative(facts);
  }

  try {
    const response = await llmFn(prompt);
    return response;
  } catch (err) {
    console.warn('LLM narration failed, using template:', err.message);
    return generateTemplateNarrative(facts);
  }
}

/**
 * Generate template narrative without LLM
 */
function generateTemplateNarrative(facts) {
  const v = facts.vehicle || {};
  const identity = `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() || 'Your Vehicle';

  let md = `# Hello, I'm Your ${identity}\n\n`;

  md += `I'm glad to be part of your life. Let me tell you about myself.\n\n`;

  // Identity
  md += `## Who I Am\n\n`;
  md += `My VIN is **${v.vin || 'not recorded'}**. `;
  md += `I'm a **${identity}**, and I'm here to get you where you need to go.\n\n`;

  // Specs
  if (facts.specs.length) {
    md += `## My Specifications\n\n`;
    for (const spec of facts.specs.slice(0, 8)) {
      md += `- **${spec.field}**: ${spec.value}\n`;
    }
    md += '\n';
  }

  // Safety
  if (facts.safety && facts.safety.overall) {
    md += `## Safety\n\n`;
    md += `I scored **${facts.safety.overall} out of 5 stars** in NHTSA crash testing. `;
    if (facts.safety.overall >= 4) {
      md += `I'll do my best to keep you safe.\n\n`;
    } else {
      md += `Please drive carefully.\n\n`;
    }
  }

  // Fuel
  if (facts.fuel) {
    md += `## Fuel Economy\n\n`;
    md += `I get about **${facts.fuel.city} MPG in the city** and **${facts.fuel.highway} MPG on the highway**. `;
    md += `That works out to around **$${facts.fuel.annualCost} per year** in fuel costs.\n\n`;
  }

  // Recalls
  if (facts.recalls.length) {
    md += `## Important: Open Recalls\n\n`;
    md += `⚠️ I have **${facts.recalls.length} open recall(s)** that need attention:\n\n`;
    for (const recall of facts.recalls) {
      md += `- **${recall.component}**: ${recall.summary?.substring(0, 150) || 'Contact dealer for details'}...\n`;
    }
    md += `\nPlease contact your dealer to schedule these repairs — they're free.\n\n`;
  }

  // Issues
  if (facts.issues.length > 0) {
    md += `## Known Issues\n\n`;
    md += `Other owners have reported some issues with my model:\n\n`;
    for (const issue of facts.issues.slice(0, 3)) {
      md += `- **${issue.component}**: ${issue.count} complaints reported\n`;
    }
    md += `\nKeep an eye on these areas during maintenance.\n\n`;
  }

  // Maintenance
  if (facts.maintenance.length) {
    const upcoming = facts.maintenance.filter(m => m.nextDue).slice(0, 3);
    if (upcoming.length) {
      md += `## Upcoming Maintenance\n\n`;
      md += `Here's what I'll need soon:\n\n`;
      for (const maint of upcoming) {
        md += `- **${maint.service.replace(/_/g, ' ')}** at ${maint.nextDue?.toLocaleString()} miles\n`;
      }
      md += '\n';
    }
  }

  md += `---\n\n`;
  md += `*Take care of me, and I'll take care of you. Let's go places together.*\n`;

  return md;
}
