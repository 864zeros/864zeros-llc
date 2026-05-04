# Phase 4: Polish & Launch Checklist

> Final checklist before submitting to Chrome Web Store.
> Every item must be completed for a production-ready release.

---

## 1. Privacy Messaging (REQUIRED)

> Privacy is a marketing feature, not just a technical one.
> Make trust visible and explicit.

### In-App Privacy Indicators

- [ ] **Privacy footer** in sidepanel/popup:
  ```html
  <footer class="privacy-footer">
    <svg>🔒</svg>
    Your data stays on your device. No tracking. No ads.
  </footer>
  ```

- [ ] **Privacy badge** in options/settings page:
  ```html
  <div class="privacy-badge">
    <svg>✓</svg>
    <div>
      <strong>Privacy First</strong>
      <span>All data stored locally. No accounts required.</span>
    </div>
  </div>
  ```

- [ ] **Data handling transparency** — Explain where data goes:
  - Local storage: "Stored on your device only"
  - AI features: "Sent to [Provider] for processing, not stored"
  - Sync features: "Encrypted and synced to your [Provider] account"

### Privacy Claims Audit

- [ ] All claims in UI are accurate and verifiable
- [ ] No data sent to third parties without disclosure
- [ ] PPI redaction working for AI features
- [ ] No analytics/tracking scripts included
- [ ] No hidden network requests

---

## 2. Legal Framework (REQUIRED)

### Terms of Use

- [ ] **Terms page created**: `legal/terms.html`
- [ ] **Link in options page**: "Terms of Use" in footer
- [ ] **Link in install flow** (if applicable)
- [ ] Terms cover:
  - [ ] Acceptable use
  - [ ] Account termination (if applicable)
  - [ ] Limitation of liability
  - [ ] Dispute resolution
  - [ ] Changes to terms

### Privacy Policy

- [ ] **Privacy policy created**: `legal/privacy.html`
- [ ] **Link in options page**: "Privacy Policy" in footer
- [ ] **Link in Chrome Web Store listing**
- [ ] Privacy policy covers:
  - [ ] What data is collected
  - [ ] How data is used
  - [ ] Data storage location (local vs cloud)
  - [ ] Third-party services used
  - [ ] Data retention
  - [ ] User rights (deletion, export)
  - [ ] Contact information

### Copyright

- [ ] **Copyright notice** in footer: `© 2024 864zeros LLC`
- [ ] **License file** if open source: `LICENSE`
- [ ] **Attribution** for any third-party code/assets
- [ ] **Trademark** notices for brand assets

### Legal Links in Options Page

```html
<footer class="options-footer">
  <div class="options-footer__links">
    <a href="legal/terms.html" target="_blank">Terms of Use</a>
    <span>•</span>
    <a href="legal/privacy.html" target="_blank">Privacy Policy</a>
    <span>•</span>
    <a href="https://864zeros.com" target="_blank">864zeros.com</a>
  </div>
  <div class="options-footer__copyright">
    © 2024 864zeros LLC. All rights reserved.
  </div>
</footer>
```

---

## 3. Chrome Web Store Listing

### Store Description (Privacy-First Framing)

```markdown
# [App Name]

[One-line value proposition]

## Privacy Guaranteed

✓ 100% local storage — your data never leaves your device
✓ No account required — start using immediately
✓ No ads, no tracking, no data selling
✓ No analytics or telemetry
✓ Open-source audit welcome

## Features

• [Feature 1]
• [Feature 2]
• [Feature 3]

## Why [App Name]?

We believe your data belongs to you. Unlike other tools that harvest
your information, [App Name] keeps everything on your device.

We don't sell your data. We sell software. That's it.

## Pricing

Free tier: [What's included]
Pro: $X.XX/month — [What's included]

## Support

Questions? Email support@864zeros.com

---
Made with care by 864zeros LLC
```

### Required Store Assets

- [ ] **Icon**: 128x128 PNG (also 48x48, 16x16 in extension)
- [ ] **Screenshots**: 1280x800 or 640x400 (at least 3)
- [ ] **Marquee promo tile**: 1400x560 (optional but recommended)
- [ ] **Short description**: Max 132 characters
- [ ] **Detailed description**: See template above

