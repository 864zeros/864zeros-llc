# 864zeros Trust Vault: Terms & Custody Disclosures [v1.0]

**Authority:** Operator-authored legal/customer-facing language for the 864zeros Trust Vault feature. Both sections below are reproduced **verbatim** as supplied by the operator in Strike 030 — do NOT paraphrase, condense, or "improve" the copy. This is the source of truth for downstream legal-services hand-off (LegalZoom or equivalent) and for any in-extension or website rendering of the Custody Notice / Disclaimer.
**Loaded:** Before any LegalZoom (or similar) drafting session; before any in-extension or website surface renders Custody language.
**Authored:** 2026-05-11 by Operator (jeff.m.conn@gmail.com); installed by 864z-OA (Office Architect) per RULE-000 (Strike 030).
**Update protocol:** Treat the two verbatim sections below as immutable text unless the operator explicitly revises. Versioning row at §III tracks any operator-authorized changes. If any extension renders this copy, that rendering MUST be byte-exact (no paraphrase).
**Format note:** Follows the `864z-markdown-standard` (RULE-008) for the wrapping doc-block; the two verbatim sections themselves preserve the operator's exact formatting (including trailing spaces on bullet lines, which Markdown processors may render as soft line breaks).

---

## I. Sovereign Custody Notice + Mandatory Custody Disclaimer (operator-verbatim)

### Sovereign Custody Notice
Your data is private and encrypted while contained within the **864zeros Trust Vault**. 

* **1. Data Capture:** Snapshots (.md files) capture all user-entered content, including all data from the chat. 
* **2. Transfer of Responsibility:** Exporting a Snapshot moves this data into your **Local File System (Your Computer)**. Once a file is moved, shared, or uploaded to a third-party service, the **864zeros Privacy Guarantee** is void. 
* **3. Liability:** 864zeros LLC operates exclusively on a local-first, record-only basis. We assume no liability for the security, privacy, or usage of data once it has been exported from the application. 

**Your data, your custody, your responsibility.**

---

### Mandatory Custody Disclaimer
By selecting **'Export Data Backup,'** you are manually moving your private data out of the encrypted application environment and into your **Local File System (Your Computer).**

* **1. End of Jurisdiction:** Once data is exported to your computer, the **864zeros Privacy Guarantee** is void. This is a core part of our privacy guarantee; we cannot protect or track data stored in your local files. 
* **2. Personal Responsibility:** You are solely responsible for the security of your backup files (.md). Sharing, uploading to 'The Cloud,' or emailing these files breaks the Trust Vault and exposes your chat data. 
* **3. Import Warning:** Clicking **'Import Data Backup'** will permanently **OVERWRITE** your current application state with the data from your computer. 

**864zeros LLC is a record-only provider. We do not store, see, or recover your data once it leaves the application.**

---

## II. Cross-References

- [`864z-build-kit/references/core/trust-vault.js`](../core/trust-vault.js) — implementation of the Export Data Backup / Import Data Backup operations referenced in the Disclaimer (Strike 028).
- [`864z-build-kit/references/core/options-tier-init.js`](../core/options-tier-init.js) — `injectTrustVaultUI()` renders the Trust Vault UI that surfaces the Export / Import buttons (Strike 029).
- [`864z-build-kit/references/core/brand-identity.js`](../core/brand-identity.js) — `BRAND_MISSION` constant (the "Your data stays yours" attestation that complements this Notice).
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_GLOSSARY.md`](../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_GLOSSARY.md) — canonical definitions for "Local-First" + "Trust Vault" (Strike 030) + pending entries for "Sovereign Custody" / "Mandatory Custody" derived from this file.
- [`864zeros-ISD/ISD-DIV-5-EVOLUTION/templates/GTM_BUILD_REPORT_TEMPLATE.md`](../../../864zeros-ISD/ISD-DIV-5-EVOLUTION/templates/GTM_BUILD_REPORT_TEMPLATE.md) §VII — Strike Verification Checklist mandates "864zeros Trust Vault Integration Verified" before publish (Strike 030 v1.1).
- [`864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md`](../../../864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md) — operational hygiene log per RULE-007.

---

## III. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-11 | Initial. Both verbatim sections installed by 864z-OA per Strike 030 operator-paste directive. Source text is operator-authored and treated as immutable absent explicit operator revision. §II Cross-References to the 5 implementation/canonical artifacts that this Notice + Disclaimer govern. |

---

*864zeros Trust Vault Terms v1.0 · 2026-05-11 · 864zeros LLC · 864z-build-kit/references/legal/.*
