# 💒 Indian Christian Wedding Invitation

A beautiful mobile-first digital wedding invitation with:
- **Envelope opening animation** on tap
- **Scratch-to-reveal** gold foil cards for names, date & venue
- **Scroll-triggered reveals** throughout
- **Live countdown timer**
- **Events timeline**
- **Google Maps integration**
- **RSVP form**
- **Contact cards**

## 🚀 Deploy to Vercel

```bash
npm install
npm run build
# Then drag the /build folder to vercel.com, or:
npx vercel --prod
```

## ✏️ Customize

All editable content is in `src/App.js`:

| Section | What to change |
|---|---|
| Hero | Bride & Groom names in `<h1 className="hero-names">` |
| Parents | Parent names in the `parents-grid` section |
| Scratch cards | Text in each `<ScratchCard>` component |
| Countdown | `targetDate` prop on `<Countdown>` |
| Events | Array in the `events-timeline` section |
| Location | Venue name, address, Google Maps URL |
| Contact | Phone numbers in the `contact-cards` section |

## 🎨 Change Colors

Edit CSS variables in `src/App.css` at the top:
```css
:root {
  --burgundy: #6b1a2a;   /* Main dark red */
  --gold: #c8922a;        /* Gold accents */
  --ivory: #fdf6e8;       /* Background */
  --green: #2d5a27;       /* Accent green */
}
```
