# Legal Framework Template

> Templates for Terms of Use, Privacy Policy, and Copyright notices.
> Customize for each extension. Consult a lawyer for production use.

---

## Directory Structure

```
extensions/[app-slug]/
├── legal/
│   ├── terms.html
│   ├── privacy.html
│   └── styles.css
└── ...
```

---

## 1. Terms of Use Template

Create `legal/terms.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Use — [App Name]</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="legal-page">
    <h1>Terms of Use</h1>
    <p class="legal-effective">Effective Date: [DATE]</p>

    <section>
      <h2>1. Acceptance of Terms</h2>
      <p>
        By installing or using [App Name] ("the Extension"), you agree to be bound
        by these Terms of Use. If you do not agree to these terms, do not use the Extension.
      </p>
    </section>

    <section>
      <h2>2. Description of Service</h2>
      <p>
        [App Name] is a browser extension that [brief description of what the extension does].
        The Extension is provided by 864zeros LLC ("we", "us", or "our").
      </p>
    </section>

    <section>
      <h2>3. User Responsibilities</h2>
      <p>You agree to:</p>
      <ul>
        <li>Use the Extension only for lawful purposes</li>
        <li>Not attempt to reverse engineer, modify, or create derivative works</li>
        <li>Not use the Extension to violate any third-party rights</li>
        <li>Not use the Extension to collect or harvest data from other users</li>
        <li>Comply with all applicable laws and regulations</li>
      </ul>
    </section>

    <section>
      <h2>4. Intellectual Property</h2>
      <p>
        The Extension, including all content, features, and functionality, is owned by
        864zeros LLC and is protected by copyright, trademark, and other intellectual
        property laws. You may not copy, modify, distribute, or create derivative works
        without our express written permission.
      </p>
    </section>

    <section>
      <h2>5. Payment Terms</h2>
      <!-- Include if applicable -->
      <p>
        Certain features of the Extension require payment. By purchasing a subscription
        or credits, you agree to:
      </p>
      <ul>
        <li>Pay all applicable fees as described at the time of purchase</li>
        <li>Provide accurate billing information</li>
        <li>Authorize us to charge your payment method</li>
      </ul>
      <p>
        <strong>Refunds:</strong> We offer refunds within [X] days of purchase if you
        are not satisfied. Contact support@864zeros.com to request a refund.
      </p>
      <p>
        <strong>Subscriptions:</strong> Subscriptions automatically renew unless cancelled
        before the renewal date. You can cancel anytime through [method].
      </p>
    </section>

    <section>
      <h2>6. Disclaimer of Warranties</h2>
      <p>
        THE EXTENSION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
        KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE EXTENSION WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
      </p>
    </section>

    <section>
      <h2>7. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, 864ZEROS LLC SHALL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
        LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
      </p>
      <p>
        OUR TOTAL LIABILITY FOR ANY CLAIMS RELATED TO THE EXTENSION SHALL NOT EXCEED
        THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.
      </p>
    </section>

    <section>
      <h2>8. Termination</h2>
      <p>
        We may terminate or suspend your access to the Extension at any time, without
        prior notice, for conduct that we believe violates these Terms or is harmful
        to other users, us, or third parties.
      </p>
      <p>
        You may stop using the Extension at any time by uninstalling it from your browser.
      </p>
    </section>

    <section>
      <h2>9. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of
        significant changes by [method: email, in-app notification, etc.]. Your continued
        use of the Extension after changes constitutes acceptance of the new Terms.
      </p>
    </section>

    <section>
      <h2>10. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of
        [State/Country], without regard to its conflict of law provisions.
      </p>
    </section>

    <section>
      <h2>11. Contact Us</h2>
      <p>
        If you have questions about these Terms, please contact us at:
      </p>
      <p>
        <strong>Email:</strong> legal@864zeros.com<br>
        <strong>Website:</strong> https://864zeros.com
      </p>
    </section>

    <footer class="legal-footer">
      <p>© 2024 864zeros LLC. All rights reserved.</p>
    </footer>
  </main>
</body>
</html>
```

---

## 2. Privacy Policy Template

