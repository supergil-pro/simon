# תוכנית – Milestone 1: בסיס אפליקציה ושני מסכים מעוצבים

מקורות: `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` + `wireframes.png`, `mockups.png`, `style-guide.png`.

**מטרה:** פרויקט React + TypeScript + Vite שרץ מקומית, עם שני מסכים (**בית**, **אודות**) בעיצוב ה-Mockups, וניווט ביניהם בלי טעינת דף. בשלב זה אין לוגיקת משחק — הלוח והכפתור **"התחל"** תצוגתיים בלבד.

---

## 0. תנאי מקדים

- **Node.js אינו מותקן במחשב** (נבדק: הפקודות `node`/`npm` לא נמצאו). לפני הבנייה המשתמש צריך להתקין **Node.js LTS** (גרסה 22 ומעלה) מ-nodejs.org — אדריך צעד אחר צעד. בלי זה אי אפשר להקים, להריץ או לבדוק את הפרויקט.
- Repository מקומי של Git כבר קיים. החיבור ל-GitHub (`https://github.com/supergil-pro/simon`) וה-push ייעשו רק בשלב **"דחוף שינויים לגיטהאב"**, לפי CLAUDE.md — לא בזמן הבנייה.
- אין צורך ב-`.env`, חשבונות או מפתחות ב-Milestone זה.

## 1. הקמת הפרויקט

הקמה בשורש הפרויקט (`C:\claude\Simon`) — ידנית או מתבנית `react-ts` של Vite, בלי לדרוס את `CLAUDE.md`, `.gitignore` ו-`spec/`.

**תלויות (Dependencies):** `react`, `react-dom`, `@fontsource/heebo`.
**תלויות פיתוח:** `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.

לא מותקנים ב-Milestone זה (שייכים לאבני דרך מאוחרות): `canvas-confetti` (M2), `vite-plugin-pwa` (M5). לא מוגדר `base: "/simon/"` (M5).

**סקריפטים ב-`package.json`:**
| פקודה | תפקיד |
|---|---|
| `npm run dev` | שרת פיתוח (`vite`) |
| `npm run build` | `tsc -b && vite build` |
| `npm run typecheck` | `tsc -b --noEmit` (או `tsc --noEmit -p tsconfig.app.json`) |
| `npm run test` | `vitest run` |
| `npm run preview` | `vite preview` |

**`.gitignore`:** לבדוק שכוללים `node_modules/`, `dist/`, `coverage/`; להוסיף רק מה שחסר. לא להסיר את `.env`.

## 2. מבנה קבצים

```text
index.html                 # <html lang="he" dir="rtl">, viewport, theme-color #061628, title "סיימון"
package.json / package-lock.json
tsconfig.json, tsconfig.app.json, tsconfig.node.json
vite.config.ts             # react plugin + הגדרת vitest (environment: jsdom, setupFiles)
src/
  main.tsx                 # ייבוא Heebo (400/600/700) + styles, רינדור <App/> ב-StrictMode
  App.tsx                  # App Shell: state מסך פעיל ('home' | 'about'), מציג מסך + NavBar
  styles/
    tokens.css             # CSS Variables: צבעים, טיפוגרפיה, ריווח, רדיוסים, צללים
    global.css             # reset, body, RTL, מניעת גלילה אופקית
  components/
    NavBar.tsx / .css      # פס תחתון "בית" / "אודות", aria-current למצב פעיל
    SimonBoard.tsx / .css  # לוח עגול עם 4 כפתורים סמנטיים
    PrimaryButton.tsx/.css # כפתור כחול ראשי
  screens/
    HomeScreen.tsx / .css
    AboutScreen.tsx / .css
  game/
    colors.ts              # type Color = 'green'|'red'|'yellow'|'blue', תוויות בעברית, סדר מרחבי
  test/
    setup.ts               # @testing-library/jest-dom
  App.test.tsx             # בדיקות Render/Navigation
