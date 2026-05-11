/**
 * SYZYGY Workspace Add-on — Code.gs (entry)
 *
 * Skin layer for the Apps Script side. Imports nothing directly — the Bone
 * (`lib/core-engine.js`) is pasted into this Apps Script project as a sibling
 * .gs file (rename to CoreEngine.gs in the Apps Script editor; content stays
 * UMD-style — its IIFE runs at load and assigns `SyzygyCoreEngine` to the
 * global namespace, accessible from this file).
 *
 * Entry points (registered in appsscript.json):
 *   - onHomepage(e)             — Drive/Gmail/Calendar add-on home card
 *   - onDriveItemsSelected(e)   — Drive-specific selection trigger
 *   - handleOpenVault(e)        — CardService action: navigate to Vault view
 *
 * Brand: 864z Minimalist (Obsidian + Sage palette; matches Strike-033 fleet tokens).
 *
 * Strike: SYZYGY-001
 */

// ============================================================
// 864z Minimalist Brand Palette (Obsidian/Sage)
// Aligned with Strike-033 fleet tokens (--864z-bg dark variant + --oia-sage).
// CardService doesn't accept CSS variables — hex literals required.
// ============================================================
var BRAND = {
  obsidian:           '#0B0E14',  // dark-mode --864z-bg
  obsidian_alt:       '#1F2937',  // dark-mode --864z-border
  parchment:          '#F5F2ED',  // light-mode --864z-bg
  sage:               '#8BA888',  // --oia-sage  (accent)
  text_on_obsidian:   '#E5E7EB',
  text_on_parchment:  '#111827'
};

// ============================================================
// Homepage card — first surface the user sees
// ============================================================
function onHomepage(e) {
  var engine = SyzygyCoreEngine;
  var version = engine && engine.VERSION ? engine.VERSION : 'unknown';

  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('864zeros Trust Vault')
      .setSubtitle('Sovereign Custody · Local-First')
  );

  // ----- Brand Mission section -----
  var missionSection = CardService.newCardSection().setHeader('Your Guarantee');
  missionSection.addWidget(
    CardService.newTextParagraph().setText(
      '<b>No Ads. No Tracking.</b> Your data stays yours. ' +
      'Snapshots are encrypted in the Vault; once exported, the file is in your custody.'
    )
  );
  card.addSection(missionSection);

  // ----- Drive Vault entry -----
  var vaultSection = CardService.newCardSection().setHeader('Drive Vault');
  vaultSection.addWidget(
    CardService.newTextParagraph().setText('Browse and back up the contents of your Drive — local-first, no proxy.')
  );
  vaultSection.addWidget(
    CardService.newTextButton()
      .setText('Open Vault')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(BRAND.sage)
      .setOnClickAction(CardService.newAction().setFunctionName('handleOpenVault'))
  );
  card.addSection(vaultSection);

  // ----- Footer -----
  card.setFixedFooter(
    CardService.newFixedFooter()
      .setPrimaryButton(
        CardService.newTextButton()
          .setText('Privacy')
          .setOpenLink(
            CardService.newOpenLink().setUrl('https://864zeros.com/privacy')
          )
      )
      .setSecondaryButton(
        CardService.newTextButton()
          .setText('v' + version)
          .setOnClickAction(CardService.newAction().setFunctionName('handleVersionTap'))
      )
  );

  return card.build();
}

// ============================================================
// Drive: items-selected trigger (Drive-specific entry)
// ============================================================
function onDriveItemsSelected(e) {
  var selected = (e && e.drive && e.drive.selectedItems) ? e.drive.selectedItems : [];
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Trust Vault · Selection')
      .setSubtitle(selected.length + ' item' + (selected.length === 1 ? '' : 's') + ' selected')
  );
  var section = CardService.newCardSection();
  if (selected.length === 0) {
    section.addWidget(
      CardService.newTextParagraph().setText('Select files in Drive to add them to the Vault.')
    );
  } else {
    selected.slice(0, 10).forEach(function (item) {
      section.addWidget(
        CardService.newKeyValue()
          .setTopLabel(item.mimeType || 'file')
          .setContent(item.title || item.id)
      );
    });
  }
  card.addSection(section);
  return card.build();
}

// ============================================================
// CardService action handlers
// ============================================================
function handleOpenVault(e) {
  var engine = SyzygyCoreEngine;

  // Read current tier from chunked PropertiesService via the Bone's storage wrapper.
  // Engine functions are async/Promise-returning — Apps Script V8 supports await,
  // but CardService handlers must return synchronously. We resolve the Promise
  // via Promise.then→pass-through; for the Strike-001 stub we read sync-ish from
  // the in-process Promise chain or use a simpler getProperty fallback.
  var tier = 'free';
  try {
    var raw = PropertiesService.getUserProperties().getProperty('864z_billing_tier');
    if (raw) tier = JSON.parse(raw);
  } catch (err) { /* defensive */ }

  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Vault Browser')
      .setSubtitle('Tier: ' + tier)
  );

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph().setText(
      'Drive directory listing wires through the core-engine.js Bone — ' +
      'a stateless call to driveListDirectory(accessToken, folderId). ' +
      'Strike-002 fills in the OAuth + per-item card rendering.'
    )
  );
  section.addWidget(
    CardService.newTextButton()
      .setText('Back')
      .setOnClickAction(CardService.newAction().setFunctionName('handleHome'))
  );
  card.addSection(section);

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card.build()))
    .build();
}

function handleHome(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().popToRoot())
    .build();
}

function handleVersionTap(e) {
  var engine = SyzygyCoreEngine;
  var version = engine && engine.VERSION ? engine.VERSION : 'unknown';
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText('SYZYGY Core Engine v' + version)
    )
    .build();
}
