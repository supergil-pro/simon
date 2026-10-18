# תוכנית – Milestone 2: משחק מלא מקצה לקצה

מקורות: `MILESTONES.md` (Milestone 2), `PRD.md` (4.2, Edge Cases), `ARCHITECTURE.md` (2.3–2.5, ADR-1), `DESIGN.md` (1.1, 2.3–2.4) + `mockups.png`, `wireframes.png`.
נקודת מוצא: הקוד הקיים מ-Milestone 1 (App Shell, `SimonBoard`, `HomeScreen`, `PrimaryButton`, `game/colors.ts`).

**מטרה:** "התחל" מפעיל משחק אמיתי — הצגת רצף עם הארה וצליל, שחזור ע"י השחקן, התקדמות עד שלב 10, ניצחון (עם קונפטי) או הפסד, ו-"שחק שוב".

**מחוץ ל-Milestone זה:** מצב `paused`, כפתור "המשך משחק", `visibilitychange`/`pagehide` (M3); היסטוריה ו-`localStorage` (M4); PWA (M5).

---

## 0. תנאי מקדים

- אין צורך ב-`.env`, חשבונות או מפתחות.
- תלויות חדשות: `canvas-confetti` (dependency) ו-`@types/canvas-confetti` (devDependency). אין תלויות נוספות.

## 1. מבנה קבצים

```text
src/game/
  colors.ts            # קיים – מוסיפים randomColor()
  config.ts            # חדש – קבועי קצב (600/250/800/250ms)
  engine.ts            # חדש – טיפוסים + reducer טהור (ללא אודיו/טיימרים)
  engine.test.ts       # חדש – בדיקות יחידה ל-reducer
  audio.ts             # חדש – Audio Engine (Web Audio API), singleton
  useGame.ts           # חדש – Hook: useReducer + Sequence Controller + אודיו + קונפטי
src/components/
  SimonBoard.tsx/.css  # שינוי – props להארה, עמעום, וחסימת קלט
  GameOverlay.tsx/.css # חדש – כרטיס ניצחון/הפסד מעל הלוח
src/screens/
  HomeScreen.tsx/.css  # שינוי – מקבל את מצב המשחק ומציג מצבי תצוגה
src/App.tsx            # שינוי – מחזיק את useGame; ביטול משחק במעבר לאודות
src/App.test.tsx       # הרחבה – בדיקות זרימה עם Fake Timers ו-Mocks
```

## 2. קבועי קצב – `game/config.ts`

```ts
export const TIMING = {
  leadInMs: 800,     // wait before each sequence playback (part of "presenting")
  flashMs: 600,      // highlight + tone per color
  gapMs: 250,        // pause between colors
  minPressMs: 250,   // minimum player press feedback
} as const;
```
ערכים זהים לכל השלבים, ללא האצה (DESIGN 2.4).

## 3. Game Engine – `game/engine.ts` (reducer טהור)

**State** (לפי ARCHITECTURE 2.5, בלי `paused` בשלב זה):
```ts
type GameStatus = 'idle' | 'presenting' | 'awaitingInput' | 'won' | 'lost';
type GameState = {
  status: GameStatus;
  sequence: Color[];      // length 1–10
  round: number;          // 1–10
  inputIndex: number;
  completedRounds: number;// 0–10
  gameId: number;         // incremented on every START (one-time guard for M4)
};
```
**Actions:**
| Action | מותר במצב | תוצאה |
|---|---|---|
| `START { firstColor }` | `idle`, `won`, `lost` | `sequence=[firstColor]`, `round=1`, `inputIndex=0`, `completedRounds=0`, `gameId+1`, `presenting` |
| `PRESENTATION_DONE` | `presenting` | `awaitingInput`, `inputIndex=0` |
| `PRESS { color, nextColor }` | `awaitingInput` בלבד | ראה למטה |
| `CANCEL` | `presenting`, `awaitingInput` | חזרה ל-`idle` במצב התחלתי (התנהגות זמנית עד M3) |

**`PRESS`:**
- צבע שגוי → `lost` מיד; `completedRounds = round - 1`.
- צבע נכון, לא האחרון ברצף → `inputIndex + 1`.
- צבע נכון ואחרון: `completedRounds = round`; אם `round === 10` → `won` (אין שלב 11); אחרת `round + 1`, `sequence = [...sequence, nextColor]`, `inputIndex = 0`, `presenting`.

