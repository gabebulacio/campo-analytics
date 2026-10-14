// Worklog Lakehouse case study, in English and Hebrew.
// Figures come from `python run.py demo` in the worklog-lakehouse repo (full backfill as of
// 2026-09-30, then 7 daily incremental runs), run on 2026-10-14.
// Text between backticks renders as code and stays left-to-right in Hebrew.

export type L = { en: string; he: string };

export const T = {
  note: { en: "portfolio project · synthetic data", he: "פרויקט פורטפוליו · נתונים סינתטיים" },
  eyebrow: { en: "Project · 2026", he: "פרויקט · 2026" },
  lede: {
    en: "A Microsoft Fabric medallion in PySpark and Python that turns two time-tracking systems, a user directory and a CRM into one governed star schema: who logged what, against which client, compared with what was sold. Both engines run the same logic, a parity gate proves they produce identical tables, and everything deploys to Fabric with fabric-cicd.",
    he: "Medallion ב-Microsoft Fabric, ב-PySpark וב-Python, שהופך שתי מערכות דיווח שעות, ספריית משתמשים ו-CRM ל-star schema אחד ומנוהל: מי דיווח מה, על איזה לקוח, ובהשוואה למה שנמכר. שני המנועים מריצים את אותה לוגיקה, שער השוואה מוכיח שהם מפיקים טבלאות זהות, והכול נפרס ל-Fabric עם fabric-cicd.",
  },
  kpis: [
    { v: "16", l: { en: "Fabric items: lakehouse, variable library, 11 notebooks (Python and Spark), 3 pipelines", he: "פריטי Fabric: lakehouse, variable library, 11 notebooks (Python ו-Spark), 3 pipelines" } },
    { v: "0", l: { en: "rows differ between the PySpark and Python paths (parity gate)", he: "שורות שונות בין מסלול ה-PySpark למסלול ה-Python (שער השוואה)" } },
    { v: "18", l: { en: "quality checks on every run", he: "בדיקות איכות בכל ריצה" } },
    { v: "Live", l: { en: "in production on Microsoft Fabric", he: "בייצור ב-Microsoft Fabric" } },
  ],

  problem: {
    h: { en: "The problem", he: "הבעיה" },
    p: [
      {
        en: "At work I built and run this kind of platform on Microsoft Fabric, in production: it brings logged hours from two time-tracking systems into the lakehouse behind finance's reports. The hard part wasn't the APIs, it was the people. The same person showed up under different emails, legacy domains and swapped \"last.first\" logins. Deactivated accounts came back with blank emails, entries were edited or deleted weeks later, and project keys had to stay stable because finance referenced them.",
        he: "בעבודה בניתי ואני מפעיל פלטפורמה כזאת ב-Microsoft Fabric, בייצור: היא מביאה שעות מדווחות משתי מערכות דיווח שעות אל ה-lakehouse שמאחורי הדוחות של הכספים. החלק הקשה לא היה ה-APIs, אלא האנשים. אותו אדם הופיע עם כתובות מייל שונות, דומיינים ישנים ושמות משתמש הפוכים (\"last.first\"). חשבונות שהושבתו חזרו עם מייל ריק, רשומות נערכו או נמחקו שבועות אחר כך, ומפתחות הפרויקטים היו חייבים להישאר קבועים כי הכספים הסתמכו עליהם.",
      },
      {
        en: "This project rebuilds that platform from scratch, the way I build it on Fabric, on a fictional company with synthetic data, so it can be public and anyone can run it. None of the original code, data or names are here.",
        he: "הפרויקט הזה בונה את הפלטפורמה הזאת מאפס, כמו שאני בונה אותה ב-Fabric, על חברה בדיונית עם נתונים סינתטיים, כדי שיוכל להיות ציבורי וכל אחד יוכל להריץ אותו. אין כאן שום קוד, נתונים או שמות מהמקור.",
      },
    ],
  },

  how: {
    h: { en: "How it works", he: "איך זה עובד" },
    intro: { en: "Four layers, each with a contract the next one relies on.", he: "ארבע שכבות, ולכל אחת חוזה שהשכבה הבאה סומכת עליו." },
    layers: [
      {
        n: { en: "SOURCES", he: "מקורות" },
        title: { en: "Four systems, synthetic", he: "ארבע מערכות, סינתטיות" },
        body: {
          en: "A timesheet SaaS, an issue tracker, an Entra-shaped user directory and a CRM. They land as JSON extracts in `Files/landing`, the way Copy jobs would.",
          he: "מערכת SaaS לדיווח שעות, מערכת ניהול משימות, ספריית משתמשים במבנה של Entra ו-CRM. הם נוחתים כקובצי JSON ב-`Files/landing`, כמו ש-Copy jobs היו עושים.",
        },
        tables: ["timesheets · users", "worklogs · users", "directory users", "accounts · deliverables · assignments"],
      },
      {
        n: { en: "BRONZE", he: "BRONZE" },
        title: { en: "Raw and append-only", he: "גולמי, הוספה בלבד" },
        body: {
          en: "One generic notebook loads every new file as strings, with lineage on every row, and records each extract in a manifest.",
          he: "notebook גנרי אחד טוען כל קובץ חדש כמחרוזות, עם lineage בכל שורה, ורושם כל שליפה ב-manifest.",
        },
        tables: ["bronze_<system>_<entity> × 9", "ops_ingested_files"],
      },
      {
        n: { en: "SILVER", he: "SILVER" },
        title: { en: "Canonical and replayable", he: "קנוני וניתן לשחזור" },
        body: {
          en: "Both time sources in one schema, rebuilt from bronze each run. User history is SCD Type 2 in one Delta MERGE; an identity map links every login to a person. Built in Python notebooks and in PySpark / Spark SQL.",
          he: "שני מקורות השעות בסכמה אחת, שנבנית מחדש מ-bronze בכל ריצה. היסטוריית המשתמשים היא SCD Type 2 ב-Delta MERGE אחד, ומפת זהויות מקשרת כל שם משתמש לאדם. בנוי ב-Python notebooks וב-PySpark / Spark SQL.",
        },
        tables: ["silver_worklogs", "silver_user_history", "silver_user_identities", "silver_project_registry"],
      },
      {
        n: { en: "GOLD", he: "GOLD" },
        title: { en: "Star schema for Power BI", he: "Star schema ל-Power BI" },
        body: {
          en: "Lean facts, conformed dimensions with unknown members, project keys that never change, and marts that feed report tiles directly. The fact attribution also runs in Spark SQL.",
          he: "טבלאות fact רזות, dimensions אחידות עם רשומת \"לא ידוע\", מפתחות פרויקט שלא משתנים לעולם, ו-marts שמזינים ישירות את אריחי הדוח. שיוך ה-fact רץ גם ב-Spark SQL.",
        },
        tables: ["fact_worklog · fact_assignment_month", "dim_user · dim_project · dim_deliverable · dim_date", "mart_sold_vs_utilized · mart_coverage_month", "mart_nonloggers · audit_unmatched_workers"],
      },
    ],
    orchestrator: {
      en: "Every run, scheduled daily (incremental) and monthly (full), goes through one orchestrator under one run ID:",
      he: "כל ריצה, יומית (incremental) או חודשית (full), עוברת דרך orchestrator אחד תחת run ID אחד:",
    },
    steps: ["nb_land_synthetic", "nb_bronze_ingest", "nb_silver_users", "nb_silver_worklogs", "nb_gold", "nb_quality"],
  },

  runs: {
    h: { en: "A week of runs", he: "שבוע של ריצות" },
    intro: {
      en: "One backfill, then a daily incremental run per day. Each step is logged to `ops_run_log`; all six steps succeeded every time.",
      he: "טעינה ראשונית אחת, ואחריה ריצה יומית incremental בכל יום. כל שלב נרשם ב-`ops_run_log`, וכל ששת השלבים הצליחו בכל פעם.",
    },
    cols: [{ en: "Run date", he: "תאריך ריצה" }, { en: "Mode", he: "מצב" }, { en: "Seconds", he: "שניות" }],
    full: { en: "full (backfill from Jan 1)", he: "full (טעינה מ-1 בינואר)" },
    incremental: { en: "incremental", he: "incremental" },
    rows: [
      ["2026-09-30", "full", "30.5"],
      ["2026-10-01", "incremental", "17.3"],
      ["2026-10-02", "incremental", "19.5"],
      ["2026-10-03", "incremental", "16.0"],
      ["2026-10-04", "incremental", "16.8"],
      ["2026-10-05", "incremental", "16.8"],
      ["2026-10-06", "incremental", "16.2"],
      ["2026-10-07", "incremental", "17.0"],
    ] as [string, "full" | "incremental", string][],
  },

  rules: {
    h: { en: "Ranked matching rules, with ambiguous cases sent for review", he: "כללי התאמה מדורגים, ומקרים לא חד-משמעיים נשלחים לבדיקה" },
    intro: {
      en: "Every worklog is attributed to a person by the first rule that matches. Rules 3 and 4 are educated guesses, so they only apply when the person's name is unique in the directory.",
      he: "כל דיווח שעות משויך לאדם לפי הכלל הראשון שמתאים. כללים 3 ו-4 הם ניחוש מושכל, ולכן הם חלים רק כשהשם של האדם ייחודי בספרייה.",
    },
    cols: [{ en: "#", he: "#" }, { en: "Rule", he: "כלל" }, { en: "Share of hours", he: "חלק מהשעות" }],
    rows: [
      ["1", { en: "Exact email (directory mail, UPN, alternate emails in the mapping file)", he: "מייל זהה (המייל בספרייה, UPN, מיילים חלופיים בקובץ המיפוי)" }, "85.9%"],
      ["2", { en: "The source's own ID (tracker key in the mapping file)", he: "המזהה של המקור עצמו (מפתח מערכת המשימות בקובץ המיפוי)" }, "2.2%"],
      ["3", { en: "Same name at the default domain (legacy and external domains)", he: "אותו שם בדומיין ברירת המחדל (דומיינים ישנים וחיצוניים)" }, "5.4%"],
      ["4", { en: "Swapped last.first login", he: "שם משתמש הפוך, last.first" }, "4.4%"],
      ["—", { en: "No unambiguous match: kept as Unknown, sent to the review worklist", he: "אין התאמה חד-משמעית: נשמר כ\"לא ידוע\" ונשלח לרשימת הבדיקה" }, "2.2%"],
    ] as [string, L, string][],
  },

  review: {
    h: { en: "The review loop", he: "לולאת הבדיקה" },
    intro: {
      en: "After the demo, the quality gate raises one warning: 2.2% of hours can't be attributed. The worklist says exactly why:",
      he: "אחרי הדמו, שער האיכות מעלה אזהרה אחת: 2.2% מהשעות לא ניתנות לשיוך. רשימת העבודה מסבירה בדיוק למה:",
    },
    entries: { en: "entries", he: "רשומות" },
    hours: { en: "hours", he: "שעות" },
    cards: [
      { source: { en: "TIMESHEET APP", he: "מערכת דיווח השעות" }, login: "romero.nicolas@…", entries: "376", hours: "1,430", why: { en: "Swapped login, and there are two Nicolas Romeros", he: "שם משתמש הפוך, ויש שני ניקולס רומרו" } },
      { source: { en: "ISSUE TRACKER", he: "מערכת המשימות" }, login: "TRK20002", entries: "348", hours: "1,402", why: { en: "Contractor whose tracker account was deleted", he: "קבלן שהחשבון שלו במערכת המשימות נמחק" } },
    ],
    fixIntro: { en: "A person confirms who the first one is and adds one line to the mapping file:", he: "מישהו מוודא מי הראשון ומוסיף שורה אחת לקובץ המיפוי:" },
    fixLine: "nicolas.romero2@lumen.studio,,romero.nicolas@lumen.studio,0,,timesheet login is last.first - confirmed",
    after: {
      en: "On the next daily run all 376 entries are attributed by email and the warning clears. That loop, not a cleverer fuzzy match, is what keeps a report like this trustworthy.",
      he: "בריצה היומית הבאה כל 376 הרשומות משויכות לפי מייל והאזהרה נעלמת. הלולאה הזאת, ולא התאמה מקורבת חכמה יותר, היא מה ששומר על דוח כזה אמין.",
    },
  },

  gate: {
    h: { en: "The quality gate", he: "שער האיכות" },
    intro: {
      en: "18 checks run after every load. An error fails the run, so a broken load never reaches the report; a warning is recorded for someone to look at.",
      he: "18 בדיקות רצות אחרי כל טעינה. שגיאה מכשילה את הריצה, כך שטעינה שבורה לא מגיעה לדוח לעולם; אזהרה נרשמת כדי שמישהו יבדוק.",
    },
    cols: [{ en: "Check", he: "בדיקה" }, { en: "Severity", he: "חומרה" }, { en: "Last run", he: "ריצה אחרונה" }],
    error: { en: "error", he: "שגיאה" },
    warn: { en: "warn", he: "אזהרה" },
    pass: { en: "Pass", he: "עבר" },
    warning: { en: "Warning", he: "אזהרה" },
    rows: [
      [{ en: "Silver entries are unique; hours between 0 and 24; no future dates", he: "רשומות silver ייחודיות; שעות בין 0 ל-24; אין תאריכים עתידיים" }, "error", "pass"],
      [{ en: "Fact rows and hours reconcile exactly with silver (no fan-out, nothing lost)", he: "השורות והשעות ב-fact תואמות בדיוק ל-silver (אין שכפול, שום דבר לא אבד)" }, "error", "pass"],
      [{ en: "Every fact row has a user, project and date in its dimension", he: "לכל שורה ב-fact יש משתמש, פרויקט ותאריך ב-dimension שלה" }, "error", "pass"],
      [{ en: "Project keys are unique and unchanged since the previous Delta version", he: "מפתחות הפרויקט ייחודיים ולא השתנו מאז גרסת ה-Delta הקודמת" }, "error", "pass"],
      [{ en: "SCD2: one current version per user, no overlapping versions", he: "SCD2: גרסה נוכחית אחת לכל משתמש, בלי גרסאות חופפות" }, "error", "pass"],
      [{ en: "Every landed file was ingested", he: "כל קובץ שנחת נטען" }, "error", "pass"],
      [{ en: "No person-day over 16 hours; no identifier claimed by two people", he: "אין יום-אדם מעל 16 שעות; אין מזהה ששייך לשני אנשים" }, "warn", "pass"],
      [{ en: "Coverage last month within 10% of everyone expected", he: "הכיסוי בחודש שעבר בטווח של 10% מכל מי שצפוי לדווח" }, "warn", "pass"],
      [{ en: "Unattributed hours under 2% (2.16% until the review above)", he: "שעות לא משויכות מתחת ל-2% (2.16% עד הבדיקה שלמעלה)" }, "warn", "warn"],
    ] as [L, "error" | "warn", "pass" | "warn"][],
    story: {
      en: "The gate earned its place during the build: when two runs landed snapshots with the same timestamp, the CRM dimension doubled and the fact table fanned out. The reconciliation check failed the run before any report could show the wrong totals.",
      he: "השער הוכיח את עצמו כבר בזמן הבנייה: כששתי ריצות הנחיתו snapshots עם אותה חותמת זמן, ה-dimension של ה-CRM הוכפל וטבלת ה-fact התנפחה. בדיקת ההתאמה הכשילה את הריצה לפני שדוח כלשהו הספיק להציג סכומים שגויים.",
    },
  },

  gold: {
    h: { en: "What the gold layer answers", he: "על מה שכבת ה-gold עונה" },
    coverage: {
      h: { en: "Who is logging their time?", he: "מי מדווח שעות?" },
      intro: { en: "People expected to log (enabled, not exempt, employed that month) vs people who did.", he: "מי שצפוי לדווח (חשבון פעיל, לא פטור, מועסק באותו חודש) מול מי שדיווח בפועל." },
      cols: [{ en: "2026", he: "2026" }, { en: "Expected", he: "צפויים" }, { en: "Logging", he: "מדווחים" }, { en: "Coverage", he: "כיסוי" }],
      months: [
        { en: "Jan", he: "ינואר" }, { en: "Feb", he: "פברואר" }, { en: "Mar", he: "מרץ" }, { en: "Apr", he: "אפריל" }, { en: "May", he: "מאי" },
        { en: "Jun", he: "יוני" }, { en: "Jul", he: "יולי" }, { en: "Aug", he: "אוגוסט" }, { en: "Sep", he: "ספטמבר" },
      ],
      rows: [
        [89, 86, "96.6%"], [91, 88, "96.7%"], [92, 89, "96.7%"], [93, 90, "96.8%"], [94, 91, "96.8%"],
        [94, 91, "96.8%"], [94, 91, "96.8%"], [92, 89, "96.7%"], [95, 87, "91.6%"],
      ] as [number, number, string][],
      after: {
        en: "September drops because five people stopped logging in mid-August. They show up by name in `gold_mart_nonloggers`, with their manager, so someone can follow up.",
        he: "בספטמבר יש ירידה כי חמישה אנשים הפסיקו לדווח באמצע אוגוסט. הם מופיעים בשמם ב-`gold_mart_nonloggers`, יחד עם המנהל שלהם, כדי שמישהו יוכל לטפל בזה.",
      },
    },
    sold: {
      h: { en: "Is sold time being used?", he: "האם הזמן שנמכר מנוצל?" },
      intro: {
        en: "CRM assignments prorated by month and allocation, compared with hours logged against the same client. One row per person, client and month; hours.",
        he: "שיבוצים מה-CRM, מחולקים לפי חודש והיקף משרה, מול השעות שדווחו על אותו לקוח. שורה לכל אדם, לקוח וחודש; בשעות.",
      },
      cols: [{ en: "Status", he: "סטטוס" }, { en: "Rows", he: "שורות" }, { en: "Sold", he: "נמכר" }, { en: "Logged", he: "דווח" }],
      rows: [
        [{ en: "ok", he: "תקין" }, "846", "77,942", "66,625"],
        [{ en: "under-utilized (logged < 70% of sold)", he: "ניצול חסר (דווח פחות מ-70% ממה שנמכר)" }, "521", "44,610", "21,045"],
        [{ en: "assigned, not logging", he: "משובץ, לא מדווח" }, "89", "6,804", "0"],
        [{ en: "logging, not assigned", he: "מדווח, לא משובץ" }, "1,052", "0", "20,380"],
      ] as [L, string, string, string][],
    },
    history: {
      h: { en: "What did a person's record look like on a given day?", he: "איך נראתה הרשומה של אדם ביום מסוים?" },
      intro: { en: "Department moves in early October, kept as history instead of overwritten:", he: "מעברי מחלקה בתחילת אוקטובר, שנשמרים כהיסטוריה במקום להידרס:" },
      cols: [{ en: "Person", he: "אדם" }, { en: "Department", he: "מחלקה" }, { en: "Valid from", he: "בתוקף מ-" }, { en: "Valid to", he: "בתוקף עד" }],
      current: { en: "current", he: "נוכחי" },
      rows: [
        ["Elena Vera", { en: "Strategy", he: "אסטרטגיה" }, "2026-09-30", "2026-10-04"],
        ["Elena Vera", { en: "Engineering", he: "הנדסה" }, "2026-10-04", ""],
        ["Gonzalo Sosa", { en: "Engineering", he: "הנדסה" }, "2026-09-30", "2026-10-03"],
        ["Gonzalo Sosa", { en: "Data", he: "דאטה" }, "2026-10-03", ""],
      ] as [string, L, string, string][],
    },
  },

  decisions: {
    h: { en: "Design decisions", he: "החלטות תכנון" },
    intro: {
      en: "The four choices that shape the project, written as architecture decision records: what forced the decision, what was decided, and what it costs.",
      he: "ארבע הבחירות שמעצבות את הפרויקט, כתובות כרשומות החלטה ארכיטקטוניות: מה חייב את ההחלטה, מה הוחלט, ומה המחיר.",
    },
    labels: {
      context: { en: "Context", he: "רקע" },
      decision: { en: "Decision", he: "החלטה" },
      consequences: { en: "Consequences", he: "השלכות" },
      status: { en: "Accepted · 2026-10-14", he: "התקבלה · 2026-10-14" },
    },
    items: [
      {
        n: "0001",
        title: { en: "Right-size the engine: Python notebooks for the daily load", he: "מנוע בגודל הנכון: Python notebooks לטעינה היומית" },
        context: {
          en: "The workload is small: about 30k worklog rows a quarter, a few hundred users, a few thousand CRM rows. Fabric offers Spark notebooks and Python notebooks; Python notebooks run a single-node kernel with deltalake, DuckDB, pandas and pyarrow preinstalled. The project also had to run on a Windows laptop with no Java, Docker or WSL, so a reviewer can clone it and see the tables.",
          he: "העומס קטן: בערך 30 אלף שורות דיווח ברבעון, כמה מאות משתמשים וכמה אלפי שורות CRM. Fabric מציע Spark notebooks ו-Python notebooks; ה-Python notebooks רצים על kernel של צומת יחיד, עם deltalake, DuckDB, pandas ו-pyarrow מותקנים מראש. הפרויקט גם היה צריך לרוץ על לפטופ Windows בלי Java, Docker או WSL, כדי שמי שבודק אותו יוכל לשכפל אותו ולראות את הטבלאות.",
        },
        decision: {
          en: "Every notebook in the daily pipelines is a Fabric Python notebook. Transformations are DuckDB SQL over Arrow; reads and writes go through delta-rs, including MERGE for SCD2. A local runner executes the same notebook files with a stand-in for `notebookutils`.",
          he: "כל notebook ב-pipelines היומיים הוא Fabric Python notebook. הטרנספורמציות הן DuckDB SQL על Arrow; קריאה וכתיבה עוברות דרך delta-rs, כולל MERGE ל-SCD2. מריץ מקומי מפעיל את אותם קובצי notebook עם תחליף ל-`notebookutils`.",
        },
        consequences: [
          { en: "Sessions start in seconds and use a fraction of the capacity units a Spark pool would. That matters on an F2/F4 capacity shared with reports.", he: "סשנים עולים תוך שניות וצורכים חלק קטן מיחידות הקיבולת ש-Spark pool היה צורך. זה משמעותי על קיבולת F2/F4 שמשותפת עם דוחות." },
          { en: "The Python path runs on the laptop, in CI and in Fabric; the Spark path runs in CI and Fabric.", he: "מסלול ה-Python רץ על הלפטופ, ב-CI וב-Fabric; מסלול ה-Spark רץ ב-CI וב-Fabric." },
          { en: "The SQL is close to Spark SQL, and ADR 0004 carries the core logic over to PySpark, proven identical in CI.", he: "ה-SQL קרוב ל-Spark SQL, ו-ADR 0004 מעביר את לוגיקת הליבה ל-PySpark, עם הוכחה ב-CI שהתוצאה זהה." },
          { en: "Next, for a genuinely big source: Spark tuning (partitioning, OPTIMIZE and VACUUM schedules, V-Order).", he: "השלב הבא, למקור גדול באמת: כוונון Spark (partitioning, תזמוני OPTIMIZE ו-VACUUM, V-Order)." },
        ],
      },
      {
        n: "0002",
        title: { en: "Recompute silver worklogs with the person-day rule", he: "חישוב מחדש של silver worklogs לפי כלל יום-האדם" },
        context: {
          en: "Both time sources let people edit and delete entries long after the work date. The APIs only answer \"what changed since X\", and can't report a day whose entries were all deleted, because nothing is left to return. A classic incremental MERGE on entry ID handles edits but not deletions, and its result depends on the order and batching of past runs.",
          he: "בשני מקורות השעות אפשר לערוך ולמחוק רשומות זמן רב אחרי יום העבודה. ה-APIs עונים רק על \"מה השתנה מאז X\", ולא יכולים לדווח על יום שכל הרשומות שלו נמחקו, כי לא נשאר מה להחזיר. MERGE incremental קלאסי לפי מזהה רשומה מטפל בעריכות אבל לא במחיקות, והתוצאה שלו תלויה בסדר ובחלוקה של הריצות הקודמות.",
        },
        decision: {
          en: "Extracts are complete person-days: incremental extracts carry every changed person-day in full, and the monthly full extract covers a date window. Silver is recomputed from bronze on every run with one rule: for each person-day, keep the rows of the latest extract that contains it, unless a later full extract covers that date without it. The result is written in one atomic overwrite.",
          he: "השליפות הן ימי-אדם שלמים: שליפה incremental כוללת כל יום-אדם שהשתנה במלואו, והשליפה החודשית המלאה מכסה טווח תאריכים. silver מחושב מחדש מ-bronze בכל ריצה לפי כלל אחד: לכל יום-אדם שומרים את השורות מהשליפה האחרונה שמכילה אותו, אלא אם שליפה מלאה מאוחרת יותר מכסה את התאריך הזה בלעדיו. התוצאה נכתבת ב-overwrite אטומי אחד.",
        },
        consequences: [
          { en: "Edits and partial deletions are handled by the daily run. A whole deleted day disappears at the next monthly full run: the only gap, documented and tested.", he: "עריכות ומחיקות חלקיות מטופלות בריצה היומית. יום שנמחק כולו נעלם בריצה החודשית המלאה הבאה: זה הפער היחיד, והוא מתועד ונבדק." },
          { en: "Silver is a pure function of bronze, so replaying the landing archive in any batching gives the same table, and a backfill is just another full extract.", he: "silver הוא פונקציה טהורה של bronze, ולכן הרצה חוזרת של ארכיון הקבצים בכל חלוקה נותנת את אותה טבלה, וטעינה לאחור היא פשוט עוד שליפה מלאה." },
          { en: "Recomputing takes about a second at this volume. Past a few million rows, restrict it to the person-days a run touched and apply it with MERGE, using the same rule.", he: "החישוב מחדש לוקח בערך שנייה בנפח הזה. מעבר לכמה מיליוני שורות, מגבילים אותו לימי-האדם שהריצה נגעה בהם ומחילים אותו עם MERGE, לפי אותו כלל." },
        ],
      },
      {
        n: "0003",
        title: { en: "Clean-room rebuild on synthetic sources", he: "בנייה מחדש נקייה על מקורות סינתטיים" },
        context: {
          en: "The problems this project solves come from a platform I run in production on Microsoft Fabric: consolidating worklogs from two systems, resolving identities across domains and logins, keeping finance-facing keys stable, and comparing sold with logged hours. That work, its code and its data belong to an employer, and this project is public.",
          he: "הבעיות שהפרויקט פותר באות מפלטפורמה שאני מפעיל בייצור ב-Microsoft Fabric: איחוד דיווחי שעות משתי מערכות, זיהוי אנשים על פני דומיינים ושמות משתמש, שמירה על מפתחות יציבים לכספים, והשוואה בין שעות שנמכרו לשעות שדווחו. העבודה הזאת, הקוד שלה והנתונים שלה שייכים למעסיק, והפרויקט הזה ציבורי.",
        },
        decision: {
          en: "Rebuild from scratch on a fictional company with synthetic, deterministic sources. The generator reproduces the kinds of source behaviour that make the problem hard: blank emails for deactivated users, mixed timestamp formats, legacy and external domains, swapped logins, namesakes, overlapping API pages, late logging, edits and deletions. No code, schema, name, identifier, client or number is copied.",
          he: "לבנות מאפס על חברה בדיונית עם מקורות סינתטיים ודטרמיניסטיים. המחולל משחזר את סוגי ההתנהגות שהופכים את הבעיה לקשה: מייל ריק למשתמשים שהושבתו, פורמטים מעורבים של חותמות זמן, דומיינים ישנים וחיצוניים, שמות משתמש הפוכים, שמות זהים, עמודי API חופפים, דיווח באיחור, עריכות ומחיקות. שום קוד, סכמה, שם, מזהה, לקוח או מספר לא הועתקו.",
        },
        consequences: [
          { en: "The project can be public, and anyone can run it end to end.", he: "הפרויקט יכול להיות ציבורי, וכל אחד יכול להריץ אותו מקצה לקצה." },
          { en: "The generator doubles as a test fixture: every quirk exists on purpose, on fixed people, so tests can assert how each one is handled.", he: "המחולל משמש גם כ-fixture לבדיקות: כל חריגה קיימת בכוונה, אצל אנשים קבועים, כך שהבדיקות יכולות לוודא איך כל אחת מטופלת." },
          { en: "The story of what went wrong in production lives in this case study, in general terms.", he: "הסיפור של מה שהשתבש בייצור נמצא בתיאור הזה, במונחים כלליים." },
        ],
      },
      {
        n: "0004",
        title: { en: "A Spark path, proven identical in CI", he: "מסלול Spark, עם הוכחה ב-CI שהוא זהה" },
        context: {
          en: "ADR 0001 chose Python notebooks because the volume doesn't need a cluster. That stays true, but most Fabric teams run Spark, and \"the SQL ports to Spark\" is worth more shown than said.",
          he: "ADR 0001 בחר ב-Python notebooks כי הנפח לא מצדיק cluster. זה עדיין נכון, אבל רוב הצוותים ב-Fabric עובדים עם Spark, ועדיף להראות ש\"ה-SQL עובר ל-Spark\" מאשר רק לומר את זה.",
        },
        decision: {
          en: "Port the parts with real logic to PySpark and Spark SQL as Fabric Spark notebooks: the person-day rule, the SCD2 history with the Delta Lake MERGE API and the identity map, and the ranked matching rules. They read the same bronze tables and write `spark_*` tables, and `nb_parity` compares each one with its Python counterpart in both directions and fails on any difference. In CI, a job with Java 17, Spark 3.5 and Delta 3.2 (the Fabric Runtime 1.3 versions) runs the whole sequence over five runs and requires zero differences.",
          he: "להעביר את החלקים עם הלוגיקה האמיתית ל-PySpark ו-Spark SQL כ-Spark notebooks של Fabric: כלל יום-האדם, היסטוריית ה-SCD2 עם ה-MERGE API של Delta Lake ומפת הזהויות, וכללי ההתאמה המדורגים. הם קוראים את אותן טבלאות bronze וכותבים טבלאות `spark_*`, ו-`nb_parity` משווה כל אחת לטבלה המקבילה ב-Python בשני הכיוונים ונכשל על כל הבדל. ב-CI, job עם Java 17, Spark 3.5 ו-Delta 3.2 (הגרסאות של Fabric Runtime 1.3) מריץ את כל הרצף על חמש ריצות ודורש אפס הבדלים.",
        },
        consequences: [
          { en: "Switching engines later is a cut-over, not a rewrite: run both, compare, switch.", he: "מעבר מנוע בהמשך הוא החלפה, לא שכתוב: מריצים את שניהם, משווים, מחליפים." },
          { en: "Dimensions, marts and the project registry stay on the primary path, so the shadow fact points at the same keys and can be compared row by row.", he: "ה-dimensions, ה-marts ורשימת הפרויקטים נשארים במסלול הראשי, כך שה-fact המקביל מצביע על אותם מפתחות ואפשר להשוות שורה מול שורה." },
          { en: "Porting changed the syntax, not the logic: `distinct on` and `qualify` became window functions, and timestamp parsing moved to `to_timestamp` with unparseable values as NULL.", he: "ההעברה שינתה תחביר, לא לוגיקה: `distinct on` ו-`qualify` הפכו לפונקציות חלון, ופענוח חותמות הזמן עבר ל-`to_timestamp`, כשערך שלא ניתן לפענח הופך ל-NULL." },
          { en: "Day-to-day development stays on the fast Python path; the parity job runs the Spark notebooks on every push and pull request.", he: "הפיתוח השוטף נשאר במסלול ה-Python המהיר; job ההשוואה מריץ את ה-Spark notebooks בכל push ו-pull request." },
        ],
      },
    ],
  },

  real: {
    h: { en: "What's real and what's simulated", he: "מה אמיתי ומה מדומה" },
    rows: [
      [{ en: "Fabric items in Git format, fabric-cicd deploy, parameter.yml per environment", he: "פריטי Fabric בפורמט Git, פריסה עם fabric-cicd, parameter.yml לכל סביבה" }, { en: "Real", he: "אמיתי" }],
      [{ en: "Notebooks, Delta tables, MERGE, quality gate, run log", he: "Notebooks, טבלאות Delta, MERGE, שער איכות, יומן ריצות" }, { en: "Real, and the same files run locally", he: "אמיתי, ואותם קבצים רצים מקומית" }],
      [{ en: "CI: lint, item checks, end-to-end runs on a temporary lakehouse", he: "CI: lint, בדיקות פריטים, ריצות מקצה לקצה על lakehouse זמני" }, { en: "Real", he: "אמיתי" }],
      [{ en: "Spark version of silver and the fact table (PySpark, Spark SQL, Delta MERGE)", he: "גרסת Spark של silver ושל טבלת ה-fact (PySpark, Spark SQL, Delta MERGE)" }, { en: "Real, identical to the Python path (checked in CI)", he: "אמיתי, זהה למסלול ה-Python (נבדק ב-CI)" }],
      [{ en: "Source systems (timesheets, issue tracker, directory, CRM)", he: "מערכות המקור (דיווח שעות, מערכת משימות, ספרייה, CRM)" }, { en: "Synthetic, deterministic, with real-world quirks", he: "סינתטי, דטרמיניסטי, עם חריגות מהעולם האמיתי" }],
      [{ en: "Running on Microsoft Fabric", he: "רץ ב-Microsoft Fabric" }, { en: "Yes, in production (a work tenant, so it isn't linked here); this public rebuild uses the same items and the same fabric-cicd deploy", he: "כן, בייצור (tenant של העבודה, ולכן אין כאן קישור); השחזור הציבורי משתמש באותם פריטים ובאותה פריסה עם fabric-cicd" }],
      [{ en: "Power BI Direct Lake model and report", he: "מודל ודוח Power BI ב-Direct Lake" }, { en: "Next", he: "השלב הבא" }],
    ] as [L, L][],
  },

  run: {
    h: { en: "Run it yourself", he: "להריץ בעצמך" },
    stack: {
      en: "PySpark · Spark SQL · Delta Lake · Microsoft Fabric (Lakehouse, Python and Spark notebooks, Data Pipelines, Variable Library) · fabric-cicd · Python · DuckDB · GitHub Actions. All people, clients and emails are synthetic.",
      he: "PySpark · Spark SQL · Delta Lake · Microsoft Fabric (Lakehouse, Python and Spark notebooks, Data Pipelines, Variable Library) · fabric-cicd · Python · DuckDB · GitHub Actions. כל האנשים, הלקוחות והמיילים סינתטיים.",
    },
    more: { en: "Want to read the code?", he: "רוצים לקרוא את הקוד?" },
    repo: { en: "The code, tests and README are on GitHub.", he: "הקוד, הבדיקות וה-README נמצאים ב-GitHub." },
  },
  back: { en: "← All projects", he: "→ כל הפרויקטים" },
};

