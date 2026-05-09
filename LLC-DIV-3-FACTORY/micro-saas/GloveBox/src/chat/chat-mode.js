/**
 * Chat Mode
 * Interactive conversation with your car
 *
 * Usage:
 *   node src/index.js chat --vin <VIN>
 */

import readline from 'readline';
import { findGloveBoxByVIN } from '../capsule/stamper.js';
import { chat, detectProvider } from './llm-client.js';

/**
 * Extract data sources from KG
 */
function extractDataSources(kg) {
  if (!kg || !kg['@graph']) return [];

  const sources = new Map();
  const sourceLabels = {
    'nhtsa-vin-api': 'NHTSA VIN Decoder (vehicle specifications)',
    'nhtsa-vin': 'NHTSA VIN Decoder (vehicle specifications)',
    'nhtsa-recalls': 'NHTSA Recalls Database (safety recalls)',
    'nhtsa-complaints': 'NHTSA Complaints Database (owner-reported issues)',
    'nhtsa-safety': 'NHTSA Safety Ratings (crash test results)',
    'epa-fuel': 'EPA Fuel Economy Database (MPG ratings)',
    'maintenance-schedule': 'Manufacturer Maintenance Schedule'
  };

  for (const node of kg['@graph']) {
    const source = node['aether:source'];
    if (source && !sources.has(source)) {
      sources.set(source, sourceLabels[source] || source);
    }
  }

  return Array.from(sources.values());
}

/**
 * Build system prompt from capsule data
 */
function buildSystemPrompt(capsule) {
  const manifest = capsule.manifest;
  const persona = capsule.persona || {};
  const kb = capsule.kb || '';
  const kg = capsule.kg || {};

  const vehicle = manifest.vehicle || {};
  const identity = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle';

  const voice = persona.voice || {};
  const tone = voice.tone || 'helpful and friendly';
  const style = voice.style || 'Speak naturally and helpfully.';
  const traits = (voice.traits || []).join(', ') || 'helpful, knowledgeable';

  const boundaries = persona.boundaries || {};
  const authoritative = (boundaries.authoritative_on || []).join(', ');
  const notAuthoritative = (boundaries.not_authoritative_on || []).join(', ');
  const defersTo = (boundaries.defers_to || []).join(', ');

  // Extract data sources from KG
  const dataSources = extractDataSources(kg);
  const dataSourcesText = dataSources.length > 0
    ? dataSources.map(s => `- ${s}`).join('\n')
    : '- Vehicle knowledge base';

  return `You are a ${identity}. You speak in first person AS the car itself.

IDENTITY:
- VIN: ${manifest.vin}
- Year/Make/Model: ${identity}

PERSONALITY:
- Tone: ${tone}
- Style: ${style}
- Traits: ${traits}

BOUNDARIES:
- You ARE authoritative on: ${authoritative}
- You are NOT authoritative on: ${notAuthoritative}
- When uncertain, defer to: ${defersTo}

DATA SOURCES (where your knowledge comes from):
${dataSourcesText}

When asked about your data sources, you CAN and SHOULD explain that your knowledge was compiled from these official government and manufacturer databases. This data was collected when your GloveBox profile was created.

KNOWLEDGE BASE:
${kb}

RULES:
1. Always speak as "I" - you ARE the car
2. Be concise but helpful (2-4 sentences typical)
3. If asked about something not in your knowledge base, say so honestly
4. For recalls, emphasize they're free to fix at the dealer
5. For maintenance, reference the mileage if known
6. Never make up specifications or data
7. If asked about other cars, politely explain you can only speak about yourself
8. If asked about your data sources, explain they came from NHTSA and EPA databases

Example responses:
- "I have 3 open recalls for my fuel pump. You should take me to a Honda dealer - the repairs are free."
- "I get about 30 MPG in the city and 37 on the highway. Pretty efficient for a sedan!"
- "My specs came from the NHTSA VIN decoder, my fuel economy from EPA, and my recall info from NHTSA's recall database."`;
}

/**
 * Start interactive chat session
 */
export async function startChat(vin) {
  // Load capsule
  const capsule = findGloveBoxByVIN(vin);

  if (!capsule) {
    console.error(`\n  No GloveBox found for VIN: ${vin}`);
    console.error(`  Run: node src/index.js create --vin ${vin}\n`);
    process.exit(1);
  }

  // Check for API key
  const provider = detectProvider();
  if (!provider) {
    console.error(`
  No LLM API key found!

  Add one of these to your .env file:
    ANTHROPIC_API_KEY=sk-ant-...
    OPENAI_API_KEY=sk-...

  Or set as environment variable before running.
`);
    process.exit(1);
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(capsule);

  // Get vehicle identity for display
  const vehicle = capsule.manifest.vehicle || {};
  const identity = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Your Vehicle';

  console.log(`
════════════════════════════════════════════════════════════════
  GLOVEBOX Chat - ${identity}
════════════════════════════════════════════════════════════════
  VIN: ${capsule.manifest.vin}
  Provider: ${provider === 'anthropic' ? 'Claude (Anthropic)' : 'GPT-4 (OpenAI)'}

  Type your questions. Commands:
    exit, quit, q  - End chat
    clear          - Clear conversation history
    help           - Show this help
════════════════════════════════════════════════════════════════
`);

  // Conversation history
  const messages = [];

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Greeting
  console.log(`Car: Hello! I'm your ${identity}. What would you like to know about me?\n`);

  // Chat loop
  const prompt = () => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      // Handle commands
      if (!trimmed) {
        prompt();
        return;
      }

      if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
        console.log('\nCar: Take care! Drive safe.\n');
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'clear') {
        messages.length = 0;
        console.log('\n[Conversation cleared]\n');
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'help') {
        console.log(`
  Commands:
    exit, quit, q  - End chat
    clear          - Clear conversation history
    help           - Show this help

  Example questions:
    "Do I have any recalls?"
    "What's my fuel economy?"
    "When is my next oil change?"
    "Tell me about yourself"
    "What safety rating do I have?"
`);
        prompt();
        return;
      }

      // Add user message to history
      messages.push({ role: 'user', content: trimmed });

      try {
        // Call LLM
        process.stdout.write('Car: ');
        const response = await chat(systemPrompt, messages, provider);
        console.log(response + '\n');

        // Add assistant response to history
        messages.push({ role: 'assistant', content: response });

      } catch (err) {
        console.error(`\n[Error: ${err.message}]\n`);
        // Remove failed user message
        messages.pop();
      }

      prompt();
    });
  };

  prompt();
}