כל Action שאינו חוקי במצב הנוכחי מחזיר את אותו state ללא שינוי (למשל לחיצה בזמן `presenting`).

**אקראיות:** ה-reducer אינו קורא ל-`Math.random()` בעצמו. הצבע החדש מוגרל מחוץ ל-reducer (`randomColor()` ב-`colors.ts`: `BOARD_COLORS[Math.floor(Math.random() * 4)]`) ונשלח ב-payload. כך ה-reducer דטרמיניסטי ונבדק בקלות, וחזרות על צבע אפשריות.

## 4. Audio Engine – `game/audio.ts`

אובייקט יחיד (singleton) המייצא:
- `unlock(): Promise<void>` — יוצר `AudioContext` (בפעם הראשונה) וקורא ל-`resume()`. **נקרא בתוך ה-click handler** של "התחל"/"שחק שוב" (Gesture). זורק שגיאה אם אין תמיכה, אם `resume()` נכשל, או אם המצב אינו `running`.
- `playTone(color, durationMs?)` — Oscillator + GainNode עם Envelope קצר (~10ms עלייה/ירידה) למניעת קליקים. מחזיר פונקציית `stop()` (ללחיצה ממושכת).
- `playWin()` / `playLoss()` — מוטיבים קצרים: ניצחון = ארפג'ו עולה (C5‑E5‑G5‑C6); הפסד = צליל נמוך יורד.
- `stopAll()` — עוצר מיד כל צליל פעיל.

**גבהי צליל (שונים לכל צבע, בהשראת Simon המקורי):** ירוק 415Hz, אדום 310Hz, צהוב 252Hz, כחול 209Hz.

**כשל אודיו:** אם `unlock()` נכשל — המשחק **אינו מתחיל** (אין רצף שקט), ומוצגת הודעה עם `role="alert"`:
**"לא ניתן להפעיל את הצלילים. לחץ שוב כדי לנסות."** — לחיצה חוזרת על הכפתור מנסה שוב (ARCHITECTURE 2.4). ההודעה נעלמת בהתחלה מוצלחת.
הערה: מצב שקט פיזי של הטלפון אינו ניתן לזיהוי מהדפדפן — זו מגבלה ידועה.

## 5. Hook – `game/useGame.ts`

מחזיק `useReducer(engine)` ומנהל את כל ה-Side Effects (ה-reducer לא נוגע באודיו/טיימרים — ARCHITECTURE 2.3 כלל 4).

**מחזיר:** `state`, `activeColor` (הצבע המואר כרגע, להצגה/לחיצה), `audioError`, `start()`, `pressStart(color)`, `pressEnd()`, `cancel()`.

**Sequence Controller (בתוך `useEffect` שתלוי ב-`status`, `round`, `gameId`):**
- כשהמצב `presenting`: יוצרים `AbortController`; מתזמנים: המתנה 800ms → לכל צבע: הארה + `playTone(color, 600)` למשך 600ms → כיבוי → 250ms הפסקה → הבא. אחרי כיבוי הצבע האחרון → `PRESENTATION_DONE`.
- כל callback בודק `signal.aborted` לפני שינוי מצב; ה-cleanup של ה-Effect מבטל את כל הטיימרים, מכבה הארה וקורא ל-`audio.stopAll()`. כך גם React Strict Mode (הרצה כפולה של Effects בפיתוח) לא יוצר הצגה כפולה.
- ההמתנה של 800ms היא חלק מ-`presenting`, ולכן קלט חסום גם בה. היא מתחילה מכניסה ל-`presenting` — כלומר מהלחיצה על "התחל" או מהלחיצה הנכונה האחרונה בשלב (DESIGN 2.4).

**לחיצת שחקן:**
- `pressStart(color)` — מתקבל רק ב-`awaitingInput` (אחרת מתעלמים, וגם ה-reducer מתעלם). צבע נכון: הארה + צליל שנמשכים כל עוד לוחצים, ולפחות 250ms. צבע שגוי: הארה קצרה בלבד, ללא צליל הצבע (צליל ההפסד מושמע מיד אחריו). שולח `PRESS` עם `nextColor = randomColor()`.
- `pressEnd()` — עוצר את הצליל וההארה, אך לא לפני שעברו 250ms מתחילת הלחיצה.

