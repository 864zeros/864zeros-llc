// ============================================================
// INSIGHTFORGE FEATURE SCAFFOLD
// Template for AI-powered analysis features that work across
// multiple clips. Uses credit system for pay-per-use.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js
// ============================================================

// Add to MESSAGE_TYPES:
export const MESSAGE_TYPES = {
  // ... existing types ...

  // InsightForge features
  SYNTHESIZE_CLIPS: 'SYNTHESIZE_CLIPS',
  ASK_CLIPS: 'ASK_CLIPS',
  GENERATE_REPORT: 'GENERATE_REPORT',
};

// Add to FEATURE_TIERS:
export const FEATURE_TIERS = {
  // ... existing tiers ...

  // InsightForge features (Power tier + credits)
  'synthesize-clips': 'power',
  'ask-clips': 'power',
  'research-report': 'power',
};

// Add to CREDIT_CONFIG:
export const CREDIT_CONFIG = {
  // ... existing config ...
  costs: {
    // ... existing costs ...
    'synthesize-clips': 3,  // Multi-clip analysis
    'ask-clips': 2,         // Question answering
    'research-report': 5,   // Full report generation
  },
};


// ============================================================
// STEP 2: Service Worker Handler (background/service-worker.js)
// ============================================================

import { getFeatureAccess } from '../lib/tiers.js';
import { canAfford, deduct } from '../lib/credits.js';
import { analyze } from '../lib/api-client.js';

// Add to message handler switch:
case MESSAGE_TYPES.SYNTHESIZE_CLIPS:
  return handleSynthesizeClips(payload);

// Handler:
async function handleSynthesizeClips(payload) {
  const featureId = 'synthesize-clips';

  try {
    // 1. Check tier access
    const hasAccess = await getFeatureAccess(featureId);
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'power' };
    }

    // 2. Check credits
    const affordCheck = await canAfford(featureId);
    if (!affordCheck.canAfford) {
      return {
        success: false,
        error: 'insufficient_credits',
        cost: affordCheck.cost,
        balance: affordCheck.balance
      };
    }

    // 3. Get clips from database
    const clips = [];
    for (const clipId of payload.clipIds) {
      const clip = await get('clips', clipId);
      if (clip) clips.push(clip);
    }

    if (clips.length < 2) {
      return { success: false, error: 'Need at least 2 clips to synthesize' };
    }

    // 4. Build combined content for AI
    const contentParts = clips.map((clip, i) => {
      if (clip.clipType === 'screenshot' || clip.clipType === 'marquee') {
        return `[Clip ${i + 1}]: (Screenshot from ${clip.sourceTitle || clip.sourceUrl})`;
      }
      const content = clip.content.length > 500
        ? clip.content.substring(0, 500) + '...'
        : clip.content;
      return `[Clip ${i + 1} from ${clip.sourceTitle || 'Unknown'}]:\n${content}`;
    });

    const combinedContent = contentParts.join('\n\n---\n\n');

    // 5. Call AI with synthesis prompt
    const instruction = `Analyze these ${clips.length} clips and provide a synthesis. Return a JSON object with:
- "themes": array of 2-4 common themes across the clips
- "insights": array of 3-5 key insights or takeaways
- "connections": array of 2-3 connections or relationships between the clips
- "summary": a 2-3 sentence overall summary

Return ONLY valid JSON, no other text.`;

    const result = await analyze(combinedContent, instruction);

    if (!result.success) {
      return { success: false, error: result.error || 'AI synthesis failed' };
    }

    // 6. Parse AI response
    let synthesis = {};
    try {
      const jsonMatch = result.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesis = JSON.parse(jsonMatch[0]);
      } else {
        synthesis = JSON.parse(result.result);
      }
    } catch (parseError) {
      synthesis = {
        themes: ['Unable to parse themes'],
        insights: [result.result],
        connections: [],
        summary: 'AI response could not be structured properly.'
      };
    }

    // 7. Deduct credits AFTER success
    const deductResult = await deduct(featureId, `Synthesized ${clips.length} clips`);

    return {
      success: true,
      synthesis,
      newBalance: deductResult.newBalance,
      clipsAnalyzed: clips.length
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 3: UI Trigger (sidepanel/main.js)
// ============================================================

// Add button in bulk action bar:
const bulkSynthesizeBtn = document.getElementById('bulk-synthesize');

if (bulkSynthesizeBtn) {
  bulkSynthesizeBtn.addEventListener('click', async () => {
    if (selectedClipIds.size < 2) {
      showToast('Select at least 2 clips to synthesize', 'warning');
      return;
    }

    // Check tier
    const tierResponse = await chrome.runtime.sendMessage({
      type: 'CHECK_FEATURE_ACCESS',
      payload: { feature: 'synthesize-clips' }
    }).catch(() => ({ hasAccess: false }));

    if (!tierResponse?.hasAccess) {
      showUpgradePrompt('synthesize-clips', 'power');
      return;
    }

    // Check credits
    const creditResponse = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_CREDITS
    }).catch(() => ({ balance: 0 }));

    const cost = 3; // Match CREDIT_CONFIG
    if (creditResponse.balance < cost) {
      showCreditsPrompt(cost, creditResponse.balance);
      return;
    }

    // Perform synthesis
    await performSynthesis();
  });
}