```

עקרון: מינימום קבצים, ללא Router חיצוני וללא ספריות UI. `colors.ts` מוכן לשימוש חוזר במנוע המשחק ב-M2.

## 3. App Shell וניווט

- `App` מחזיק `useState<'home' | 'about'>('home')` ומציג את המסך המתאים; `NavBar` מקבל את המסך הפעיל ו-callback.
- כפתורי הניווט הם `<button type="button">` (לא קישורים) — אין טעינת דף ואין שינוי URL, כך שאין סיכון ל-404 ב-GitHub Pages בהמשך.
- המסך הפעיל מסומן חזותית (טקסט בהיר/מודגש, רקע מודגש עדין) וב-`aria-current="page"`.
- סדר ב-RTL: **"בית"** מימין, **"אודות"** משמאל (כמו ב-Wireframes/Mockups), עם קו הפרדה דק ביניהם.
- הכנה ל-M2/M3: ה-state של המשחק יחיה בעתיד ב-`App` (מעל המסכים), ולכן מעבר מסך לא יאבד אותו. ב-M1 אין state משחק.

## 4. מסך בית (לפי Mockup "בית – התחלה")

מלמעלה למטה:
1. **כותרת מותג** `<h1>` **"סיימון"** (32px Bold), מתחתיה קו הפרדה דק כחלחל.
2. **חיווי שלב** **"שלב 0 מתוך 10"** (20px Semibold). המספרים בתוך `<bdi>` לבידוד כיווניות.
3. **אזור סטטוס** מתחת לחיווי — שמור במקום (גובה קבוע) כדי שבהמשך יוצגו בו "המשחק מציג את הרצף" / "התור שלך". במצב התחלה ריק.
4. **לוח Simon** במרכז.
5. **כפתור ראשי** **"התחל"** — ב-M1 לא מבצע דבר (אין `onClick` לוגי; המשחק יחובר ב-M2).
6. **NavBar** בתחתית.

**לוח Simon (`SimonBoard`):**
- מעטפת עגולה ריבועית (`aspect-ratio: 1`), רוחב `min(86vw, 340px)` בערך, רקע Charcoal `#0F0F0F` עם טבעת מסגרת `#10263D` וצל רך.
- ארבעה `<button>` ב-CSS Grid 2×2, כל אחד רבע עיגול באמצעות `border-radius` בפינה החיצונית בלבד; רווח (`gap`) עבה כהה מפריד ביניהם ("פסי מסגרת").
- **מיקום מחייב (מרחבי, לא מתהפך ב-RTL):** ירוק למעלה-שמאל, אדום למעלה-ימין, צהוב למטה-שמאל, כחול למטה-ימין. מכיוון ש-Grid מתהפך ב-`dir="rtl"`, הלוח יקבל `direction: ltr` פנימי (או `grid-template-areas` מפורש) כדי שהמיקום יישאר נכון.
- דיסק מרכזי כהה (`#0F0F0F` עם טבעת `#10263D`) — **ריק**, ללא טקסט (בתמונה מופיע טקסט משובש; DESIGN קובע שאין בו פיצ'ר).
- לכל כפתור `aria-label` בעברית: "ירוק", "אדום", "צהוב", "כחול". ללא טקסט גלוי (כמו ב-Mockups).
- מגע: `touch-action: manipulation`, `user-select: none`, `-webkit-tap-highlight-color: transparent`.
- מחלקות CSS מוכנות למצבים עתידיים (`is-lit` עם Glow, `is-dimmed`) מותר להגדיר כבר עכשיו רק אם זה לא מוסיף לוגיקה; עדיפות לפשטות — ניתן לדחות ל-M2.
- ב-M1 הכפתורים לא מגיבים ללחיצה (אין לוגיקה). מותר `:active` עדין בלבד או כלום.

## 5. מסך אודות (לפי Wireframe/Mockup "אודות")

1. כותרת `<h1>` **"אודות"** (לפי DESIGN 1.2 ו-Wireframes; ה-Mockup מציג "סיימון" — ה-Wireframes גוברים על מבנה ותוכן). אותו סגנון כותרת וקו הפרדה כמו בבית.
2. **כרטיס "על המשחק"** (`<section>` עם `<h2>`) — משטח `#10263D`, גבול כחלחל עדין, פינות מעוגלות. טקסט (מה-Wireframes):
   - "זכור את רצף הצבעים שמוצג."
   - "לחץ על הצבעים באותו סדר."
   - "נסה להגיע עד שלב 10!"
3. **כותרת** `<h2>` **"10 המשחקים האחרונים"**.
4. **חיווי ריק:** "אין עדיין משחקים שמורים." (נוסח לפי PRD, Edge Cases). ב-M1 תמיד ריק — אין קריאה ל-`localStorage`.
5. **NavBar** בתחתית.

כפתור **"מחק היסטוריה"** וה-Dialog **לא** נבנים ב-M1 — הם חלק מ-M4 (ומחיקה של רשימה ריקה אינה רלוונטית כעת).

## 6. שפה חזותית (`tokens.css`)

```css
--color-green: #00D26A;  --color-red: #FF3B30;
--color-yellow: #FFD600; --color-blue: #00A3FF;
--color-charcoal: #0F0F0F; --color-soft-gray: #E5E5E5; --color-white: #FFFFFF;
--color-bg: #061628;     --color-surface: #10263D;
--color-border: rgba(0, 163, 255, 0.25);   /* קו מתאר כחלחל עדין */
--font-family: 'Heebo', Arial, sans-serif;
--space-1: 8px; --space-2: 12px; --space-3: 16px; --space-4: 24px;
--fs-h1: 32px; --fs-h2: 24px; --fs-h3: 20px; --fs-body: 16px; --fs-caption: 14px; --fs-button: 16px;
--radius-card: 16px; --radius-button: 999px;
```

- **גופן:** `@fontsource/heebo` משקלים 400, 600, 700 מיובאים ב-`main.tsx` (קובצי `woff2` נארזים ב-`dist/`). **אין** קישור ל-Google Fonts או CDN ב-`index.html` או ב-CSS.
- **רקע:** `body` ו-`#root` ברקע `#061628`, טקסט `#FFFFFF` / `#E5E5E5`.
- **כפתור ראשי:** כחול `#00A3FF` מלא, רחב (כ-80% מרוחב התוכן, עד ~320px), גובה ≥ 48px, פינות מעוגלות, טקסט לבן 16px Semibold, צל רך כחול.
- **כרטיסים ופס ניווט:** משטח `#10263D`, גבול כחלחל עדין, פינות 16px.
- **ללא** כפתורי הגדרות, מתג סאונד, אייקונים נוספים או Progress Bar. פס הניווט — טקסט בלבד, כמו ב-Mockups (האייקונים ב-Wireframes אופציונליים לפי DESIGN 2.3).
- קשת הרקע הדקורטיבית העדינה שבחלק העליון של ה-Mockups — אופציונלית (פסאודו-אלמנט CSS פשוט); לא חובה.

## 7. פריסה ו-Mobile-First

- פריסה אנכית בעמודה: header למעלה, תוכן גמיש במרכז, NavBar צמוד לתחתית (`position: sticky`/`fixed` עם padding תחתון ל-`env(safe-area-inset-bottom)`).
- רוחב תוכן מרבי ~480px וממורכז (במסך רחב נשאר "טלפוני").
- `overflow-x: hidden` על `html, body` + יחידות `min()`/`vw` ללוח, כדי שלא תהיה גלילה אופקית ברוחב 320–430px.
- גובה: `min-height: 100dvh`. בטלפון אנכי טיפוסי (375×667 ומעלה) מסך הבית נכנס בלי גלילה; במסך נמוך או בסיבוב לרוחב — גלילה אנכית מותרת, אופקית לא.
- מסך אודות גולל אנכית אם צריך.

## 8. בדיקות אוטומטיות (`App.test.tsx`)

1. רינדור ראשוני מציג את **"סיימון"**, **"שלב 0 מתוך 10"** וכפתור **"התחל"**.
2. קיימים 4 כפתורי צבע עם השמות "ירוק", "אדום", "צהוב", "כחול".
3. לחיצה על **"אודות"** מציגה כותרת "אודות", את "על המשחק" ואת "אין עדיין משחקים שמורים", והלוח כבר לא מוצג.
4. לחיצה על **"בית"** מחזירה את מסך המשחק.
5. בפס הניווט יש בדיוק שני כפתורים, והפעיל מסומן ב-`aria-current="page"`.

## 9. בדיקות ידניות (שאבצע בעצמי בזמן הבנייה)

- `npm run typecheck`, `npm run test`, `npm run build` — כולם עוברים.
- הרצת `npm run dev` ובדיקה בדפדפן המובנה באמולציית Mobile (375×812):
  - מיקומי הצבעים בלוח (ירוק ↖, אדום ↗, צהוב ↙, כחול ↘).
  - מעבר בית ↔ אודות ללא רענון (ה-Network לא מראה טעינת מסמך חדשה; URL לא משתנה).
  - אין גלילה אופקית (`document.documentElement.scrollWidth <= innerWidth`) ב-320px, 375px ו-430px, וגם ברוחב.
  - `<html lang="he" dir="rtl">` וכל הטקסטים בעברית.
  - Heebo: בכלי ה-Network קובצי `woff2` נטענים מהשרת המקומי, ואין בקשה ל-`fonts.googleapis.com`/`fonts.gstatic.com`; וב-`dist/` אין מחרוזת `googleapis`.
- סגירת שרת הפיתוח בסיום.

## 10. עדכונים למסמכים בסיום הבנייה

- `CLAUDE.md` → **פקודות הרצה:** `npm run dev`, בדיקות: `npm run test`.
- `MILESTONES.md` → 🟡 ליד כותרת Milestone 1.
- ADR ב-`ARCHITECTURE.md` רק אם תתקבל החלטה טכנית משמעותית (למשל אופן מימוש הלוח – CSS Grid במקום SVG).

## 11. מיפוי ל-Definition of Done

| תנאי DoD | איך יתקיים / ייבדק |
|---|---|
| build + typecheck עוברים; בדיקת Render/Navigation עוברת | סעיפים 1, 8, 9 |
| שני מסכים, מעבר ללא רענון, אין מסך שלישי | סעיף 3 (state פנימי, `<button>`), בדיקות 3–5, בדיקה ידנית |
| 4 אזורים במיקום נכון, "שלב 0 מתוך 10", "התחל"; Heebo מקומי; אודות עם הסבר והיסטוריה ריקה | סעיפים 4–6, בדיקות 1–3, בדיקת Network |
| עברית, RTL, נוח ב-Smartphone אנכי, ללא גלילה אופקית | סעיפים 6–7, בדיקה ידנית ברוחבים שונים |
| אין יכולות מחוץ ל-PRD, אין Backend/DB | אין לוגיקת משחק, אין אחסון, אין שרת — רק Frontend סטטי |

## החלטות ופרשנויות שנלקחו בתוכנית

- כותרת מסך אודות: **"אודות"** (DESIGN + Wireframes), לא "סיימון" כמו ב-Mockup.
- מרכז הלוח ריק (הטקסט בתמונה משובש; DESIGN: "אין בו פיצ'ר").
- פס ניווט בטקסט בלבד, כמו ב-Mockups.
- כפתור "מחק היסטוריה" נדחה ל-M4.
- נוסח ההוראות לקוח מה-Wireframes; נוסח החיווי הריק מה-PRD.