Create `legal/privacy.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — [App Name]</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="legal-page">
    <h1>Privacy Policy</h1>
    <p class="legal-effective">Effective Date: [DATE]</p>

    <section class="privacy-summary">
      <h2>Summary</h2>
      <div class="privacy-highlight">
        <p><strong>Your privacy matters to us.</strong> Here's what you need to know:</p>
        <ul>
          <li>✓ Your data stays on your device — we don't have access to it</li>
          <li>✓ No account required — use the extension immediately</li>
          <li>✓ No tracking or analytics — we don't monitor your behavior</li>
          <li>✓ No ads — we make money from software, not your data</li>
        </ul>
      </div>
    </section>

    <section>
      <h2>1. Information We Collect</h2>

      <h3>1.1 Information Stored Locally</h3>
      <p>
        [App Name] stores data locally on your device using browser storage (IndexedDB
        and chrome.storage). This includes:
      </p>
      <ul>
        <li>[Type of data stored, e.g., "Clips you save"]</li>
        <li>[Type of data stored, e.g., "Tags you create"]</li>
        <li>[Type of data stored, e.g., "Your settings and preferences"]</li>
      </ul>
      <p>
        <strong>This data never leaves your device</strong> unless you explicitly choose
        to export it or use a sync feature.
      </p>

      <h3>1.2 Information Processed by Third Parties</h3>
      <!-- Include if using AI features -->
      <p>
        When you use AI-powered features (such as [feature names]), the content you
        submit is sent to [Provider, e.g., "Google Gemini"] for processing. Before
        sending, we:
      </p>
      <ul>
        <li>Remove personally identifiable information (emails, phone numbers, etc.)</li>
        <li>Do not send any identifying information about you</li>
        <li>Do not store your content on our servers</li>
      </ul>
      <p>
        Please review [Provider]'s privacy policy: [link to provider's privacy policy]
      </p>

      <h3>1.3 Information We Do NOT Collect</h3>
      <ul>
        <li>Your name or email address (unless you contact support)</li>
        <li>Your browsing history</li>
        <li>Analytics or usage data</li>
        <li>Device identifiers</li>
        <li>Location data</li>
      </ul>
    </section>

    <section>
      <h2>2. How We Use Information</h2>
      <p>The data stored locally on your device is used solely to:</p>
      <ul>
        <li>Provide the Extension's core functionality</li>
        <li>Save your preferences and settings</li>
        <li>Allow you to export and backup your data</li>
      </ul>
      <p>We do not use your data for advertising, profiling, or any other purpose.</p>
    </section>

    <section>
      <h2>3. Data Storage and Security</h2>
      <p>
        Your data is stored locally in your browser using encrypted storage APIs.
        We do not have access to this data, and it is not transmitted to any server.
      </p>
      <p>
        For features that require server communication (such as [feature, if any]),
        we use industry-standard encryption (HTTPS/TLS) to protect data in transit.
      </p>
    </section>

    <section>
      <h2>4. Data Sharing</h2>
      <p>We do not sell, rent, or share your personal data with third parties, except:</p>
      <ul>
        <li>When required by law or legal process</li>
        <li>To protect our rights or the safety of users</li>
        <li>With your explicit consent</li>
      </ul>
    </section>

    <section>
      <h2>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Export all your data at any time using the built-in export feature</li>
        <li><strong>Delete:</strong> Remove all your data by uninstalling the extension or using the "Clear Data" option in settings</li>
        <li><strong>Portability:</strong> Export your data in a standard format (JSON)</li>
      </ul>
      <p>
        Since we don't collect your data, there's nothing for us to delete from our servers —
        all data is under your control.
      </p>
    </section>

    <section>
      <h2>6. Cookies and Tracking</h2>
      <p>
        [App Name] does not use cookies, pixels, or any tracking technologies.
        We do not use Google Analytics or any similar services.
      </p>
    </section>

    <section>
      <h2>7. Children's Privacy</h2>
      <p>
        [App Name] is not directed at children under 13. We do not knowingly collect
        information from children under 13.
      </p>
    </section>

    <section>
      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of
        significant changes by [method]. The effective date at the top of this page
        indicates when this policy was last revised.
      </p>
    </section>

    <section>
      <h2>9. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:
      </p>
      <p>
        <strong>Email:</strong> privacy@864zeros.com<br>
        <strong>Website:</strong> https://864zeros.com
      </p>
    </section>

    <footer class="legal-footer">
      <p>© 2024 864zeros LLC. All rights reserved.</p>
    </footer>
  </main>
</body>
</html>
```

