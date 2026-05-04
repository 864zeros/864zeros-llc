CHECKPOINT: Phase 3 — Feature: User Authentication (Frontend MVP)
VERIFY:
  1. Ensure the Next.js development server is running (`npm run dev`).
  2. Open http://localhost:3000 in your browser. You should be redirected to `/dashboard`.
  3. If not logged in, you should be redirected to `/login`.
  4. **Test Signup:**
     a. Navigate to http://localhost:3000/signup
     b. Enter an email and password (e.g., `user@example.com` / `password123`).
     c. Click "Sign Up." You should be redirected to `/dashboard`.
     d. The navigation bar should now show Dashboard, Builder, etc., and a "Log Out" button.
  5. **Test Logout:**
     a. Click the "Log Out" button. You should be redirected to `/login`.
  6. **Test Login:**
     a. Navigate to http://localhost:3000/login
     b. Enter the mock credentials: `test@example.com` / `password`.
     c. Click "Log In." You should be redirected to `/dashboard`.
     d. The navigation bar should again show authenticated links.
  7. **Test Protected Routes (while logged out):**
     a. Log out.
     b. Try to directly access http://localhost:3000/builder. You should be redirected to `/login`.
  8. **Test Loading State:** Observe the spinner briefly when logging in/signing up.
  9. Open DevTools console: no errors related to PlannerPress code.
STATUS: ready for Phase 4
