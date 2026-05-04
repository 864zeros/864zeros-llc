import React from 'react';

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();
  const effectiveDate = 'February 6, 2026'; // Current date

  return (
    <main className="legal-page">
      <h1 className="oia-h1">Privacy Policy — PlannerPress</h1>
      <p className="legal-effective">Effective Date: {effectiveDate}</p>

      <section className="privacy-summary">
        <h2 className="oia-h2">Summary</h2>
        <div className="privacy-highlight">
          <p className="oia-body"><strong>Your privacy matters to us.</strong> Here's what you need to know:</p>
          <ul className="oia-body">
            <li>Your data stays with you — we don't store your generated planners or brand kits on our servers after generation</li>
            <li>No account required to explore (but needed for full functionality)</li>
            <li>No tracking or analytics — we don't monitor your behavior</li>
            <li>No ads — we make money from software subscriptions, not your data</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="oia-h2">1. Information We Collect</h2>

        <h3 className="oia-h3">1.1 Account Information</h3>
        <p className="oia-body">
          When you create an account, we collect your email address and a password (hashed).
          This is used to authenticate you and manage your subscription.
        </p>

        <h3 className="oia-h3">1.2 Generated Content</h3>
        <p className="oia-body">
          When you use PlannerPress to generate planners or mockups, these files are created
          and temporarily stored to allow for download. Once downloaded, they are removed from our systems.
          We do not retain copies of your generated content or brand kit assets.
        </p>

        <h3 className="oia-h3">1.3 Information Processed by Third Parties (AI)</h3>
        <p className="oia-body">
          When you use AI-powered features (such as generating listing descriptions), the content you
          submit (planner style, theme, target audience) is sent to Google Gemini for processing.
          Before sending, we remove any personally identifiable information (PPI) if present.
          We do not store your content on our servers. Please review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="oia-link">Google's privacy policy</a>.
        </p>

        <h3 className="oia-h3">1.4 Information We Do NOT Collect</h3>
        <ul className="oia-body">
          <li>Your browsing history</li>
          <li>Detailed usage analytics (beyond basic aggregated metrics for system stability)</li>
          <li>Device identifiers</li>
          <li>Location data</li>
        </ul>
      </section>

      <section>
        <h2 className="oia-h2">2. How We Use Information</h2>
        <p className="oia-body">The information we collect is used solely to:</p>
        <ul className="oia-body">
          <li>Provide the Application's core functionality (e.g., generating planners, managing subscriptions)</li>
          <li>Manage your account and preferences</li>
          <li>Communicate with you about service updates or support requests</li>
        </ul>
        <p className="oia-body">We do not use your data for advertising, profiling, or any other purpose.</p>
      </section>

      <section>
        <h2 className="oia-h2">3. Data Storage and Security</h2>
        <p className="oia-body">
          Your account data (email, hashed password, subscription status) is stored on secure servers.
          We use industry-standard encryption (HTTPS/TLS) to protect data in transit and at rest.
          Your generated planner content and brand kit assets are not permanently stored by us.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">4. Data Sharing</h2>
        <p className="oia-body">We do not sell, rent, or share your personal data with third parties, except:</p>
        <ul className="oia-body">
          <li>With payment processors (Stripe) for subscription management</li>
          <li>With AI providers (Google Gemini) for features you use, after PPI redaction</li>
          <li>When required by law or legal process</li>
          <li>To protect our rights or the safety of users</li>
        </ul>
      </section>

      <section>
        <h2 className="oia-h2">5. Your Rights</h2>
        <p className="oia-body">You have the right to:</p>
        <ul className="oia-body">
          <li><strong>Access:</strong> Request access to your account data.</li>
          <li><strong>Correction:</strong> Correct inaccurate account information.</li>
          <li><strong>Deletion:</strong> Delete your account and associated data (excluding transaction records).</li>
          <li><strong>Opt-out:</strong> Manage your communication preferences.</li>
        </ul>
        <p className="oia-body">
          To exercise your rights, please contact us at privacy@864zeros.com.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">6. Cookies and Tracking</h2>
        <p className="oia-body">
          PlannerPress uses minimal cookies for essential application functionality (e.g., session management).
          We do not use tracking cookies, pixels, or any third-party analytics services.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">7. Children's Privacy</h2>
        <p className="oia-body">
          PlannerPress is not directed at children under 13. We do not knowingly collect
          information from children under 13.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">8. Changes to This Policy</h2>
        <p className="oia-body">
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes by in-app notification or email. The effective date at
          the top of this page indicates when this policy was last revised.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">9. Contact Us</h2>
        <p className="oia-body">
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p className="oia-body">
          <strong>Email:</strong> privacy@864zeros.com<br/>
          <strong>Website:</strong> https://864zeros.com
        </p>
      </section>
    </main>
  );
}