---

## 3. Legal Page Styles

Create `legal/styles.css`:

```css
:root {
  --legal-bg: #ffffff;
  --legal-text: #1a1a2e;
  --legal-muted: #6b7280;
  --legal-accent: #4ade80;
  --legal-border: #e5e7eb;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--legal-text);
  background-color: var(--legal-bg);
}

.legal-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}

.legal-page h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.legal-effective {
  color: var(--legal-muted);
  font-size: 0.875rem;
  margin-bottom: 32px;
}

.legal-page section {
  margin-bottom: 32px;
}

.legal-page h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--legal-border);
}

.legal-page h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
}

.legal-page p {
  margin-bottom: 16px;
}

.legal-page ul {
  margin-left: 24px;
  margin-bottom: 16px;
}

.legal-page li {
  margin-bottom: 8px;
}

.legal-page a {
  color: var(--legal-accent);
  text-decoration: none;
}

.legal-page a:hover {
  text-decoration: underline;
}

.privacy-summary {
  margin-bottom: 48px;
}

.privacy-highlight {
  background-color: #f0fdf4;
  border: 1px solid var(--legal-accent);
  border-radius: 8px;
  padding: 20px 24px;
}

.privacy-highlight ul {
  margin-bottom: 0;
}

.privacy-highlight li {
  list-style: none;
  margin-left: 0;
}

.legal-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--legal-border);
  text-align: center;
  color: var(--legal-muted);
  font-size: 0.875rem;
}

@media (max-width: 480px) {
  .legal-page {
    padding: 24px 16px;
  }

  .legal-page h1 {
    font-size: 1.5rem;
  }
}
```

---

## 4. Copyright Notices

### In Code Files

Add to the top of each source file:

```js
// ============================================================
// [FILENAME] — [App Name]
// Copyright © 2024 864zeros LLC. All rights reserved.
// ============================================================
```

### In manifest.json

```json
{
  "name": "[App Name]",
  "version": "1.0.0",
  "author": "864zeros LLC",
  ...
}
```

### In Options Page Footer

```html
<footer class="options-footer">
  <div class="options-footer__links">
    <a href="legal/terms.html" target="_blank">Terms of Use</a>
    <span>•</span>
    <a href="legal/privacy.html" target="_blank">Privacy Policy</a>
  </div>
  <div class="options-footer__copyright">
    © 2024 864zeros LLC. All rights reserved.
  </div>
</footer>
```

### In Chrome Web Store Description

```markdown
---
Made with care by 864zeros LLC
© 2024 864zeros LLC. All rights reserved.
```

---

## 5. LICENSE File (if open-sourcing)

Create `LICENSE` in root:

### MIT License (permissive)

```
MIT License

Copyright (c) 2024 864zeros LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Proprietary (closed-source)

```
Copyright (c) 2024 864zeros LLC. All rights reserved.

This software and associated documentation files (the "Software") are the
proprietary property of 864zeros LLC. Unauthorized copying, modification,
distribution, or use of this Software, via any medium, is strictly prohibited.

For licensing inquiries, contact: legal@864zeros.com
```

---

## 6. Third-Party Attribution

If using third-party code or assets, create `ATTRIBUTION.md`:

```markdown
# Third-Party Attribution

## Libraries

- **[Library Name]** — [License Type]
  - Source: [URL]
  - Used for: [What it's used for]

## Icons

- **Feather Icons** — MIT License
  - Source: https://feathericons.com
  - Used for: UI icons throughout the extension

## Fonts

- **Nunito** — SIL Open Font License
  - Source: https://fonts.google.com/specimen/Nunito
  - Used for: Primary typeface
```

---

## Checklist

- [ ] Terms of Use created and linked in options page
- [ ] Privacy Policy created and linked in options page
- [ ] Privacy Policy URL added to Chrome Web Store listing
- [ ] Copyright notice in options page footer
- [ ] Copyright notice in manifest.json (author field)
- [ ] Copyright headers in source files
- [ ] LICENSE file created (if open-source)
- [ ] Third-party attributions documented
- [ ] Legal pages styled consistently
- [ ] Legal pages tested on mobile

---

*Legal Framework Template — 864zeros LLC*
*Note: These templates are starting points. Consult a lawyer for your specific needs.*
