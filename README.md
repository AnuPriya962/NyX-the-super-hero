# NyX — Superhero Help Portal

A two-part interface. NyX stands permanently on the left; the right-hand column holds her story, then transforms into her private channel. Plain HTML, CSS and JavaScript — no build step, no framework.

## Folder structure

```
nyx-portal/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── script.js
│   └── config.js            # where the submission is sent
├── assets/
│   └── images/
│       ├── pose-front.png           # at rest  (default)
│       ├── pose-back.png            # turned away
│       └── nyx-avatar.jpg           # terminal header
└── README.md
```

Create the folders exactly as above and drop each file in its place.

## Running it in VS Code

Static site — no Node, no build.

1. Open the `nyx-portal` folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.

Or without an extension:

```bash
cd nyx-portal
python3 -m http.server 8080
# http://localhost:8080
```

A local server is recommended over double-clicking the file.

## The two states

**Story mode** — NyX left, fragments right: The Legend → Origin → Powers → The Code, separated by the glyph clusters from the sketch, which light up as you scroll past them.

**Sanctuary mode** — click *Talk to NyX*. The story dissolves upward, a thin vertical rule draws itself down the left of the column, and her terminal fades in. NyX stays exactly where she is. *Back to her story* returns you, and the conversation is preserved.

## The figure

Front and back, on a slider — arrows at the edges of the pane, like picking a character. Left/right keys and swipe work too.

She is rendered exactly as painted: **no filters, no colour grading, no distortion, no glow.** Both views are alpha cutouts made from your character reference with a segmentation model, saved without quantisation so nothing shifts her palette. She stands still; the only motion is the slide between views.

Adding a third view is two lines — a `<figure class="view">` in `index.html` and its name in the `VIEWS` array in `js/script.js`. The track width and dot count follow automatically if you also widen `.view-track` to `300%` and add a dot.

## How the conversation opens

The chat is an **overlay panel**, not a separate page mode. The landing page stays behind it, dimmed and softly blurred by a scrim — but NyX sits *above* that scrim, so she stays completely sharp while the story column behind the panel recedes — the panel sits in the content column, exactly where it appeared when the button was pressed.

- **On arrival** it opens by itself, about a second after load, rising in gently. No sound, no permissions — it is only a panel.
- **Closing it** (✕, Esc, the scrim, or the nav button) returns you to the page. *Tell me what happened* or *Talk to me* brings her back with the conversation intact.
- **It opens itself once per visit.** Scrolling, reading and navigating will not make it pop again.
- **A refresh starts fresh** — nothing is persisted, so the next visit is a new conversation. Deliberate: sessions are not saved.
- `prefers-reduced-motion` drops the animation and opens it almost immediately.
- On phones it becomes a bottom sheet across the full width, with safe-area padding and no horizontal scroll.

Three ways in: the automatic arrival, the *Tell me what happened* button, and *Talk to me* in the nav.

## The conversation

She collects name, age, location and email one question at a time, then opens up:

1. **Telling her what happened is not one box.** Send as many messages as you like; she answers each briefly and keeps the door open. Enter sends, Shift+Enter is a new line.
2. **"That's everything"** ends that stage.
3. **She reads it back** — the details she collected, then every message in your own words — names what it reads like to her, shows every message verbatim, and asks *"Have I understood you?"*
4. **"Yes, that’s it"** submits. **"There’s more"** reopens the field and keeps everything already written.

Nothing is sent until step 4. The payload carries both `grievance` (all messages joined) and `messages` (the array), so your backend can use whichever suits.

The read-back is verbatim rather than a paraphrase — a real summary needs a language model on the server, and showing someone their own words is the honest version of "have I understood you". If you wire a summariser into your backend, drop it in at the `recap()` step.

## Voice

The whole page is written in first person — NyX speaking, not a narrator describing her. Section headings are hers too ("Where I came from", "What I can do", "Why I do it"), and her dialogue in the Sanctuary is pitched to match: measured, direct, no mysticism.

There is deliberately **one** entry to the conversation on the page — the button under her opening lines — plus the persistent one in the nav. No repeat call to action at the bottom.

## Sending it somewhere

Delivery goes through **EmailJS**, configured in `js/config.js`:

```js
window.EMAIL_CONFIG = {
  SERVICE_ID:  "service_xxxxxxx",
  TEMPLATE_ID: "template_xxxxxxx",
  PUBLIC_KEY:  "xxxxxxxxxxxxxxxx",
  CANDIDATE_EMAIL: "your-email@gmail.com"   // ← set this
};
```

Set `CANDIDATE_EMAIL` to your own inbox, and make your EmailJS template accept these variables:

`to_email`, `from_name`, `reply_to`, `visitor_name`, `visitor_age`, `visitor_location`, `visitor_email`, `grievance`, `submitted_at`

**On the keys.** EmailJS is designed to be called from the browser — the service ID, template ID and public key are publishable, not secrets. They still cap your quota, so lock them to your domain in the EmailJS dashboard under *Account → Security → Allowed origins*. A private API key or an SMTP password must never go in this file; if you need those, put a small server in front instead and change `submitHelpRequest()` to POST to it.

**Offline.** If the SDK doesn't load or `SERVICE_ID` is blank, `submitHelpRequest()` logs the payload to the console and reports success, so the portal still demos without a network. Check the console to confirm which path ran.

`payload` = `{ name, age, location, email, grievance, messages, submittedAt }`.

## Notes

- The palette is sampled from her costume: her cape clusters at hue 336–348, a red-wine oxblood, so every surface in the interface sits in that family and no value is allowed blue above green (which is what made the earlier build read purple).
- Palette, type (Playfair Display / Inter / JetBrains Mono for terminal text) and copy follow the approved brief. The locked conversation flow is unchanged.
- Light and dark themes both implemented; toggle sits in the nav.
- `prefers-reduced-motion` removes the slide easing and the reveal animations.
- Responsive: below 900px the character pane becomes a sticky band at the top so she remains visible while the story scrolls beneath her.