async function performSynthesis() {
  const btn = document.getElementById('bulk-synthesize');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="oia-spin">...</span> Analyzing...';
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SYNTHESIZE_CLIPS,
      payload: { clipIds: Array.from(selectedClipIds) }
    });

    if (response.success) {
      showSynthesisResults(response.synthesis, response.newBalance);
    } else if (response.error === 'tier_required') {
      showUpgradePrompt('synthesize-clips', response.requiredTier);
    } else if (response.error === 'insufficient_credits') {
      showCreditsPrompt(response.cost, response.balance);
    } else {
      showToast(response.error || 'Synthesis failed', 'error');
    }
  } catch (error) {
    showToast('Could not analyze clips', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg>...</svg> Synthesize';
    }
  }
}


// ============================================================
// STEP 4: Results Modal (sidepanel/main.js)
// ============================================================

function showSynthesisResults(synthesis, newBalance) {
  const modal = document.getElementById('synthesis-modal');
  const resultsContainer = document.getElementById('synthesis-results');
  const creditsDisplay = document.getElementById('synthesis-credits');

  if (!modal || !resultsContainer) return;

  // Render synthesis sections
  resultsContainer.innerHTML = `
    <div class="synthesis-section">
      <div class="synthesis-section__title">
        <svg width="16" height="16">...</svg>
        Key Themes
      </div>
      <ul class="synthesis-section__list">
        ${synthesis.themes?.map(t => `<li>${escapeHtml(t)}</li>`).join('') || '<li>No themes identified</li>'}
      </ul>
    </div>

    <div class="synthesis-section">
      <div class="synthesis-section__title">
        <svg width="16" height="16">...</svg>
        Insights
      </div>
      <ul class="synthesis-section__list">
        ${synthesis.insights?.map(i => `<li>${escapeHtml(i)}</li>`).join('') || '<li>No insights generated</li>'}
      </ul>
    </div>

    <div class="synthesis-section">
      <div class="synthesis-section__title">
        <svg width="16" height="16">...</svg>
        Connections
      </div>
      <ul class="synthesis-section__list">
        ${synthesis.connections?.map(c => `<li>${escapeHtml(c)}</li>`).join('') || '<li>No connections found</li>'}
      </ul>
    </div>

    ${synthesis.summary ? `
    <div class="synthesis-section">
      <div class="synthesis-section__title">Summary</div>
      <p>${escapeHtml(synthesis.summary)}</p>
    </div>
    ` : ''}
  `;

  if (creditsDisplay && newBalance !== undefined) {
    creditsDisplay.textContent = `${newBalance} credits remaining`;
  }

  modal.style.display = 'flex';

  // Close handlers
  document.getElementById('synthesis-close')?.addEventListener('click', () => {
    modal.style.display = 'none';
  }, { once: true });

  document.getElementById('synthesis-done')?.addEventListener('click', () => {
    modal.style.display = 'none';
  }, { once: true });
}


// ============================================================
// STEP 5: HTML Components (sidepanel/index.html)
// ============================================================

