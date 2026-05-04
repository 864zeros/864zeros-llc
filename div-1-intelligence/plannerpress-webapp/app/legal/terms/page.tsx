import React from 'react';

export default function TermsPage() {
  const currentYear = new Date().getFullYear();
  const effectiveDate = 'February 6, 2026'; // Current date

  return (
    <main className="legal-page">
      <h1 className="oia-h1">Terms of Use — PlannerPress</h1>
      <p className="legal-effective">Effective Date: {effectiveDate}</p>

      <section>
        <h2 className="oia-h2">1. Acceptance of Terms</h2>
        <p className="oia-body">
          By accessing or using PlannerPress ("the Application"), you agree to be bound
          by these Terms of Use. If you do not agree to these terms, do not use the Application.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">2. Description of Service</h2>
        <p className="oia-body">
          PlannerPress is a web application that provides tools to automate the creation
          and listing of digital planners for platforms like Etsy. The Application is
          provided by 864zeros LLC ("we", "us", or "our").
        </p>
      </section>

      <section>
        <h2 className="oia-h2">3. User Responsibilities</h2>
        <p className="oia-body">You agree to:</p>
        <ul className="oia-body">
          <li>Use the Application only for lawful purposes</li>
          <li>Not attempt to reverse engineer, modify, or create derivative works</li>
          <li>Not use the Application to violate any third-party rights</li>
          <li>Not use the Application to collect or harvest data from other users</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </section>

      <section>
        <h2 className="oia-h2">4. Intellectual Property</h2>
        <p className="oia-body">
          The Application, including all content, features, and functionality, is owned by
          864zeros LLC and is protected by copyright, trademark, and other intellectual
          property laws. You may not copy, modify, distribute, or create derivative works
          without our express written permission.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">5. Payment Terms</h2>
        <p className="oia-body">
          Certain features of the Application require payment. By purchasing a subscription,
          you agree to:
        </p>
        <ul className="oia-body">
          <li>Pay all applicable fees as described at the time of purchase</li>
          <li>Provide accurate billing information</li>
          <li>Authorize us to charge your payment method</li>
        </ul>
        <p className="oia-body">
          <strong>Refunds:</strong> We offer refunds within 7 days of purchase if you
          are not satisfied. Contact support@864zeros.com to request a refund.
        </p>
        <p className="oia-body">
          <strong>Subscriptions:</strong> Subscriptions automatically renew unless cancelled
          before the renewal date. You can cancel anytime through your account settings.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">6. Disclaimer of Warranties</h2>
        <p className="oia-body">
          THE APPLICATION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
          KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APPLICATION WILL BE
          UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">7. Limitation of Liability</h2>
        <p className="oia-body">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, 864ZEROS LLC SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
          LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
        </p>
        <p className="oia-body">
          OUR TOTAL LIABILITY FOR ANY CLAIMS RELATED TO THE APPLICATION SHALL NOT EXCEED
          THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">8. Termination</h2>
        <p className="oia-body">
          We may terminate or suspend your access to the Application at any time, without
          prior notice, for conduct that we believe violates these Terms or is harmful
          to other users, us, or third parties.
        </p>
        <p className="oia-body">
          You may stop using the Application at any time by canceling your subscription or discontinuing use.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">9. Changes to Terms</h2>
        <p className="oia-body">
          We reserve the right to modify these Terms at any time. We will notify you of
          significant changes by in-app notification or email. Your continued
          use of the Application after changes constitutes acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">10. Governing Law</h2>
        <p className="oia-body">
          These Terms shall be governed by and construed in accordance with the laws of
          Delaware, USA, without regard to its conflict of law provisions.
        </p>
      </section>

      <section>
        <h2 className="oia-h2">11. Contact Us</h2>
        <p className="oia-body">
          If you have questions about these Terms, please contact us at:
        </p>
        <p className="oia-body">
          <strong>Email:</strong> legal@864zeros.com<br/>
          <strong>Website:</strong> https://864zeros.com
        </p>
      </section>
    </main>
  );
}
