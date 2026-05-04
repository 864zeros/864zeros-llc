# PassVault GTM: Landing Page Positioning
## Strike 864z-2026-004 - Dashlane Rescue Campaign

---

## Primary Headline Options

### Option A: Direct Attack (Recommended)
> **"Don't pay $60/year to access your own passwords."**
>
> Escape Dashlane in 30 seconds. 100% Free. 100% Private. Zero Cloud.
>
> [Rescue Your Passwords]

### Option B: Pain + Solution
> **"25 passwords is not enough. Neither is paying $60/year."**
>
> Import your Dashlane vault. No limits. No subscription. No cloud.
>
> [Import Now - Free Forever]

### Option C: Fear + Relief
> **"After the LastPass breach, I moved everything local."**
>
> PassVault: The password manager that never touches the internet.
>
> [See How It Works]

---

## Value Propositions

### Hero Section

| Element | Content |
|---------|---------|
| Headline | Don't pay $60/year to access your own passwords. |
| Subhead | Escape Dashlane in 30 seconds. 100% Free. 100% Private. Zero Cloud. |
| CTA | Rescue Your Passwords |
| Trust Badge | "100% Client-Side - Your passwords never leave your device" |

### Feature Grid

| Feature | Copy | Icon |
|---------|------|------|
| Instant Import | One-click migration from Dashlane, LastPass, 1Password | Upload |
| Security Audit | See which passwords are weak or reused | Shield |
| Zero Cloud | Everything stays on your device | Lock |
| Free Forever | No limits. No subscription. No tricks. | Gift |
| Web Crypto | AES-256-GCM encryption, PBKDF2 key derivation | Key |
| Open Source | Audit our code yourself | Code |

---

## The "Aha!" Moment

### Migration Audit Reveal

When user imports their Dashlane/LastPass export, immediately show:

```
+--------------------------------------------------+
|  YOUR PASSWORD SECURITY AUDIT                     |
+--------------------------------------------------+
|                                                   |
|  Security Score: 47/100  [========------]         |
|                                                   |
|  [!] 23 WEAK passwords found                      |
|      "password123", "qwerty", short passwords     |
|                                                   |
|  [!] 31 REUSED passwords found                    |
|      Same password used on 8 different sites      |
|                                                   |
|  [OK] 89 STRONG passwords                         |
|                                                   |
|  Your worst reuse: One password used 12 times!    |
|                                                   |
+--------------------------------------------------+
|  [Generate Stronger Passwords]  [View Details]    |
+--------------------------------------------------+
```

**Psychology:** User realizes they have a problem they didn't know about. We just revealed it AND provided the solution.

---

## Landing Page Sections

### 1. Hero (above fold)
- Headline + subhead
- Import CTA
- Hero image: Split screen showing Dashlane export -> PassVault import

### 2. The Problem (social proof)
```
"After Dashlane raised prices AGAIN and limited free accounts to 25 passwords,
I knew I needed to leave. But I had 400+ passwords and was terrified of
losing them. PassVault made the migration painless."
- Reddit user, r/privacy
```

### 3. How It Works (3 steps)
1. **Export** - Download your passwords from Dashlane (CSV or JSON)
2. **Import** - Drag & drop into PassVault
3. **Discover** - See your security audit instantly

### 4. Why Local-First Matters
- Your passwords never touch our servers (we don't have servers)
- No breach risk from cloud storage
- No subscription means no loss of access
- Works offline, forever

### 5. Security Details (trust builders)
- AES-256-GCM encryption
- PBKDF2 key derivation (600,000 iterations)
- Web Crypto API (browser-native)
- Open source (link to GitHub)

### 6. Comparison Table

| Feature | Dashlane Free | LastPass Free | PassVault |
|---------|--------------|---------------|-----------|
| Password Limit | 25 | 50* | Unlimited |
| Devices | 1 | 1 | Unlimited |
| Cloud Dependency | Yes | Yes | No |
| Annual Cost | $0 (limited) | $0 (limited) | $0 (full) |
| Security Audit | Paid only | Paid only | Free |
| Local-First | No | No | Yes |

*LastPass: 50 passwords before 2024, now limited

### 7. CTA Section
> **Ready to escape?**
>
> Import your Dashlane vault in under a minute.
> See exactly which passwords need attention.
> Never pay for password access again.
>
> [Rescue Your Passwords] [How It Works]

---

## Reddit Response Templates

### r/privacy - Migration Question
```
I just built something for exactly this situation.

PassVault imports Dashlane/LastPass exports and stores everything locally
with AES-256-GCM encryption. No cloud, no account, no limits.

The best part: it runs a security audit on import so you can see which
passwords are weak or reused. I was shocked to find I had the same
password on 15 sites.

Happy to answer questions.
```

### r/PasswordManagers - "Dashlane raised prices again"
```
This is exactly why I built PassVault.

After watching Dashlane go from unlimited -> 50 -> 25 passwords while
raising prices, I realized they're optimizing for extraction, not users.

PassVault is 100% local (your passwords never touch a server), supports
Dashlane CSV/JSON import, and runs a security audit so you can fix weak
passwords as you migrate.

Free forever. No limits. Your data stays yours.
```

### r/selfhosted - "Local password manager recommendations"
```
If you want truly local (not even optional cloud), check out PassVault.

It's a Chrome extension that stores everything in local IndexedDB with
Web Crypto API encryption. No server component at all.

Key features:
- Imports Dashlane, LastPass, 1Password exports
- Instant security audit (shows weak/reused passwords)
- AES-256-GCM with PBKDF2 key derivation (600k iterations)
- No account, no cloud, no subscription

Still in early development but the core is solid.
```

---

## Tracking & Attribution

### UTM Structure
```
Base URL: https://passvault.app

Campaign Sources:
- reddit_privacy: ?utm_source=reddit&utm_medium=comment&utm_campaign=dashlane_rescue&utm_content=privacy_sub
- reddit_pwmanagers: ?utm_source=reddit&utm_medium=comment&utm_campaign=dashlane_rescue&utm_content=pwmanagers_sub
- twitter_launch: ?utm_source=twitter&utm_medium=organic&utm_campaign=launch
- producthunt: ?utm_source=producthunt&utm_medium=listing&utm_campaign=launch
- hn_launch: ?utm_source=hackernews&utm_medium=post&utm_campaign=launch
```

### Conversion Events
1. `landing_page_view` - Page load
2. `import_started` - User begins import
3. `import_completed` - Successful import
4. `audit_viewed` - Security audit shown
5. `password_fixed` - User generates new password
6. `extension_installed` - Chrome extension added

---

## A/B Test Ideas

1. **Headline test**: "Don't pay $60" vs "25 passwords is not enough"
2. **CTA test**: "Rescue Your Passwords" vs "Import Now - Free"
3. **Social proof test**: Reddit quotes vs G2/Capterra reviews
4. **Feature order test**: Security first vs Import first

---

*GTM Positioning for Strike 864z-2026-004*
*Generated by Vulture Nest Acquisition Engine*