**מעברי סיום (Effect לפי `status`):**
- כניסה ל-`lost` → `playLoss()`. כניסה ל-`won` → `playWin()` + `confetti({ disableForReducedMotion: true, ... })` **פעם אחת** (מסונן לפי `gameId`, כדי שלא יופעל שוב ב-Strict Mode או בחזרה למסך הבית).
- יציאה מ-`won` (או "שחק שוב") → `confetti.reset()`.

**`start()`:** `await audio.unlock()` → אם הצליח: `dispatch(START { firstColor: randomColor() })`; אחרת `audioError`. משמש גם ל-"התחל" וגם ל-"שחק שוב" (רצף חדש לגמרי).

**`cancel()`:** שולח `CANCEL` (ה-cleanup של ה-Effect עוצר הארה וצליל).

## 6. UI

### `App.tsx`
- `const game = useGame()` מוחזק ב-`App` (מעל שני המסכים, לפי ADR-1), ומועבר כ-props ל-`HomeScreen`.
- **התנהגות זמנית עד M3:** במעבר ל-"אודות" כשהמצב `presenting` או `awaitingInput` → `game.cancel()` (עצירת הארה וצליל, ללא רישום). חזרה ל-"בית" מציגה מצב התחלה. במצבי `won`/`lost` המעבר לא משנה דבר (המשחק כבר הסתיים); הקונפטי לא יופעל מחדש.

### `HomeScreen.tsx` – מצבי תצוגה (DESIGN 1.1 + Mockups)
| מצב | חיווי שלב | שורת סטטוס עליונה | טקסט/כפתור מתחת ללוח | לוח |
|---|---|---|---|---|
| `idle` | שלב 1 מתוך 10 | — (או הודעת כשל אודיו) | כפתור **"התחל"** | צבעים מלאים, קלט לא פעיל |
| `presenting` | שלב X מתוך 10 | **"המשחק מציג את הרצף"** | **"המתן..."** (ללא כפתור) | מעומעם; הצבע הפעיל זוהר |
| `awaitingInput` | שלב X מתוך 10 | **"התור שלך"** | **"הקש על הצבעים לפי הסדר"** | צבעים מלאים, Glow בלחיצה |
| `won` | שלב 10 מתוך 10 | — | כפתור **"שחק שוב"** | Overlay ניצחון מעליו |
| `lost` | שלב X מתוך 10 (השלב שבו נפסל) | — | כפתור **"שחק שוב"** | Overlay הפסד מעליו |

- אזור הפעולה שומר על גובה קבוע כדי שהלוח לא "יקפוץ" בין מצבים.
- שורת הסטטוס נשארת `aria-live="polite"`.

### `SimonBoard.tsx`
- props חדשים: `activeColor: Color | null`, `dimmed: boolean`, `interactive: boolean`, `onPressStart(color)`, `onPressEnd()`.
- לחיצה: `onPointerDown` → `onPressStart`; `onPointerUp` / `onPointerLeave` / `onPointerCancel` → `onPressEnd`. מקלדת (Enter/Space) — דרך `onClick` כאשר `event.detail === 0`, עם משוב של 250ms.
- כשאינו אינטראקטיבי: `aria-disabled="true"` (לא `disabled`, כדי לשמור על פוקוס וקריאוּת), וה-handlers מתעלמים.
- CSS: מחלקת `is-active` = בהירות גבוהה + `box-shadow` זוהר בצבע הרבע; `simon-board--dimmed` = רבעים לא פעילים בעמעום (`filter: brightness(0.45) saturate(0.7)`, כמו ב-Mockup). מעבר הארה קצר (~80ms). ללא שינוי בגאומטריה הקיימת.

### `GameOverlay.tsx` (חדש)
- כרטיס במשטח `#10263D` עם גבול כחול עדין, ממורכז מעל הלוח (הלוח נשאר מזוהה ברקע), `role="status"`.
- ניצחון: **"כל הכבוד!"** (צהוב/ירוק) + **"ניצחת!"** (לבן) בגודל H1.
- הפסד: **"נפסלת!"** באדום + שורת משנה: **"השלמת X שלבים"**; עבור 1: **"השלמת שלב אחד"**; עבור 0: **"לא השלמת אף שלב"**. המספר עטוף ב-`<bdi>`.
- כפתור **"שחק שוב"** מוצג מתחת ללוח (באזור הפעולה), כמו ב-Mockup.

## 7. בדיקות

