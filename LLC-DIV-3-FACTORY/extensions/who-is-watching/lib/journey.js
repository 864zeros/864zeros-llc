// ============================================================
// JOURNEY ANALYZER — Who Is Watching
// Transforms events into narrative storytelling with ASCII flow.
// ============================================================

export class JourneyAnalyzer {
  constructor(events, identities, vendors) {
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    this.identities = identities;
    this.vendors = vendors;
  }

  generateNarrative() {
    const milestones = this.extractMilestones();
    const flow = this.buildFlow(milestones);
    const ascii = this.renderASCIIFlow(flow);
    const story = this.generateStory(milestones);

    return { milestones, flow, ascii, story };
  }

  // ============================================================
  // MILESTONE EXTRACTION
  // ============================================================

  extractMilestones() {
    const milestones = [];
    const seen = new Set();

    for (const event of this.events) {
      const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Page load / landing - first vendor detected
      if (event.type === 'vendor_detected' && !seen.has('landed')) {
        seen.add('landed');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'landing',
          icon: '📍',
          title: 'You landed on the site',
          detail: `First tracker loaded: ${event.vendorName || event.vendorKey || 'Unknown'}`,
          vendors: [event.vendorName || event.vendorKey]
        });
      }

      // Company identification (B2B intent vendors)
      const intentVendors = ['6sense', '_6sense', 'sixsense', 'bombora', 'demandbase', 'clearbit', 'zoominfo'];
      if (event.type === 'vendor_detected' &&
          intentVendors.some(v => (event.vendorKey || '').toLowerCase().includes(v)) &&
          !seen.has('company_identified')) {
        seen.add('company_identified');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'identification',
          icon: '🏢',
          title: `${event.vendorName || event.vendorKey} identified your company`,
          detail: 'Firmographic data collected: company name, size, industry',
          vendors: [event.vendorName || event.vendorKey]
        });
      }

      // Identity assignment
      if (event.type === 'identity_detected' && !seen.has('id_' + event.identityType)) {
        seen.add('id_' + event.identityType);
        const shortValue = (event.identityValue || event.value || '').substring(0, 20);
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'identity',
          icon: '🆔',
          title: `${event.identityType} assigned`,
          detail: `Tracking ID: ${shortValue}${shortValue.length >= 20 ? '...' : ''}`,
          vendor: event.vendor,
          identityType: event.identityType
        });
      }

      // Consent interaction
      if (event.type === 'consent_detected' && !seen.has('consent')) {
        seen.add('consent');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'consent',
          icon: '⚖️',
          title: 'Consent banner detected',
          detail: `Platform: ${event.platform || 'Unknown'}`,
          platform: event.platform
        });
      }

      // Consent violation
      if (event.type === 'consent_violation') {
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'violation',
          icon: '⚠️',
          title: 'TRACKING AFTER REJECT',
          detail: event.description || 'Consent violation detected',
          severity: 'high'
        });
      }

      // Fingerprinting detected
      if (event.type === 'fingerprint_detected' && !seen.has('fingerprint_' + event.fingerprintType)) {
        seen.add('fingerprint_' + event.fingerprintType);
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'violation',
          icon: '👆',
          title: `${event.fingerprintType || 'Fingerprinting'} detected`,
          detail: event.method || 'Device fingerprinting attempt',
          severity: 'medium'
        });
      }

      // Engagement/interaction tracking (from behavioral signals)
      if (event.behavioralSignals?.includes('INTERACTION_DATA') && !seen.has('engagement')) {
        seen.add('engagement');
        const engagementVendors = this.getVendorsWithBehavior('INTERACTION_DATA');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'engagement',
          icon: '🖱️',
          title: 'Your interactions tracked',
          detail: 'Mouse movements, clicks, scroll depth captured',
          vendors: engagementVendors
        });
      }

      // Form capture
      if (event.behavioralSignals?.includes('FORM_CAPTURE') && !seen.has('form_capture')) {
        seen.add('form_capture');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'engagement',
          icon: '📝',
          title: 'Form field tracking active',
          detail: 'Input field values being captured',
          vendors: [event.vendorName || event.vendorKey]
        });
      }

      // Exit tracking (beacon requests)
      if (event.type === 'network_request' &&
          (event.url?.includes('beacon') || event.behavioralSignals?.includes('EXIT_TRACKING')) &&
          !seen.has('exit')) {
        seen.add('exit');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'exit',
          icon: '🚪',
          title: 'Exit tracking activated',
          detail: 'Data sent on page unload',
          vendor: event.vendorName || event.vendorKey
        });
      }

      // Cross-domain tracking
      if (event.behavioralSignals?.includes('CROSS_DOMAIN') && !seen.has('cross_domain')) {
        seen.add('cross_domain');
        milestones.push({
          time,
          timestamp: event.timestamp,
          type: 'tracking',
          icon: '🌐',
          title: 'Cross-domain tracking detected',
          detail: 'Your identity shared across sites',
          vendors: [event.vendorName || event.vendorKey]
        });
      }
    }

    // Sort milestones by timestamp
    return milestones.sort((a, b) => a.timestamp - b.timestamp);
  }

  // ============================================================
  // FLOW BUILDING
  // ============================================================

  buildFlow(milestones) {
    const phases = [];
    let currentPhase = null;

    for (const m of milestones) {
      const phaseType = this.getPhaseType(m.type);

      if (!currentPhase || currentPhase.type !== phaseType) {
        if (currentPhase && currentPhase.events.length > 0) {
          phases.push(currentPhase);
        }
        currentPhase = { type: phaseType, events: [] };
      }

      currentPhase.events.push(m);
    }

    if (currentPhase && currentPhase.events.length > 0) {
      phases.push(currentPhase);
    }

    return phases;
  }

  getPhaseType(milestoneType) {
    const mapping = {
      landing: 'entry',
      identification: 'profiling',
      identity: 'profiling',
      consent: 'consent',
      violation: 'violations',
      engagement: 'tracking',
      tracking: 'tracking',
      exit: 'exit'
    };
    return mapping[milestoneType] || 'tracking';
  }

  // ============================================================
  // ASCII FLOW DIAGRAM
  // ============================================================

  renderASCIIFlow(flow) {
    if (flow.length === 0) {
      return this.renderEmptyFlow();
    }

    const lines = [];
    lines.push('');
    lines.push('    ╔═══════════════════════════════════════════════════════════╗');
    lines.push('    ║              YOUR TRACKING JOURNEY                        ║');
    lines.push('    ╚═══════════════════════════════════════════════════════════╝');
    lines.push('');

    for (let i = 0; i < flow.length; i++) {
      const phase = flow[i];
      const isLast = i === flow.length - 1;

      // Calculate duration from previous phase
      let durationStr = '';
      if (i > 0 && phase.events[0] && flow[i - 1].events[0]) {
        const durationMs = phase.events[0].timestamp - flow[i - 1].events[0].timestamp;
        const durationSec = Math.round(durationMs / 1000);
        durationStr = durationSec > 0 ? ` +${durationSec}s ` : '';
      }

      // Phase header with box
      const phaseIcon = this.phaseEmoji(phase.type);
      const phaseName = phase.type.toUpperCase();
      const headerPadding = '═'.repeat(Math.max(0, 40 - phaseName.length - durationStr.length));
      lines.push(`    ╔═ ${phaseIcon} ${phaseName} ${headerPadding}${durationStr}═══╗`);
      lines.push('    ║');

      // Events in phase
      for (const event of phase.events) {
        const time = event.time;
        const icon = event.icon;
        const title = this.truncate(event.title, 38);
        lines.push(`    ║  ${time}  ${icon}  ${title}`);

        if (event.detail) {
          const detail = this.truncate(event.detail, 42);
          lines.push(`    ║                 ↳ ${detail}`);
        }
      }

      lines.push('    ║');
      lines.push('    ╚═══════════════════════════════════════════════════════════╝');

      // Connector to next phase
      if (!isLast) {
        lines.push('                          ↓');
        lines.push('');
      }
    }

    lines.push('');
    lines.push('    🏁 Journey archived');
    lines.push('');
    lines.push('    ───────────────────────────────────────────────────────────');
    lines.push('    Legend: 📍 Landing   🏢 Company ID   🆔 Identity   ⚖️ Consent');
    lines.push('            🖱️ Engagement  ⚠️ Violation   🚪 Exit   🌐 Cross-domain');
    lines.push('');

    return lines.join('\n');
  }

  renderEmptyFlow() {
    return `
    ╔═══════════════════════════════════════════════════════════╗
    ║              YOUR TRACKING JOURNEY                        ║
    ╚═══════════════════════════════════════════════════════════╝

    No significant tracking milestones detected in this session.
    This could mean:
    - The site has minimal tracking
    - The session was very short
    - Trackers are using techniques we don't yet detect

`;
  }

  phaseEmoji(type) {
    const map = {
      entry: '📍',
      profiling: '🏢',
      consent: '⚖️',
      tracking: '🖱️',
      violations: '⚠️',
      exit: '🚪'
    };
    return map[type] || '•';
  }

  // ============================================================
  // NARRATIVE STORY
  // ============================================================

  generateStory(milestones) {
    if (milestones.length === 0) {
      return 'No significant tracking activity was detected during this session.';
    }

    const parts = [];

    // Opening - landing
    const landing = milestones.find(m => m.type === 'landing');
    if (landing) {
      parts.push(`At ${landing.time}, you landed on the site.`);

      // Count vendors loaded quickly
      const earlyVendors = milestones.filter(m =>
        m.type === 'landing' ||
        (m.type === 'identity' && m.timestamp - landing.timestamp < 3000)
      );
      if (earlyVendors.length > 1) {
        parts.push(`Within seconds, multiple tracking systems initialized.`);
      }
    }

    // Company identification
    const companyId = milestones.find(m => m.type === 'identification');
    if (companyId) {
      parts.push(`Before you even clicked anything, ${companyId.title.toLowerCase()}.`);
    }

    // Identity tokens
    const identities = milestones.filter(m => m.type === 'identity');
    if (identities.length > 0) {
      const types = identities.map(i => i.identityType).join(', ');
      parts.push(`You were assigned ${identities.length} tracking identifier${identities.length > 1 ? 's' : ''} (${types}).`);
    }

    // Consent
    const consent = milestones.find(m => m.type === 'consent');
    if (consent) {
      parts.push(`A consent banner from ${consent.platform || 'the site'} was displayed.`);
    }

    // Engagement tracking
    const engagement = milestones.filter(m => m.type === 'engagement');
    if (engagement.length > 0) {
      const activities = engagement.map(e => {
        if (e.icon === '🖱️') return 'mouse movements';
        if (e.icon === '📝') return 'form inputs';
        return 'interactions';
      });
      parts.push(`Your ${[...new Set(activities)].join(' and ')} were tracked.`);
    }

    // Violations
    const violations = milestones.filter(m => m.type === 'violation');
    if (violations.length > 0) {
      parts.push(`⚠️ WARNING: ${violations.length} potential privacy violation${violations.length > 1 ? 's' : ''} detected (fingerprinting or consent issues).`);
    }

    // Cross-domain
    const crossDomain = milestones.find(m => m.icon === '🌐');
    if (crossDomain) {
      parts.push(`Your identity was shared across multiple domains.`);
    }

    // Summary
    const totalVendors = this.vendors?.length || 0;
    if (totalVendors > 5) {
      parts.push(`In total, ${totalVendors} tracking vendors monitored your visit.`);
    }

    return parts.join(' ');
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  getVendorsWithBehavior(signal) {
    return [...new Set(
      this.events
        .filter(e => e.behavioralSignals?.includes(signal))
        .map(e => e.vendorName || e.vendorKey)
        .filter(Boolean)
    )];
  }

  truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }
}

console.log('[who-is-watching] journey.js loaded');