/*
<!-- Synthesize button in bulk action bar -->
<button class="oia-btn oia-btn-primary oia-btn-sm bulk-action-bar__synthesize" id="bulk-synthesize">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
    <path d="M8 12h8"/>
  </svg>
  Synthesize
</button>

<!-- Synthesis Results Modal -->
<div class="synthesis-modal" id="synthesis-modal" style="display: none;">
  <div class="oia-card synthesis-modal__content">
    <div class="synthesis-modal__header">
      <h3 class="oia-h3">Insights</h3>
      <button class="synthesis-modal__close" id="synthesis-close">
        <svg width="20" height="20">...</svg>
      </button>
    </div>
    <div class="synthesis-modal__body" id="synthesis-results">
      <!-- Results populated by JS -->
    </div>
    <div class="synthesis-modal__footer">
      <span class="synthesis-modal__credits" id="synthesis-credits"></span>
      <button class="oia-btn oia-btn-secondary" id="synthesis-done">Done</button>
    </div>
  </div>
</div>

<!-- Credits Prompt Modal -->
<div class="credits-modal" id="credits-modal" style="display: none;">
  <div class="oia-card credits-modal__content">
    <div class="credits-modal__icon">
      <svg width="48" height="48">...</svg>
    </div>
    <h3 class="oia-h3">Need More Credits</h3>
    <p>This action requires <strong id="credits-needed">0</strong> credits.
       You have <strong id="credits-balance">0</strong>.</p>
    <div class="credits-modal__packs" id="credits-packs">
      <!-- Credit packs populated by JS -->
    </div>
    <div class="credits-modal__actions">
      <button class="oia-btn oia-btn-secondary" id="credits-cancel">Cancel</button>
    </div>
  </div>
</div>
*/


// ============================================================
// STEP 6: Styles (sidepanel/styles.css)
// ============================================================

/*
.synthesis-modal,
.credits-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  padding: var(--oia-space-md);
}

.synthesis-modal__content {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.synthesis-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--oia-space-md);
  border-bottom: 1px solid rgba(166, 148, 133, 0.2);
}

.synthesis-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--oia-space-md);
}

.synthesis-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--oia-space-md);
  border-top: 1px solid rgba(166, 148, 133, 0.2);
}

.synthesis-section {
  margin-bottom: var(--oia-space-lg);
}

.synthesis-section__title {
  font-size: var(--oia-size-body-sm);
  font-weight: var(--oia-weight-semibold);
  color: var(--oia-sage);
  margin-bottom: var(--oia-space-sm);
  display: flex;
  align-items: center;
  gap: var(--oia-space-xs);
}

.synthesis-section__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.synthesis-section__list li {
  padding: var(--oia-space-xs) 0;
  padding-left: var(--oia-space-md);
  position: relative;
}

.synthesis-section__list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background-color: var(--oia-sage);
  border-radius: 50%;
}

.bulk-action-bar__synthesize {
  background-color: var(--oia-sage);
  border-color: var(--oia-sage);
  color: var(--oia-ivory);
}

.oia-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
*/


// ============================================================
// PATTERN: Other InsightForge Features
// ============================================================

// "Ask Your Clips" - Query clips with natural language
async function handleAskClips(payload) {
  // payload: { question, clipIds (optional - if empty, search all) }
  const instruction = `Based on these clips, answer the following question: "${payload.question}"

  Provide a clear, concise answer based only on information in the clips.
  If the clips don't contain relevant information, say so.`;

  // ... similar pattern to synthesis
}

// "Generate Report" - Create a structured document
async function handleGenerateReport(payload) {
  // payload: { clipIds, reportType: 'summary' | 'research' | 'brief' }
  const instruction = `Generate a ${payload.reportType} report from these clips.

  Structure the report with:
  - Executive Summary
  - Key Findings
  - Supporting Details
  - Recommendations (if applicable)
  - Sources

  Return as formatted markdown.`;

  // ... similar pattern to synthesis
}


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Synthesize button appears in bulk action bar
// [ ] Button disabled until 2+ clips selected
// [ ] Tier check blocks non-Power users
// [ ] Credit check shows prompt when insufficient
// [ ] AI call succeeds with valid response
// [ ] JSON parsing handles edge cases
// [ ] Credits deducted after success
// [ ] Results modal displays correctly
// [ ] Close/Done buttons work
// [ ] Credit balance updates in UI
// [ ] Error states handled gracefully
//