**`engine.test.ts` (יחידה, דטרמיניסטי):**
- אורכי רצף בשלבים 1, 2, 10 הם 1, 2, 10; הרצף של כל שלב הוא prefix של הבא + צבע אחד בסוף; צבע חוזר מתקבל.
- `PRESS` בזמן `presenting` / `idle` / `won` / `lost` לא משנה דבר.
- לחיצה נכונה מקדמת `inputIndex` בלבד; שגויה → `lost` מיד.
- הפסד בשלב 1 → `completedRounds = 0`; הפסד בשלב 5 → `4`.
- השלמת שלב 10 → `won`, `completedRounds = 10`, אין שלב 11 (גם לחיצה נוספת לא משנה).
- `START` אחרי `won`/`lost` → שלב 1, רצף חדש, `gameId` חדש. `CANCEL` → `idle`.
- `randomColor()` ממפה את `Math.random` לארבעת הצבעים.

**`App.test.tsx` (זרימה, עם `vi.useFakeTimers()`, `vi.mock('./game/audio')`, `vi.mock('canvas-confetti')`):**
- "התחל" → "המשחק מציג את הרצף"; הצבע נדלק ב-800ms, כבה ב-1400ms; בשלב 2 הצבע הבא נדלק ב-1650ms (בדיקת קצב); לאחר מכן "התור שלך".
- לחיצה על צבע בזמן ההצגה לא משנה את המשחק.
- הפסד בשלב 1: "נפסלת!" + "לא השלמת אף שלב", `playLoss` נקרא, קונפטי **לא** נקרא.
- ניצחון (Math.random מקובע לירוק, 10 שלבים): "כל הכבוד!" + "ניצחת!", `playWin` וקונפטי נקראים **פעם אחת**; חיווי "שלב 10 מתוך 10".
- "שחק שוב" → שלב 1 עם רצף חדש באורך 1.
- מעבר ל-"אודות" באמצע משחק → `stopAll` נקרא; חזרה ל-"בית" מציגה "שלב 1 מתוך 10" ו-"התחל".
- כשל `unlock()` → הודעת השגיאה מוצגת, המשחק נשאר ב-`idle`; ניסיון חוזר מוצלח מתחיל משחק.
- בדיקות M1 הקיימות ממשיכות לעבור (התאמה ל-props החדשים).

## 8. אימות ידני (בזמן הבנייה)

- `npm run typecheck`, `npm run test`, `npm run build` — עוברים.
- דפדפן באמולציית מובייל (`npm run dev`): משחק מלא, ניצחון והפסד, קונפטי בניצחון בלבד, מעבר לאודות באמצע, רענון באמצע משחק מחזיר למצב התחלה, ללא שגיאות Console וללא גלילה אופקית.
- **צלילים:** אני יכול לוודא שהקוד מפעיל את ה-AudioContext ואת הצלילים הנכונים, אך לא לשמוע אותם — את ההבחנה בין ארבעת הצלילים וצלילי הסיום תבדוק אתה באוזן (בטלפון/מחשב, עם עוצמה פתוחה).

## 9. תיעוד

- הוספת **ADR-2** ל-`ARCHITECTURE.md`: הצבע האקראי נשלח ב-payload של ה-Action כדי שה-reducer יישאר טהור; Sequence Controller כ-Effect עם `AbortController`; Audio Engine כ-singleton שמופעל מתוך ה-Gesture.
- סימון 🟡 ליד כותרת Milestone 2 ב-`MILESTONES.md` בסיום הבנייה.

## 10. Definition of Done – איך כל סעיף ייבדק

| סעיף DoD | אימות |
|---|---|
| התחלה, אורכי 1/2/10 ו-prefix | `engine.test.ts` + זרימה ב-`App.test.tsx` |
| צלילים שונים, הארה נבדלת, קצב קבוע | בדיקת קצב עם Fake Timers; צלילים — בדיקה באוזן שלך |
| מעבר לאודות עוצר הארה וצליל, ללא תוצאה | `App.test.tsx` + בדיקה בדפדפן |
| לחיצות בהצגה חסומות; נכונה מקדמת; שגויה מפסידה | `engine.test.ts` + `App.test.tsx` |
| הפסד שלב 1 / שלב מתקדם / ניצחון / אין שלב 11 / "שחק שוב" | `engine.test.ts` + `App.test.tsx` |
| טקסט וצליל בסיום; קונפטי בניצחון בלבד | `App.test.tsx` (Mocks) + בדיקה בדפדפן |
| רענון מבטל משחק; אין שמירה מתמידה | בדיקה בדפדפן + אין שימוש ב-`localStorage` בקוד |
