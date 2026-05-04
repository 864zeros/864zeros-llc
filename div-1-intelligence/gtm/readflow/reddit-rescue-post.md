# Reddit "Rescue" Post

**Target Subreddits:** r/kobo, r/instapaper, r/ereader, r/selfhosted

---

## Post Title Options (A/B Test)

**Option A:** Tired of the $30/yr Instapaper "ransom" just to sync your own bookmarks to Kobo?

**Option B:** I built a free Chrome extension to rescue your Instapaper articles and sync them to Kobo—no cloud required

**Option C:** After Instapaper broke Kobo sync (again), I built my own local-first alternative. Here's the result.

---

## Post Body

Hey r/kobo,

Like many of you, I've been burned by the Instapaper + Kobo situation. The Kobo firmware update broke native sync, Instapaper wants $30/year for "Premium" features that used to be free, and honestly—why am I paying a subscription just to read articles I already saved?

So I built **ReadFlow**.

### What it does:

1. **Import your Instapaper library** — Drop your CSV export, done. All your articles, folders, and reading progress rescued in seconds.

2. **Generate Kobo-ready ePubs** — One click creates a digest of your unread articles. Transfer via USB or scan a QR code for wireless sync.

3. **Zero network calls** — Your articles stay on YOUR device. No cloud. No account. No tracking.

### The "Aha Moment":

When you import, ReadFlow shows you exactly how much you've saved:
- **$30/year** × however many years you would've paid Instapaper
- **Your articles** — permanently rescued, not held hostage

### Why I built this:

I'm part of a small software studio called **864zeros**. Our mission is **"Organize Your Internal Architecture" (OIA)**—we build local-first tools that respect your data and don't hold it ransom.

ReadFlow is free. The Chrome extension is open for testing. If you want early access, drop a comment or DM.

---

**TL;DR:** Free Chrome extension that imports Instapaper CSV → generates Kobo ePubs → no cloud, no subscription, no BS.

---

## Comment Responses (Pre-written)

**Q: "Is this open source?"**
> The core parsing logic is MIT licensed. We're finalizing the repo structure before public release. Happy to share the code with anyone interested in contributing.

**Q: "Does it work with Pocket?"**
> Pocket support is on the roadmap. The architecture is parser-agnostic, so adding new import sources is straightforward. Pocket users—what export format do you have?

**Q: "Why not just use Calibre?"**
> You absolutely can! ReadFlow is for people who want a one-click workflow without managing a full ebook library. Think of it as the "fast path" for article syncing.

**Q: "What about Wallabag/Omnivore?"**
> Both great options. ReadFlow is specifically optimized for the Instapaper → Kobo pipeline with zero setup. If you're already happy with Wallabag, you probably don't need this.

**Q: "How do I export from Instapaper?"**
> Go to instapaper.com/user → scroll down → click "Download .CSV file". That's your entire library.

---

## Cross-post Variations

### r/instapaper version:
Add: "For those of us who've been using Instapaper since the Marco Arment days, it's frustrating to see basic features gated behind a subscription. ReadFlow is my way of taking back control."

### r/selfhosted version:
Add: "No server required—it's a Chrome extension that runs entirely in your browser. IndexedDB for storage, Web Crypto for any future encryption needs. True local-first architecture."

### r/ereader version:
Add: "Works with any e-reader that supports ePub. I built it for Kobo, but Kindle users can run the ePub through Calibre for .mobi conversion."

---

*Draft prepared for 864zeros GTM - ReadFlow Division 4*
*Last updated: 2026-03-18*