### Store Settings

- [ ] **Category**: Select appropriate category
- [ ] **Language**: Primary language set
- [ ] **Privacy policy URL**: Link to hosted privacy policy
- [ ] **Support URL**: Link to support page or email

---

## 4. Code Quality

### Debug Mode Disabled

- [ ] All `DEBUG = true` changed to `DEBUG = false`
- [ ] No `console.log` statements in production code
- [ ] No `debugger` statements

### Error Handling

- [ ] All async functions have try/catch
- [ ] User-friendly error messages (no technical jargon)
- [ ] Errors logged for debugging (when DEBUG enabled)
- [ ] No uncaught promise rejections

### Performance

- [ ] No memory leaks (listeners cleaned up)
- [ ] Images optimized (compressed, lazy-loaded)
- [ ] No blocking operations on UI thread
- [ ] IndexedDB transactions complete properly

### Security

- [ ] No inline scripts (CSP compliant)
- [ ] No eval() or Function() calls
- [ ] API keys stored securely (chrome.storage, not code)
- [ ] Input sanitization (XSS prevention)
- [ ] HTTPS only for external requests

---

## 5. User Experience Polish

### Empty States

- [ ] All views have helpful empty states
- [ ] Empty states include actionable guidance
- [ ] Icons are relevant and consistent

### Loading States

- [ ] All async actions show loading indicator
- [ ] Buttons disabled during loading
- [ ] Skeleton screens for content loading (if applicable)

### Error States

- [ ] All errors have user-friendly messages
- [ ] Retry options where applicable
- [ ] Contact support link for persistent errors

### Responsiveness

- [ ] Works at minimum width (320px)
- [ ] Works at maximum reasonable width (600px+)
- [ ] No horizontal scrolling
- [ ] Touch-friendly tap targets (44x44 minimum)

### Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested (basic)

---

## 6. Monetization Ready

### Free Tier

- [ ] Core functionality works without payment
- [ ] Clear value in free tier
- [ ] Upgrade prompts are helpful, not annoying

### Paid Features

- [ ] All gated features show upgrade prompt
- [ ] Pricing displayed clearly
- [ ] Payment flow works end-to-end
- [ ] Receipts/confirmation provided

### Tier/Credit/Subscription Display

- [ ] Current status visible in UI
- [ ] Easy to upgrade from current state
- [ ] Easy to manage/cancel subscription

---

## 7. Testing Final Pass

### Functional Testing

- [ ] All features work as expected
- [ ] All tiers function correctly
- [ ] Import/export works
- [ ] Settings persist correctly

### Cross-Browser Testing

- [ ] Chrome stable
- [ ] Chrome beta (optional)
- [ ] Edge (if targeting)

### Fresh Install Testing

- [ ] Install from scratch
- [ ] First-run experience works
- [ ] Default settings applied
- [ ] Free credits/trial started (if applicable)

### Upgrade Testing

- [ ] Existing users can upgrade
- [ ] Data preserved during upgrade
- [ ] New features accessible

---

## 8. Submission Checklist

### Manifest

- [ ] Version number incremented
- [ ] Permissions are minimal and justified
- [ ] `host_permissions` only what's needed
- [ ] Description accurate

### Files

- [ ] No unused files in package
- [ ] No development files (.map, .test.js)
- [ ] No secrets in code
- [ ] .gitignore updated

### Final Review

- [ ] Run `npm run build` (if applicable)
- [ ] Test the built package
- [ ] Zip the extension folder
- [ ] Upload to Chrome Web Store
- [ ] Fill out store listing
- [ ] Submit for review

---

## 9. Post-Launch

### Monitoring

- [ ] Set up error reporting (optional)
- [ ] Monitor store reviews
- [ ] Monitor support emails

### Documentation

- [ ] README updated
- [ ] Changelog started
- [ ] Support FAQ created (if needed)

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product | | | |

---

*Phase 4 Checklist — 864zeros LLC*
