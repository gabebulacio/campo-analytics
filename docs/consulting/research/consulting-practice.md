# Consulting practice research (track A)

Research date: 2026-11-20. Question: what do current (2025-2026) engagements look like for an independent or boutique data, analytics and AI consultant, and what should gabrielbulacio.com show as a result?

Builds on the private case kit's consulting.md (private, not in this repo). That file covers Minto/SCR storytelling (Part A), value cases and outcome pricing (Part B) and CX metrics (Part C). Its findings are cited here as "the private case kit consulting.md §X" and are not repeated.

Weak sources are marked **[weak]**: vendor or firm self-promotion, practitioner blogs, and anything read only through a search snippet or secondary coverage. Details are in "Source quality flags".

Page names used below: **Home** (`/`, today's personal intro), **Services** (new, `/services`), **How I work** (new, `/how-i-work`), **Engagements** (new, `/engagements`, anonymized client work), **Project case studies** (existing `/projects/worklog-lakehouse` and `/projects/campo-analytics/case`), **Notes** (new, optional short writing).

## What this changes on the site

| # | Principle | Site change | Page affected |
|---|---|---|---|
| 1 | Sell a paid, fixed-scope diagnostic first | One named entry offer with duration, fixed fee, deliverables, and fee credited to the next phase | Services, Home (primary CTA) |
| 2 | Offer a short ladder of options, not one service | Three offers: Diagnostic, Build, Fractional. Each with scope, length, exit point | Services |
| 3 | Price per phase; tie fees to outcomes only where you control the levers | State "fixed fee per phase, no hourly billing"; optional performance element only after a baseline exists | Services, How I work |
| 4 | No baseline, no promised number | Diagnostic deliverable includes the measured baseline; no "will save X%" copy anywhere | Services, Engagements, Project case studies |
| 5 | AI work starts with data and definitions | Position governed generative BI as "semantic model and KPI definitions first, then AI on top" | Home, Services |
| 6 | Evals are a scoped, budgeted deliverable | AI pilot offer lists a golden set and pass-rate acceptance criteria; Campo evals page used as the proof | Services, Campo case study |
| 7 | One domain, one workflow, with stop criteria | AI pilot offer names one decision or workflow and the condition under which it is stopped | Services, How I work |
| 8 | The SOW is outcome-based with acceptance criteria and change control | Publish the SOW skeleton (sections, not legal text) | How I work |
| 9 | Handover runs through the whole engagement | Every write-up ends with "What the client owns afterward"; Services lists handover artifacts | Engagements, Project case studies, Services |
| 10 | Buyers verify; proof must be checkable | Link code, live demo, eval report, decision log from each claim; one-page summary a CFO or procurement can forward | Home, Project case studies |
| 11 | Narrow, specific positioning | Headline names the buyer, the problem and the specialty in one sentence | Home |
| 12 | Bring a point of view | 2-4 short Notes with a stated opinion (KPI definitions, governed AI, evals) | Notes, Home |
| 13 | Case study = SCR + decision + measured outcome with method + limits + ownership | One fixed template for every write-up | Engagements, Project case studies |
| 14 | Anonymize by descriptor, keep the specifics, use precise status words | "Client identity withheld" label, role and scope stated, no figures unless approved, demos labelled as built on synthetic/public data | Engagements, Project case studies |
| 15 | Be explicit about how AI is used in delivery | Short "How I use AI" note: AI-assisted, human-reviewed, evaluated; no AI-written client reports | How I work |
| 16 | State fit, misfit and risk reversal plainly | "Good fit / not a fit" list; stop after any phase and keep deliverables | Services |

---

## 1. Sell a paid, fixed-scope diagnostic as the entry offer

**Principle.** The first paid step is a short diagnostic with a fixed fee and a written output (findings, recommendations, a priced plan for the next phase). It replaces free scoping work and unpaid proposals. In AI work, buyers in 2025 were mostly buying small, scoped projects to test value before larger ones.

**Sources.**
- Blair Enns, Win Without Pitching. Official site's answer to "how do you scope a messy or complex opportunity" is "Sell a Diagnostic" (seen via search snippet; site returned empty content on fetch) **[weak]**. https://winwithoutpitching.com . Enns's podcast "Phase Your Client Engagements" (2Bobs, with David C. Baker), undated. https://twobobs.squarespace.com/podcast/phase-your-client-engagements (listing only, not listened) **[weak]**.
- Emma Carroll, "Should firms dial back their investment in AI consulting services?", Source Global Research, 2025-07-08: 66% of clients used small-scale support to test AI's potential, 54% bought limited-scope projects, 47% bought large transformational projects. https://www.sourceglobalresearch.com/?p=132236
- Arshad Ansari, "What data engineering actually costs, and how I price it", Hikmah Technologies, 2026-07-14: Data Platform Audit, $3,000 fixed, 12-20 hours over one week, recommended only after a scoping call; audit fee credited in full to the build. https://hikmahtechnologies.com/blog/what-data-engineering-costs-and-how-i-price/ **[weak: own site]**
- Valiotti Data homepage (fetched 2026-11-20): "Data Diagnostic", $12,000 fixed, 4 weeks, stakeholder interviews, architecture review, prioritized roadmap. https://valiotti.com/ **[weak: own site]**
- P3 Adaptive homepage (fetched 2026-11-20): two-week accelerator, client owns the output, no invoice if not satisfied. https://p3adaptive.com/ **[weak: own site]**
- Thomas Nys, "Fractional Data Architect" (fetched 2026-11-20): "Platform Review", fixed scope and fixed price, positioned as the entry point. https://thomasnys.com/services/fractional-data-architect/ **[weak: own site]**

**How we apply it on gabrielbulacio.com.**
- Services leads with one offer, for example "KPI and semantic model diagnostic" (2-3 weeks, fixed fee). Deliverables: KPI definition inventory with conflicts, model and lineage review, measured baseline for the 3-5 KPIs that matter, ranked fix list, priced plan for phase 2.
- State that the diagnostic fee is credited if the client goes ahead with the build.
- Home's primary CTA stays the Calendly intro call, labelled as a fit call, with the diagnostic named as the first paid step.

## 2. Offer a short ladder of three options, each with an exit

**Principle.** Give buyers a choice of scopes rather than a yes/no on one proposal. Independent data consultants in 2026 converge on the same ladder: diagnostic, fixed-scope build, then ongoing fractional or advisory work with a minimum term and a planned exit.

**Sources.**
- Alan Weiss, *Value-Based Fees* (3rd ed., Wiley, 2021): section "the choice of yeses"; tip "Provide options every time" and "Always provide an option that is comprehensive and over-budget" (read via O'Reilly table of contents and alanweiss.com tips page, not the book) **[weak]**. https://www.oreilly.com/library/view/value-based-fees-3rd/9781119776925/ ; https://alanweiss.com/resources/hot-tips/forty-methods-to-increase-and-or-protect-fees/
- Hikmah Technologies, 2026-07-14 (above): audit $3k; build $15-40k; AI workflow $10-25k per bounded process plus retainer; fractional advisory $3-4k/month, one day a week, three-month minimum **[weak]**.
- Valiotti Data (above): advisory from $2,500/month, diagnostic $12k, fractional CDO $15-20k/month for 3-6 months ending in knowledge transfer **[weak]**.
- Thomas Nys (above): Platform Review, Fractional Data Architect retainer with "an exit planned from day one", Architecture Advisory **[weak]**.
- David Mitchell, "Beyond time & materials: Rethinking pricing models for AI-augmented consulting", Futurice, 2025-05-09: fixed price fits defined, repeatable scope; T&M fits unclear scope; retainers fit ongoing needs. https://www.futurice.com/blog/rethinking-pricing-models-ai-augmented-consulting **[weak: firm blog]**

**How we apply it on gabrielbulacio.com.**
- Services shows three cards in this order: Diagnostic (fixed, 2-3 weeks) → Build (fixed per phase: semantic model and KPI layer on Fabric/Power BI, or a governed generative BI pilot) → Fractional analytics lead (monthly, minimum term, exit plan).
- Each card has the same four rows: what you get, how long, how it is priced, how it ends.

## 3. Price per phase; put fees at risk only where the consultant controls the levers

**Principle.** Clients and large firms are moving away from hourly billing, and some are moving toward outcome-linked fees. Public-sector and practitioner guidance agrees on the condition: an outcome element is fair only when the result is measurable, a baseline is documented, and the consultant controls the levers. Otherwise use fixed fees per phase with milestone acceptance.

**Sources.**
- UK Cabinet Office, *The Consultancy Playbook* v2.0, GOV.UK, updated 2026-11-06: four payment models (T&M, fixed price, output-based, payment by results); "only ask consultants to risk their profitability" where they control the levers; "Risk should sit with the party best able to manage it"; pricing should move toward output-based as requirements mature. https://www.gov.uk/government/publications/the-consultancy-playbook/the-consultancy-playbook-html
- Anshuman Vedi, "What it takes to make outcome-based pricing work in consulting", Consultancy.uk, 2026-08-27: answer only for what you control; one jointly appointed accountable delivery owner; milestone payments plus a performance element only where responsibility is shared. https://www.consultancy.uk/news/45467/what-it-takes-to-make-outcome-based-pricing-work-in-consulting **[weak: practitioner opinion]**
- Erik Brynjolfsson and Georgios Petropoulos, "Pricing Consulting Services in the Age of Agentic AI: A Strategy Map for Executives", Stanford Digital Economy Lab working paper, 2026-08-23: maps time-based, project, hybrid, subscription and outcome pricing on outcome observability and input-cost observability; argues AI pushes toward hybrid and asset-based pricing (summary page read, not the PDF). https://digitaleconomy.stanford.edu/publication/pricing-consulting-services-in-the-age-of-agentic-ai-a-strategy-map-for-executives/
- IBM Institute for Business Value, "Consulting reimagined, powered by AI", reported by Consultancy.uk 2024-10-28: 73% of consulting buyers want new pricing models; 89% expect consulting to use AI. https://www.consultancy.uk/news/38655/clients-increasingly-expect-consultants-to-be-ai-powered-but-also-believe-pricing-must-adapt **[weak: secondary; IBM sells consulting]**
- McKinsey "about 25% of global fees from outcome-based pricing", attributed to Michael Birshan, Nov 2025 briefing; read only via search snippets (Hunt Scanlon page returned 403). **[weak]**
- Futurice, 2025-05-09 (above): outcome pricing needs clear measurable outcomes, reliable tracking and maturity on both sides **[weak]**.
- Jonathan Stark, *Hourly Billing Is Nuts* (2016); groups alternatives as info product, packaged service, value pricing (via search snippets of jonathanstark.com) **[weak]**. https://jonathanstark.com/hbin
- the private case kit consulting.md §B P8 and §B P13 (outcome pricing works only when the billed outcome is observable and attributable).

**How we apply it on gabrielbulacio.com.**
- Services states: "Fixed fee per phase. No hourly billing." No public rate card for builds; the diagnostic price may be published (see Conflicts).
- How I work adds one line: an outcome-linked element is possible in phase 2 or later, only on a KPI the diagnostic has baselined and that my work controls.

## 4. No baseline, no promised number

**Principle.** A result can only be claimed against a documented starting point measured with the same definition. Before a baseline exists, the honest output is a measurement plan, not a figure.

**Sources.**
- UK Consultancy Playbook v2.0, 2026-11-06 (above): for payment by results, agree "a clear and documented baseline against which any results will be measured"; run a post-engagement evaluation.
- Umbrex, *The Busy Consultant's Guide to Writing Business Cases*, ch. 10, via the private case kit consulting.md §B P3 (every metric needs a sourced, scoped baseline) **[weak: practitioner guide]**.
- the private case kit consulting.md §B P1 (keep measured numbers and assumptions visibly separate).
- Emma Carroll, "AI services: All talk and no investment?", Source Global Research, 2025-03-18: clients want "evidence of a secure return on investment" before committing. https://www.sourceglobalresearch.com/?p=117709
- Barbara Winters, Forrester, 2026-01-21 (Principle 10): buyers "demand proof, not promises" (title wording).

**How we apply it on gabrielbulacio.com.**
- No copy says "will save", "will increase" or gives a percentage the client has not measured.
- The diagnostic card lists "measured baseline for your priority KPIs" as a deliverable, and the build card says results are reported against it.
- Each case study has a "Measured how" line under any number: source table, definition, period, who checked it.

## 5. AI work starts with data foundations and agreed definitions

**Principle.** Research from analysts and firms in 2025-2026 converges: AI projects fail on data readiness, governance and process, not on models. Clients are spending on data infrastructure and AI governance. This is the gap between "a chatbot on our data" and an answer a CFO will sign off.

**Sources.**
- Gartner press release, "Lack of AI-Ready Data Puts AI Projects at Risk", 2025-02-26 (Roxane Edjlali): through 2026, organizations will abandon 60% of AI projects unsupported by AI-ready data; survey: 63% lack or are unsure of right data management practices for AI (page returned 403; figures from snippets and secondary coverage) **[weak]**. https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk
- Fiona Czerniawska, "Understanding the market for AI-related consulting services", Source Global Research, 2026-03-20: 29% of clients investing in data infrastructure, 23% creating internal AI governance; AI-use consulting moved from 11th to 1st among services bought. https://sourceglobalresearch.com/blog-post/understanding-the-market-for-ai-related-consulting-services
- Thoughtworks, AI readiness assessment (FOREST framework; "Ready data" is one of six dimensions), undated page. https://www.thoughtworks.com/what-we-do/ai/ai-readiness **[weak: firm marketing; read via snippet]**
- BCG, "BCG's Approach to Data and Analytics": 10-20-70 rule (10% algorithms, 20% technology, 70% business process and ways of working), undated. https://www.bcg.com/capabilities/digital-technology-data/data-analytics **[weak: firm marketing; snippet]**
- BCG, "The Widening AI Value Gap", 2025-09-30: 5% of 1,250+ firms get substantial value, 60% minimal; main roadblocks organisational (press release and secondary coverage, PDF not read) **[weak]**. https://www.bcg.com/press/30september2025-ai-leaders-outpace-laggards-revenue-growth-cost-savings
- P3 Adaptive homepage: "faucets first", answer real questions on existing data within weeks before a long platform program **[weak]**.

**How we apply it on gabrielbulacio.com.**
- Home headline and Services describe the AI offer as governed: "AI that answers from your semantic model and agreed KPI definitions, and refuses when it can't".
- The diagnostic doubles as the "AI readiness on your data" check: definitions, lineage, access rules, refresh reliability. Avoid a generic multi-dimension maturity score.
- Campo Analytics case study leads with the semantic layer and refusals, not the LLM.

## 6. Evals are a scoped, budgeted deliverable with acceptance criteria

**Principle.** For generative AI work, evaluation is most of the work, not a final QA step: error analysis on real traces first, custom binary pass/fail checks second, one domain expert owning quality. LLM-as-judge needs labelled data and is treated cautiously. High performers define when outputs need human validation.

**Sources.**
- Hamel Husain and Shreya Shankar, "AI Evals: Everything You Need to Know" (FAQ), hamel.dev, page dated 2026-09-18 (PDF version dated 2025-07-31 per search): error analysis first; authors report "60-80% of our development time on error analysis and evaluation"; single domain-expert owner; binary labels; 100-200 labelled examples per failure mode for an LLM judge; report findings as a narrative, they "have rarely found dashboards to be helpful". https://hamel.dev/blog/posts/evals-faq/
- Thoughtworks Technology Radar, "LLM as a judge" moved from Trial to Assess, undated blip page. https://www.thoughtworks.com/radar/techniques/llm-as-a-judge **[weak: snippet]**
- McKinsey, "The state of AI in 2025: Agents, innovation, and transformation" (2025): high performers more likely to have defined processes for when model outputs need human validation (page timed out; read via search snippets) **[weak]**. https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai

**How we apply it on gabrielbulacio.com.**
- AI pilot offer includes: golden question set built with the client's domain owner, error-analysis report, pass/fail gates, and acceptance criteria written as pass rates on that set.
- Campo evals page is linked from Services as "what the eval deliverable looks like".
- Do not sell "evals" as a word; show failure categories found and fixed (narrative, per Husain/Shankar).

## 7. Scope AI to one domain and one workflow, with stop criteria

**Principle.** Value comes from redesigning a specific workflow in a few domains, not from many scattered pilots. Most agentic projects are expected to be cancelled for cost, unclear value or weak risk control, so a pilot needs a value hypothesis and a condition for stopping.

**Sources.**
- McKinsey, *Rewired* material, "Rewired to outcompete" (McKinsey Quarterly): most successful transformers focus on one to three domains; domains prioritized on value and feasibility (snippets) **[weak]**. https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/rewired-to-outcompete
- McKinsey, "The state of AI in 2025" and 2026 successor "On the road to ROI": high performers (about 6%) nearly three times as likely to have fundamentally redesigned workflows (snippets; page timed out) **[weak]**. https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
- Gartner press release, "Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027", 2025-06-25 (Anushree Verma): due to escalating costs, unclear business value or inadequate risk controls (snippets) **[weak]**. https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- MIT NANDA, *The GenAI Divide: State of AI in Business 2025* (July 2025): 95% of organizations get no measurable return on GenAI pilots; external partnerships reach deployment about twice as often as internal builds (secondary coverage only, e.g. Fortune 2025-08-18; criticised as oversimplified) **[weak]**. https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/

**How we apply it on gabrielbulacio.com.**
- AI pilot card: "one decision or workflow, one owner, 4-8 weeks, a stop/go review against the acceptance criteria".
- How I work states the stop rule: if the golden-set pass rate or the data checks fail at the midpoint review, we stop and the client keeps the findings.

## 8. The SOW is outcome-based, with acceptance criteria, decision rights and change control

**Principle.** A good statement of work describes the problem and the result, not the hours. It lists deliverables tied to milestones, how each is accepted, who decides what, and how changes are approved, because acceptance criteria for the original scope do not cover new work.

**Sources.**
- UK Consultancy Playbook v2.0, 2026-11-06 (above): "outcome-based specification rather than an input-based one"; specific, measurable milestones; work packages "directly linked to the deliverables in the specification"; warns "the agreed acceptance criteria for the original scope of the contract may not apply to new work"; guard against scope creep.
- GOV.UK, "How to manage your Digital Outcomes and Specialists contract" (withdrawn guidance): SOW value can rise by up to 20% with an agreed contingency or a written change (snippet; historical) **[weak]**. https://www.gov.uk/guidance/how-to-manage-your-digital-outcomes-and-specialists-contract
- Alan Weiss, *Organizational Consulting* and "Sample Proposals" PDF: proposal sections include situation appraisal, objectives framed as business impact, measures of success, value, methodology, timing, joint accountabilities, terms (via search snippets; full list not confirmed) **[weak]**. https://www.alanweiss.com/styles/pdf/Sample%20Proposals.pdf
- Anshuman Vedi, Consultancy.uk, 2026-08-27 (above): a decision-rights matrix with escalation thresholds **[weak]**.

**How we apply it on gabrielbulacio.com.**
- How I work shows the SOW skeleton as a table: Situation · Objectives (business terms) · Measures of success and baseline · Scope in / out · Deliverables and acceptance criteria · Decision rights (client owner, me) · Change control (written change note, re-priced phase) · Timeline and reviews · Handover · Fees and terms.
- No legal text, no sample prices in the skeleton.

## 9. Handover is continuous, and the client owns everything at the end

**Principle.** Knowledge transfer belongs in every milestone, not only at exit. The aim is that the client does not need to buy the same skills again. Independent data consultants now sell the exit ("build it, then leave") as a feature.

**Sources.**
- UK Consultancy Playbook v2.0, 2026-11-06 (above): knowledge transfer "should be a continuous process throughout the contract, and not just at the exit stage"; pairing, documentation, hands-on training; aim to "reduce the need to buy the same skills and knowledge again"; use consultants for capability gaps, not capacity.
- Valiotti Data: "We solve the problem, build the system, then leave." **[weak]**
- Thomas Nys: architecture decisions "documented so they outlast the engagement", exit planned from day one **[weak]**.
- P3 Adaptive: CFO testimonial about tools and confidence "to own our data" **[weak]**.
- Hikmah: client can stop after any step and keep what they have **[weak]**.

**How we apply it on gabrielbulacio.com.**
- Services lists handover artifacts per offer: TMDL/semantic model in the client's repo, KPI dictionary, decision log (ADRs), eval set and runner, runbook, recorded walkthroughs, one pairing session per milestone.
- Every case study and engagement write-up ends with a "What the client owns afterward" box. The Worklog Lakehouse decisions page and Campo evals page are the existing examples.

## 10. Buyers choose by reputation and verify the claims; make proof checkable

**Principle.** Buyers find providers mostly through their network, then check the website. Reputation and relationships decide, and in 2026 buyers are more risk-averse, use AI to research, and cross-check claims with experts and peers. Buying groups are large and include procurement. Proof that can be inspected beats claims.

**Sources.**
- Hinge Research Institute, *How Buyers Buy* executive summary (822 buyers, 533 sellers; PDF dated 2013): buyers search first through friends and colleagues (71%); good reputation tips the final selection; sellers "grossly overestimate" the role of expertise in the final selection; buyers value specialized skills and expertise most (42%). https://hingemarketing.com/uploads/HowBuyersBuy_Executive_Summary.pdf **[weak: dated, Hinge sells marketing]**
- Kelly Waffle, "Four Professional Services Findings from our Inside the Buyer's Brain Research", Hinge, 2022-09-14 (4th ed., 1,900+ buyers): buyers rating a firm as highly visible fell from 23.1% (2020) to 14.6% (2022); existing relationship as an evaluation method up 79%; LinkedIn the only platform with rising work use. https://hingemarketing.com/blog/story/four-professional-services-findings-from-our-inside-the-buyers-brain-research
- Kelly Moore, "New Research: How Buyer Expectations Have Changed in the Consulting Industry", Hinge, 2022-11-03 (300+ consulting buyers): subject-matter expertise the leading early-stage criterion; relevance of consulting firms to buyers' top challenges fell from 49.7% to 34.9%; thought leadership and case studies on the site help buyers judge qualifications. https://hingemarketing.com/blog/story/new-research-how-buyer-expectations-have-changed-in-the-consulting-industry
- Barbara Winters, "The State Of Business Buying: Risk-Averse Buyers Demand Proof, Not Promises", Forrester, 2026-01-21 (nearly 18,000 buyers): 94% use AI in buying; 13 internal and 9 external influencers on average; procurement a decision-maker 53% of the time; buyers seek validation from peers and experts. https://www.forrester.com/blogs/state-of-business-buying-2026/ (technology purchases, not consulting specifically)
- Source Global Research, 2025-03-18 (above): clients want to buy from firms that "can show AI use cases in action".

**How we apply it on gabrielbulacio.com.**
- Every claim on Home and the case studies links to something inspectable: repo, live demo, eval results, decision log, data model diagram.
- Add a one-page, printable summary per offer (scope, deliverables, terms) that a head of data can forward to the CFO and procurement.
- Keep the LinkedIn link prominent; referrals arrive there first.

## 11. Position narrowly: name the buyer, the problem and the specialty

**Principle.** Specialists are easier to find, easier to refer and face fewer substitutes. Narrowing can be horizontal (a function or problem across industries) rather than vertical (one industry), as long as the addressable pool is big enough.

**Sources.**
- David C. Baker, *The Business of Expertise* (2017): vertical vs horizontal positioning; narrow and deep expertise means fewer substitutes; warns against niches too small to sustain the practice (via third-party summaries and 2Bobs podcast listings, book not read) **[weak]**. https://www.shortform.com/summary/the-business-of-expertise-summary-david-c-baker
- Elizabeth Harr, "To Specialize or Not to Specialize", Hinge, 2025-01-28: Hinge sees "data correlating specialization with greater growth and profitability" (no figures given); high-growth firms rate themselves most specialized by service (7.46/10) and problem solved (7.40), least by location (6.13). https://hingemarketing.com/blog/story/to-specialize-or-not-to-specialize **[weak: no data shown]**
- Philip Morgan, *The Positioning Manual for Indie Consultants*; argues fear that narrowing shrinks the pipeline is misplaced (podcast listings and reviews only) **[weak]**.
- Michael Zipursky, "Do Consultants Really Need to Specialize?", Consulting Success, updated 2026-11-16 (promotional, no outcome data) **[weak]**. https://www.consultingsuccess.com/do-consultants-really-need-to-specialize
- Site examples (Principle 16 table and below): SQLBI ("specialize in DAX and Data Modeling") and Brian O'Neill ("I help B2B analytics companies translate technical complexity into commercial clarity") state the niche in one line; Brooklyn Data ("Transform your organization through the power of data") does not.

**How we apply it on gabrielbulacio.com.**
- Horizontal niche, not an industry: KPI definitions and semantic models on Microsoft Fabric/Power BI, plus governed generative BI on top.
- Buyers named: CFO, COO/VP Ops, head of data at mid-size companies where numbers disagree across reports.
- Home headline draft shape: "[Buyer] get one set of numbers they trust, and AI that answers from them." Languages (EN/ES/IT) and remote delivery go in the subline, not the headline.

## 12. Bring a point of view, not a capability list

**Principle.** In B2B buying research, the largest gap between winners and runners-up is bringing new ideas and perspectives, and communicating value. Consulting firms' perceived relevance to buyers' top problems fell. A consultant's published opinion is the cheapest way to show both.

**Sources.**
- Mike Schultz, "Sales Research: What Sales Winners Do Differently", RAIN Group (700+ B2B purchases, $3.1B; last updated 2023-07-25, original study older): winners "connect, convince, and collaborate"; widest gaps in collaboration, including bringing new ideas. https://www.rainsalestraining.com/blog/sales-research-what-sales-winners-do-differently **[weak: dated, RAIN sells sales training]**
- Hinge, 2022-11-03 (above): relevance gap; recommends educational content that shows expertise.
- Hamel Husain (hamel.dev) and SQLBI (275.7K newsletter subscribers per its consulting page) both win work mainly through published method, not service pages. https://www.sqlbi.com/consulting/

**How we apply it on gabrielbulacio.com.**
- Add Notes with 2-4 short pieces, each with a claim in the title, for example: why a KPI ends up with three definitions; why a generative BI answer should refuse when the semantic model lacks the metric; what a golden set for finance questions contains.
- Link one Note from each Services card.

## 13. Write-ups follow one template: SCR, decision, measured outcome with method, limits, ownership

**Principle.** A buyer-facing case study leads with the business situation and the decision it enabled, then the result with how it was measured, the limits, and what the client runs without the consultant.

**Sources.**
- the private case kit consulting.md §A1-§A2 (answer first; Situation, Complication, Question, Resolution, from Minto).
- Umbrex, "Demonstrate Experience Without Compromising Confidentiality", in *The Generative Engine Optimization Playbook* (undated): each account states context, the firm's role and scope, methods, outputs and results "and how any outcome was measured", and limitations. https://umbrex.com/resources/the-generative-engine-optimization-playbook-a-guide-for-professional-services/demonstrate-experience-without-compromising-confidentiality/ **[weak: practitioner guide]**
- UK Consultancy Playbook v2.0 (above): post-engagement evaluation against baseline.
- Husain and Shankar FAQ (above): report findings as a narrative of failures found and fixed.

**How we apply it on gabrielbulacio.com.**
Template for every Engagement and Project case study:

| Block | Content | Length |
|---|---|---|
| Headline | The decision or change, in one sentence | 1 line |
| Situation | Who (descriptor), what they had | 2-3 lines |
| Complication | Why it hurt, in business terms | 2-3 lines |
| My role | Scope, what I did, who else was involved | 2 lines |
| What we built | Artifacts, with links where public | bullets |
| Decision it enabled | Who decided what, differently | 2 lines |
| Outcome and method | Result vs baseline, how measured, status word | 2-4 lines |
| Limits | What this does not prove | 1-2 lines |
| What the client owns | Handover artifacts | bullets |

## 14. Anonymize by descriptor; keep specifics; use precise status words

**Principle.** Anonymous work is credible when it stays specific about the problem, role and method, uses a consistent descriptor for the client, publishes figures only when approved, and labels illustrations and demos as such. Removing the name does not make an account anonymous if other details identify the client.

**Sources.**
- Umbrex, "Demonstrate Experience Without Compromising Confidentiality" (above): use "client identity withheld"; describe the client only by characteristics needed to judge relevance; use status words "planned, completed, estimated, observed, or realized"; label composites and illustrations at the point of use; do not present one favourable case as typical; check combinations of details and file metadata **[weak]**.
- Pravin Kumar, "Write a customer story when the customer cannot be named" (2026) and similar agency blogs: publish only client-confirmed figures, use a consistent generic label (snippets) **[weak]**. https://www.pravinkumar.co/blog/write-a-customer-story-when-the-customer-cannot-be-named-2026
- SQLBI consulting page: says many companies trust them but withholds names for privacy, and relies on books and courses as proof. https://www.sqlbi.com/consulting/
- Velocity Partners' anonymous case study post redirected to pretzl.com and was not fetched.

**How we apply it on gabrielbulacio.com.**
- Engagements page uses descriptors like "global marketing services group, finance and operations reporting" with "client identity withheld", role and period ("2023-2025, owner of the data platform").
- No real figures from WPP, VML or PwC work. Use direction and mechanism ("month-end reporting moved from spreadsheets to a governed model") and status words ("completed", "observed").
- The two project case studies say plainly that they run on synthetic or public data, and that their numbers are measured on that data (for example eval pass rates), not client results.
- Before publishing, check combinations (role + date + industry + unusual problem) and image/file metadata.

## 15. Say how AI is used in delivery

**Principle.** Clients expect consultants to use AI and expect it to change price. Clients exposed to AI-produced consulting output are also more sceptical, and many say they would not trust a report produced with AI. Disclosure is now part of the offer.

**Sources.**
- Source Global Research survey of 3,887 companies, reported by The Telegraph 2026-08-03 and summarised by Resultsense 2026-08-04: 70% would not trust a report produced with AI; 77% of clients who had seen consultants' AI tools in use called AI a bubble vs 55% who had not (original survey not read) **[weak]**. https://www.resultsense.com/news/2026-08-04-consultancy-clients-distrust-ai-reports/
- IBM IBV via Consultancy.uk, 2024-10-28 (above): 89% expect consulting to use AI for productivity and quality **[weak]**.
- Data Goblins homepage states "All writing is 100% human". https://data-goblins.com/

**How we apply it on gabrielbulacio.com.**
- How I work gets a short "How I use AI" section: AI-assisted coding and drafting; every deliverable reviewed by me; AI features shipped only with evals; client data not sent to external models without written approval; client-facing findings written by me.
- This matches the site's existing seniority-pass and AI-use note rules.

## 16. State fit, misfit and risk reversal on the page

**Principle.** Strong independent sites say who they are not for and reduce the buyer's first-step risk: a free fit call with no advice given, a fixed-fee first step, fee credited forward, stop after any phase and keep the work. Unpaid discovery is for fit; advice is paid.

**Sources.**
- Valiotti Data: not a fit for buyers who only need a dashboard, want the lowest hourly rate, lack an executive sponsor, or need a permanent hire **[weak]**.
- Thomas Nys: not for anyone "who wants a name on the org chart more than the work done"; discovery call "No pitch" **[weak]**.
- Hikmah: "if day one shows no credible opportunity, you don't pay"; audit fee credited; stop after any step **[weak]**.
- P3 Adaptive: no invoice for the accelerator if the client is not satisfied **[weak]**.
- Jonathan Stark, "How is a roadmap different from a Why Conversation?", 2017-05-03: the unpaid Why Conversation is research, "I offered no advice"; the paid roadmap's value is a "dramatic decrease of uncertainty". https://jonathanstark.com/daily/20170503-how-is-a-roadmap-different-from-a-why-conversation (snippet) **[weak]**
- UK Consultancy Playbook v2.0: warns buyers against "landing and expanding" from small or free initial work. Buyers in procurement-led processes may see free work as a lever, not a gift.

**How we apply it on gabrielbulacio.com.**
- Services adds a two-column "Good fit / Not a fit" list. Good fit: numbers disagree between Finance and Ops; a Power BI/Fabric estate without agreed definitions; an AI-on-data idea that needs to be safe for executives. Not a fit: one-off dashboard requests; staff augmentation by the hour; no named business owner.
- Risk reversal stated plainly: fixed fee per phase, stop after any phase, keep everything delivered, diagnostic fee credited. No money-back guarantee (see Conflicts).

---

## Site examples reviewed (independent and boutique)

All fetched 2026-11-20 from each firm's own site; their client figures are self-reported and unverified.

| Site | What it does well | What it does badly or lacks |
|---|---|---|
| Valiotti Data (valiotti.com), fractional CDO | Published price ladder (advisory, $12k diagnostic, fractional CDO); explicit not-a-fit list; comparison with a full-time hire; "build the system, then leave" | Heavy claims stack ($2B+ client revenue managed, 100% handoff) reads as marketing; case figures (CAC -35%) have no method shown |
| Hikmah Technologies (hikmahtechnologies.com), solo data engineer | Most transparent pricing found; capacity limits stated; audit credited; stop-anytime; pricing explained in a post | Proof is two hero stats ("4,912 pipeline partitions at 99.9%") without context; no case studies on the page |
| Thomas Nys (thomasnys.com), fractional data architect | Clear audience; first-weeks process; decisions documented to outlast the engagement; "not for" list; "working platforms not powerpoints" | No proof at all beyond a LinkedIn link; no prices |
| P3 Adaptive (p3adaptive.com), Power BI/Fabric boutique | Three engagement shapes (2-week accelerator, focused project, embedded); named client outcomes; CFO testimonial about ownership; "faucets first" point of view | Outcome figures lack baselines and method; product (Faucet) and services mixed on one page |
| SQLBI (sqlbi.com/consulting), DAX/modeling specialists | Narrowest positioning in the set; productized services (remote fix, optimization, architectural review); proof through books, courses, newsletter; names withheld for privacy and still credible | Rates behind a link; depends on a reputation an independent starting out lacks |
| Brian T. O'Neill, Designing for Analytics | One-line positioning naming buyer and outcome; podcast as point of view; named clients and case study | Services, scope and price not on the home page |
| Brooklyn Data Co. (brooklyndata.co), data boutique | Recognisable client logos; partner credentials (dbt Platinum) | Generic headline ("Transform your organization through the power of data"); seven services with no engagement model; no outcomes on the page |
| Data Mozart (data-mozart.com/consulting), Fabric/Power BI independent | Strong content archive and MVP status as proof | Consulting page has no offers, scope, prices, cases or fit criteria; just a contact form |
| Hamel Husain (hamel.dev) and Parlance Labs | Writing and teaching as proof (course with thousands of students); clear point of view on evals | No consulting offer visible in 2026; logos are students' employers, not clients |
| Jason Liu (jxnl.co/services) | Wind-down notice is honest and still lists named past clients | No longer selling; no outcomes or testimonials |

Not usable: seattledataguy.com (empty fetch), ternarydata.com (placeholder "Coming Soon"), data-goblins.com (no services; portfolio empty in fetch, though it states most work is withheld for confidentiality).

Pattern for gabrielbulacio.com: take Hikmah/Valiotti's transparency on offers, Thomas Nys's fit list and process, SQLBI's narrowness, and add what none of them do well: case studies with baseline, method and limits, backed by public code and evals.

---

## Source quality flags

| Source | Issue |
|---|---|
| Gartner (2025-02-26 AI-ready data; 2025-06-25 agentic AI) | Pages returned 403 or were read via search snippets and secondary coverage only. Do not quote figures on the site. |
| McKinsey state of AI 2025 and 2026 | Page timed out; figures (6% high performers, workflow redesign, human validation) from search snippets. |
| McKinsey "25% of fees outcome-based" | Only via snippets of trade coverage; Hunt Scanlon returned 403; no primary McKinsey disclosure found. |
| BCG Widening AI Value Gap; BCG 10-20-70 | Press release and secondary coverage; PDF not read. 10-20-70 is BCG's marketing rule of thumb, not a measured finding. |
| MIT NANDA GenAI Divide | Secondary coverage only (Fortune, VentureBeat); methodology criticised; "95%" wording varies by outlet. |
| Hinge How Buyers Buy | PDF metadata dated 2013; old. Hinge sells marketing to professional services firms. |
| Hinge Inside the Buyer's Brain 4th ed. | Data 2020-2022; seller count reported as 3,160 and 3,610 in different Hinge pages. Full report gated. |
| Hinge "To specialize or not" (2025) | Claims a growth/profit correlation but shows no figures. |
| RAIN Group What Sales Winners Do Differently | Study is years old (page last updated 2023); top-10 chart is an image not read; RAIN sells sales training. |
| Forrester State of Business Buying 2026 | Blog read in full; full report client-only; about technology purchases, not consulting. |
| Source Global Research | Two blog posts (2025) and one (2026) read in full. The 70% "won't trust AI report" figure is via Telegraph/Resultsense only; original not read. |
| IBM IBV | Via Consultancy.uk; IBM sells consulting. |
| Weiss, Enns, Baker, Morgan, Stark | Books not read. Weiss via O'Reilly TOC and his tips page; Enns via site snippet (site fetch returned empty) and podcast listings; Baker via Shortform summary and podcast listings; Morgan via podcast listings and reviews; Stark via his blog snippets. |
| Husain/Shankar evals FAQ | Read in full; date conflict: page says 2026-09-18, search shows PDF dated 2025-07-31 (likely revised). Authors sell an evals course. |
| Thoughtworks AI readiness; Radar LLM-as-judge | Read via snippets; firm marketing. |
| Stanford Brynjolfsson and Petropoulos | Summary page only; decision rules are in the PDF, not read. |
| CMR Berkeley, Raja Pabba (2026-04-14) | Read but not cited as evidence: author is a vendor CEO, figures mostly anecdotal. |
| Futurice, Vedi (Consultancy.uk), Zipursky | Practitioner opinion, no data. Zipursky is promotional. |
| Umbrex confidentiality chapter | Practitioner guide, undated, no author shown. Useful as method, not evidence. |
| Consultant sites (Valiotti, Hikmah, Thomas Nys, P3, SQLBI, Brooklyn, O'Neill, Data Mozart) | Self-reported claims, prices and client results; unverified. Used only as examples of presentation. |
| Velocity Partners anonymous case study post | Redirected to pretzl.com; not fetched. |
| UK Consultancy Playbook v2.0 | Primary, read almost in full (last ~1,800 characters not read). Written for public-sector buyers, so it reflects a buyer's view of good practice. |

## Conflicts between sources

| Topic | Side A | Side B | How we resolve it on the site |
|---|---|---|---|
| Does expertise win the work? | Hinge 2013: sellers "grossly overestimate" expertise in the final choice; reputation decides | Hinge 2022 consulting: subject-matter expertise is the leading early-stage criterion | Expertise gets shortlisted, reputation and relationship close. Site shows specific expertise (Principle 11) and checkable proof that stands in for reputation (Principle 10). |
| Small or large AI projects? | Source 2025-07-08: mostly small, limited-scope projects | Source 2026-03-20: large, complex projects tripled as a share of clients | A trend, not a contradiction. Entry offer stays small (Principle 1); the ladder shows the path to larger phases (Principle 2). |
| Outcome-based pricing | IBM 2024: 73% of buyers want new pricing; McKinsey reportedly ~25% outcome-linked fees | UK Playbook, Futurice, Vedi: only with measurable outcome, baseline, control of levers and maturity | Fixed fee per phase by default; outcome element only after a baseline and only on levers I control (Principles 3-4). |
| Publish prices? | Hikmah and Valiotti publish prices; Enns/Weiss price on value after diagnosis | P3, Brooklyn, Data Mozart publish none; SQLBI rates on request | Publish the diagnostic's fixed price (a known, bounded scope). Quote builds after the diagnostic. Open decision for Gabriel. |
| Free or paid first step | Most sites offer a free 30-60 minute discovery call | Enns: get paid for scoping work; Stark: the free call gives no advice; UK Playbook warns buyers about "land and expand" from free work | Free call for fit only, no advice; scoping and recommendations are the paid diagnostic (Principle 16). |
| Guarantees | P3: no invoice if not satisfied; Hikmah: no charge if day one shows no opportunity | UK Playbook: put risk where it can be managed; outcome fees only on controlled levers | Offer stop-after-any-phase and fee credit, not a satisfaction guarantee. Revisit once there are several engagements. |
| AI in delivery | IBM 2024: 89% of buyers expect consultants to use AI | Source survey (via Resultsense 2026): 70% would not trust an AI-produced report | Disclose AI use as assisted and reviewed, with evals; never present AI-written findings (Principle 15). |
| How narrow to go | Hinge, Morgan, Zipursky: specialize | Baker: a niche can be too small to sustain the practice | Horizontal niche (KPI definitions, semantic models, governed AI) across industries rather than one vertical (Principle 11). |
| LLM-as-judge | Husain/Shankar: usable with 100-200 labelled examples per failure mode | Thoughtworks Radar: moved to Assess, unreliable proxy for human judgment | Use deterministic checks first; LLM judges only where labelled and validated; say so in the eval deliverable (Principle 6). |
| Do external partners help AI pilots? | MIT NANDA (secondary): external partnerships reach deployment about twice as often | Critics say the report oversimplifies | Do not cite on the site. At most, a speaker-note level argument. |
