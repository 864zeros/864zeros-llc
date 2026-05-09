# Full Dossier: "Bible Marker" - The Precision Study Highlighter

## 1. Executive Summary
- **Opportunity:** "Bible Marker" is a Chrome Extension designed to solve the #1 frustration for users of web-based Bible study platforms: the inability to highlight and annotate specific words or phrases, rather than being restricted to entire verses.
- **Target Audience:** Serious Bible students, pastors, researchers, and laypeople who use online Bible portals like YouVersion, BibleGateway, Blue Letter Bible, etc.
- **Core Function:** Allow users to select and highlight any portion of text on a Bible website, save it with multiple color options, and add notes.
- **Monetization:** Freemium SaaS. Core highlighting features are free. A Pro subscription unlocks features like cross-device sync, unlimited notes, and different Bible version support.

## 2. Vulture Capitol Grade (8.0/10)
- **Pain Intensity & Financial ROI (8/10):** High pain. The inability to do granular highlighting is a major workflow disruption for deep study. Users are accustomed to paying for quality study tools (e.g., Logos software), indicating a willingness to pay for a solution that significantly improves their workflow.
- **Build Velocity & Size (9/10):** The core feature set is a **Size S** build, perfect for a quick MVP. Adding sync and other Pro features brings it to a **Size M**. This fits the 864z Sweet Spot perfectly.
- **Viral Loop Potential (6/10):** Medium. Users can share screenshots of their highlighted text, or share a link to a "public" version of their annotated verse, which would carry "Bible Marker" branding.
- **Double Exit (9/10):** Strong potential.
    - **B2C:** A clear path to a subscription model.
    - **B2B:** The technology and user base would be a valuable acquisition for existing players like YouVersion, Logos, or Faithlife.

## 3. The Gap & The "Wounds"
- **The Gap:** Existing Bible platforms have under-invested in their web highlighting tools, creating a "successfully neglected" feature gap.
- **The Wounds (Evidence):**
    1.  **"I can't just highlight a single word!"**: This is the most common complaint in forums and app reviews.
    2.  **"My highlights don't sync properly."**: Users report losing their work when switching between their phone and computer.
    3.  **"I have to use a separate app for notes."**: The built-in note-taking is too basic, forcing a clunky, multi-app workflow.
    4.  **"I lose my highlights when I switch translations."**: A major frustration for users who compare different Bible versions.

## 4. Build Brick (MVP - Size S)
- **Technology:** Chrome Extension (JavaScript).
- **Core Features:**
    1.  **DOM Manipulation:** Use JavaScript to detect when a user has selected text within the content area of a supported Bible website.
    2.  **Highlighting Engine:** On text selection, inject `<span>` tags with custom CSS classes to apply a highlight color.
    3.  **UI:** A simple, non-intrusive pop-up that appears on text selection, allowing the user to choose a color.
    4.  **Local Storage:** Save the highlight data (verse reference, selected text, color) to the browser's local storage.
    5.  **Note-Taking:** A simple text area in the pop-up to add a note to the highlight.

## 5. Path to Pro (Size M)
- **Backend:** A simple backend (Python/FastAPI or Node/Express) with a database (PostgreSQL/Supabase).
- **Pro Features:**
    1.  **User Authentication:** Allow users to create an account.
    2.  **Cloud Sync:** Sync highlights and notes across devices via the backend.
    3.  **Dashboard:** A web-based dashboard where users can view and manage all their highlights and notes.
    4.  **Multi-Version Support:** A more robust system for anchoring highlights that can survive the user switching between different Bible translations.

## 6. Go-to-Market
- **Initial Launch:** Target online communities and forums where users are already discussing Bible study tools (e.g., /r/Bible, Christian forums).
- **Content Marketing:** Blog posts and videos demonstrating how "Bible Marker" solves the specific frustrations of deep Bible study.
- **Freemium Funnel:** A generous free tier to build a large user base, with a clear upgrade path to the Pro features.
