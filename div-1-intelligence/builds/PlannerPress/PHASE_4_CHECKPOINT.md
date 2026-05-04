CHECKPOINT: Phase 4 — Polish (Web Application)
VERIFY:
  1. Ensure the Next.js development server is running (`npm run dev`).
  2. Open http://localhost:3000 in your browser.
  3. **Toast Notifications:**
     a. Log out (if logged in). Attempt to log in with incorrect credentials (e.g., `wrong@example.com` / `wrong`). An error toast should appear at the bottom of the screen.
     b. Log in successfully with `test@example.com` / `password`. A success toast should appear.
     c. Log out. An info toast should appear.
  4. **Privacy Footer:** The footer with "Your data stays on your device. No tracking. No ads." should be visible at the bottom of all pages (dashboard, builder, etc.) when logged in or out.
  5. **Legal Pages:**
     a. Navigate to http://localhost:3000/legal/terms. The Terms of Use page should display with OIA styling.
     b. Navigate to http://localhost:3000/legal/privacy. The Privacy Policy page should display with OIA styling.
     c. Click the "Terms of Use" and "Privacy Policy" links in the footer of any page. They should open the correct legal pages.
     d. Ensure the links within the Privacy Policy (e.g., Google's privacy policy) are clickable and open in a new tab.
  6. **Dark Mode:** Toggle your OS dark mode. All new UI elements (toasts, footer, legal pages) should adapt correctly.
  7. **Console:** Open DevTools console. It should be free of errors and warnings related to PlannerPress code.
STATUS: ready for Phase 5