// ---- navigation, page headers, flow chart -----------------------------------------------
export const UI = {
  nav: {
    overview: { en: "Overview", he: "סקירה" },
    architecture: { en: "Architecture", he: "ארכיטקטורה" },
    identity: { en: "Identity resolution", he: "זיהוי אנשים" },
    quality: { en: "Quality gate", he: "שער איכות" },
    outputs: { en: "Outputs", he: "תוצרים" },
    decisions: { en: "Design decisions", he: "החלטות תכנון" },
  },
  footer: [
    { en: "synthetic data", he: "נתונים סינתטיים" },
    { en: "demo run · 2026-10-14", he: "ריצת דמו · 2026-10-14" },
    { en: "Python + Spark paths · CI", he: "מסלולי Python ו-Spark · CI" },
  ],
  heads: {
    overview: { eyebrow: { en: "Overview", he: "סקירה" }, h1: { en: "Worklog Lakehouse", he: "Worklog Lakehouse" } },
    architecture: {
      eyebrow: { en: "Architecture", he: "ארכיטקטורה" },
      h1: { en: "One medallion, two engines: PySpark and Python", he: "Medallion אחד, שני מנועים: PySpark ו-Python" },
      lead: {
        en: "Four source systems land as raw extracts, move through bronze, silver and gold under one orchestrator, and pass a quality gate before Power BI reads them. The core logic runs in Python notebooks and again in PySpark / Spark SQL, and a parity gate proves both produce identical tables.",
        he: "ארבע מערכות מקור נוחתות כשליפות גולמיות, עוברות דרך bronze, silver ו-gold תחת orchestrator אחד, ועוברות שער איכות לפני ש-Power BI קורא אותן. לוגיקת הליבה רצה ב-Python notebooks ושוב ב-PySpark / Spark SQL, ושער השוואה מוכיח ששניהם מפיקים טבלאות זהות.",
      },
    },
    identity: {
      eyebrow: { en: "Identity resolution", he: "זיהוי אנשים" },
      h1: { en: "Every hour belongs to someone, or goes to review", he: "כל שעה שייכת למישהו, או נשלחת לבדיקה" },
    },
    quality: {
      eyebrow: { en: "Quality gate", he: "שער איכות" },
      h1: { en: "A broken load never reaches the report", he: "טעינה שבורה לא מגיעה לדוח" },
    },
    outputs: {
      eyebrow: { en: "Outputs", he: "תוצרים" },
      h1: { en: "What the gold layer answers", he: "על מה שכבת ה-gold עונה" },
    },
    decisions: {
      eyebrow: { en: "Design decisions", he: "החלטות תכנון" },
      h1: { en: "Why it's built this way", he: "למה זה בנוי ככה" },
    },
  },
  swipe: { en: "Swipe the diagram sideways to see all of it.", he: "גללו את התרשים הצידה כדי לראות את כולו." },
  legend: [
    { cls: "data", en: "Sources and storage", he: "מקורות ואחסון" },
    { cls: "det", en: "Fabric items (deterministic)", he: "פריטי Fabric (דטרמיניסטיים)" },
    { cls: "ok", en: "Quality and control", he: "איכות ובקרה" },
    { cls: "ai", en: "Consumers", he: "צרכנים" },
  ],
  diagram: {
    aria: { en: "Architecture diagram", he: "תרשים ארכיטקטורה" },
    rowSources: { en: "SOURCE SYSTEMS", he: "מערכות מקור" },
    rowMedallion: { en: "MEDALLION · ONE RUN", he: "MEDALLION · ריצה אחת" },
    rowOps: { en: "OPERATIONS", he: "תפעול" },
    rowDelivery: { en: "DELIVERY", he: "אספקה" },
    sources: [
      { t: { en: "Timesheet SaaS", he: "מערכת דיווח שעות" }, s: { en: "flat rows · blank emails for leavers\nthree timestamp formats", he: "שורות שטוחות · מייל ריק לעוזבים\nשלושה פורמטים של זמן" } },
      { t: { en: "Issue tracker", he: "מערכת משימות" }, s: { en: "nested JSON · opaque author keys\noverlapping API pages", he: "JSON מקונן · מפתחות כותב אטומים\nעמודי API חופפים" } },
      { t: { en: "Directory (Entra ID)", he: "ספרייה (Entra ID)" }, s: { en: "snapshot · departments · managers\nhire and leave dates", he: "snapshot · מחלקות · מנהלים\nתאריכי קליטה ועזיבה" } },
      { t: { en: "CRM", he: "CRM" }, s: { en: "accounts · deliverables · assignments\nwho was sold where", he: "לקוחות · תוצרים · שיבוצים\nמי נמכר לאן" } },
    ],
    landing: {
      t: { en: "Landing · Files/landing", he: "נחיתה · Files/landing" },
      s: {
        en: "one JSON envelope per extract (full · incremental · snapshot) · kept as the replay archive\nCopy jobs land them in production; nb_land_synthetic writes them in the demo",
        he: "מעטפת JSON אחת לכל שליפה (full · incremental · snapshot) · נשמרת כארכיון לשחזור\nבייצור Copy jobs מנחיתים אותן; בדמו nb_land_synthetic כותב אותן",
      },
    },
    stages: [
      { cls: "det", t: { en: "Bronze", he: "Bronze" }, s: { en: "nb_bronze_ingest\nappend-only · strings\nlineage on every row", he: "nb_bronze_ingest\nהוספה בלבד · מחרוזות\nlineage בכל שורה" } },
      { cls: "det", t: { en: "Silver · users", he: "Silver · משתמשים" }, s: { en: "nb_silver_users\nSCD2 in one MERGE\nidentity map", he: "nb_silver_users\nSCD2 ב-MERGE אחד\nמפת זהויות" } },
      { cls: "det", t: { en: "Silver · worklogs", he: "Silver · דיווחים" }, s: { en: "nb_silver_worklogs\nperson-day rule\nreplayable", he: "nb_silver_worklogs\nכלל יום-האדם\nניתן לשחזור" } },
      { cls: "det", t: { en: "Gold", he: "Gold" }, s: { en: "nb_gold\nstar schema · marts\nstable project keys", he: "nb_gold\nstar schema · marts\nמפתחות פרויקט קבועים" } },
      { cls: "ok", t: { en: "Quality gate", he: "שער איכות" }, s: { en: "nb_quality\n18 checks\nan error fails the run", he: "nb_quality\n18 בדיקות\nשגיאה מכשילה ריצה" } },
      { cls: "ai", t: { en: "Power BI", he: "Power BI" }, s: { en: "Direct Lake\nreports and tiles\non gold_ tables", he: "Direct Lake\nדוחות ואריחים\nעל טבלאות gold_" } },
    ],
    orchestrator: {
      t: { en: "Orchestration", he: "תזמור" },
      s: { en: "pl_daily (incremental) · pl_monthly_full (full)\n→ nb_orchestrator: one run_id, steps called by name", he: "pl_daily (incremental) · pl_monthly_full (full)\n→ nb_orchestrator: run_id אחד, שלבים לפי שם" },
    },
    mapping: { t: { en: "user_mapping.csv", he: "user_mapping.csv" }, s: { en: "tracker keys · alt emails\nmaintained by a person", he: "מפתחות · מיילים חלופיים\nמתוחזק בידי אדם" } },
    ops: { t: { en: "ops_run_log · ops_quality_results", he: "ops_run_log · ops_quality_results" }, s: { en: "every step and every check, per run\nmonitoring and trends", he: "כל שלב וכל בדיקה, לכל ריצה\nניטור ומגמות" } },
    ci: { t: { en: "CI · GitHub Actions", he: "CI · GitHub Actions" }, s: { en: "lint · item checks · end-to-end runs · Spark vs Python parity", he: "lint · בדיקות פריטים · ריצות מקצה לקצה · השוואת Spark מול Python" } },
    deploy: { t: { en: "Deploy · fabric-cicd", he: "פריסה · fabric-cicd" }, s: { en: "Git-format items → dev / prod workspace · parameter.yml swaps IDs", he: "פריטים בפורמט Git → workspace של dev / prod · parameter.yml מחליף מזהים" } },
    rowSpark: { en: "SPARK PATH · SAME LOGIC IN PYSPARK AND SPARK SQL", he: "מסלול SPARK · אותה לוגיקה ב-PYSPARK וב-SPARK SQL" },
    spark: [
      { t: { en: "Spark · users", he: "Spark · משתמשים" }, s: { en: "nb_spark_silver_users\nDelta MERGE API (SCD2)", he: "nb_spark_silver_users\nDelta MERGE API (SCD2)" } },
      { t: { en: "Spark · worklogs", he: "Spark · דיווחים" }, s: { en: "nb_spark_silver_worklogs\nperson-day rule, Spark SQL", he: "nb_spark_silver_worklogs\nכלל יום-האדם, Spark SQL" } },
      { t: { en: "Spark · fact", he: "Spark · fact" }, s: { en: "nb_spark_gold_fact\nranked matching rules", he: "nb_spark_gold_fact\nכללי התאמה מדורגים" } },
    ],
    parity: { t: { en: "Parity gate", he: "שער השוואה" }, s: { en: "nb_parity · Python vs Spark\nzero differences required", he: "nb_parity · Python מול Spark\nנדרשים אפס הבדלים" } },
    secrets: { en: "settings in wl_settings · secrets in Key Vault", he: "הגדרות ב-wl_settings · סודות ב-Key Vault" },
  },
};
