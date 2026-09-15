# Farm Intel

Yes da 🔥 indha prompt-a direct-ah Claude-la paste pannu. Idhu mockup illa, fully working website build panna specifically written.

Build a FULLY FUNCTIONAL working web application called:

SMART DAIRY MONITOR

AI-Based Cow Health & Milk Production Monitoring System

This is a student project for the C29 AI Immersion Programme. I need an actual working website, NOT just a UI mockup, landing page, or static design.

1. MAIN GOAL

The website must allow a dairy farmer to store individual cow information and daily records, then automatically analyze the entered data.

The system must:

Store cows

Store daily milk records

Compare current milk production with previous records

Automatically calculate increase/decrease

Calculate percentage change

Store health observations

Store injection/treatment records

Calculate days since an injection was given

Calculate the next due date based on a user-entered interval OR a user-entered next due date

Show upcoming and overdue schedules

Display cow-wise history

Display charts

Generate alerts

Provide AI/data-based insights from the stored records

This must be a FUNCTIONAL application where buttons, forms, calculations, storage, charts, filtering and navigation actually work.

2. REAL FARM INFORMATION

Use these as the initial farm information:

Number of cows: 12

Approximate total milk production: 40 litres/day

Milk records are currently maintained in a notebook

Cow health is currently monitored visually

Milk production occasionally decreases by approximately 30%

Current farmer response is increasing feed

Manual record maintenance takes approximately 20 minutes/day

IMPORTANT:
These are actual field observations.

Do NOT invent additional real-world observations, farmer quotes, measurements, or results.

If you need additional data for demonstrating the application, create clearly labelled DEMO DATA.

Never present demo data as actual farm data.

3. TECHNOLOGY

Choose a suitable modern technology stack that can create a genuinely working application.

Prefer:

React

TypeScript

Tailwind CSS

Recharts or another reliable chart library

Local persistent storage such as IndexedDB/localStorage for the first working version

If you believe another stack is substantially better, explain why before changing it.

The application should run locally with simple commands.

Provide complete setup and run instructions.

4. DASHBOARD

Create a professional dashboard.

Show:

Farm Overview

Total cows

Today's total milk

Average milk per cow

Number of milk alerts

Upcoming injection schedules

Overdue schedules

Example:

TOTAL COWS
12

TODAY'S MILK
40 L

MILK ALERTS
2

UPCOMING SCHEDULES
3

Use real stored data for these values after the user starts entering records.

Do NOT permanently hard-code dashboard values.

5. COW MANAGEMENT

Create a “Cows” page.

Allow the user to:

Add cow

Edit cow

Delete cow

Search cow

View cow profile

Cow fields:

Cow ID

Cow name

Age

Breed

Date added

Notes

Cow ID must be unique.

Example:

C001
C002
C003

etc.

Create a detailed cow profile page.

The profile should show:

Basic information

Milk history

Milk trend

Health observations

Injection/treatment history

Upcoming schedules

Alerts

AI/data insights

6. MILK RECORD SYSTEM

Create an “Add Milk Record” page.

Fields:

Date

Cow ID

Morning milk (litres)

Evening milk (litres)

Feed quantity

Health observation

Notes

Automatically calculate:

TOTAL MILK = MORNING MILK + EVENING MILK

The user should NOT need to manually enter total milk.

After saving:

Store the record persistently

Update dashboard

Update cow history

Update charts

Update analysis

7. MILK COMPARISON

This is one of the MOST IMPORTANT features.

For every cow, compare the latest milk production with its previous production/history.

Calculate:

Absolute change

Current milk - previous/reference milk

Percentage change

((Current - Reference) / Reference) × 100

Example:

Previous:
5.0 L

Current:
4.0 L

Result:

Decrease = 1.0 L
Percentage = 20%

Display:

🔴 Milk production decreased by 20%

If production increases:

🟢 Milk production increased by 10%

If there is no meaningful change:

🟡 Milk production is stable

Do not compare a cow against another cow unless explicitly requested.

Prefer comparing each cow against its OWN historical baseline.

8. SMART BASELINE

Do not rely only on yesterday's milk.

If enough historical records exist, calculate a recent baseline such as the average of the previous 3–7 valid records.

Example:

Previous records:
4.8
5.0
4.9
5.1
4.9

Baseline:
4.94 L

Current:
3.6 L

Then calculate the percentage difference from the baseline.

If insufficient historical data exists, clearly display:

“Not enough historical data for reliable comparison.”

Do not pretend that a prediction is accurate when there is insufficient data.

9. MILK ALERTS

Create an alert when the decrease crosses a configurable threshold.

Default threshold:

20%

Allow the user to change this threshold in Settings.

Example:

⚠️ SIGNIFICANT MILK DECREASE

Cow: C005

Baseline: 5.0 L
Current: 3.8 L
Change: -24%

Show:

“Unusual production decrease detected.”

Do NOT say:

“Cow has disease.”

Instead show:

“Review recent recorded health, feed and management information.”

10. MILK HISTORY & CHARTS

Create charts using stored data.

Required charts:

Chart 1

Daily total milk production

Chart 2

Selected cow's milk trend

Chart 3

Milk production change percentage

Chart 4

Feed quantity vs milk production, only when sufficient data exists

Allow date filtering.

Use clear labels and tooltips.

11. HEALTH RECORDS

Create a health observation system.

For each cow allow:

Date

Appetite

Activity

General observation

Notes

Example options:

Appetite:

Normal

Reduced

Increased

Not recorded

Activity:

Normal

Reduced

Increased

Not recorded

General observation:

Normal

Needs attention

Other

IMPORTANT:

These are observations only.

The application must NOT diagnose diseases.

It should display:

“Recorded observation”

or

“Possible factor requiring further checking.”

12. INJECTION / TREATMENT SCHEDULER

Create a separate “Health & Schedule” page.

Allow the farmer to enter:

Cow ID

Injection/treatment name

Given date

Next due date OR interval in days

Notes

If the user enters:

Given date = 28/08/2026
Interval = 30 days

Automatically calculate:

Next due date = 27/09/2026

Also calculate:

Days since last injection

and

Days remaining until next due date.

Example:

Injection:
[Name]

Given:
28 Aug 2026

Next due:
27 Sep 2026

Days since:
5 days

Days remaining:
25 days

Use the user's entered date and interval.

IMPORTANT SAFETY REQUIREMENT:

Do NOT decide medical/veterinary injection schedules automatically.

The farmer/veterinary professional must provide the actual interval or next due date.

The application only performs date calculations and reminders based on user-provided scheduling information.

13. SCHEDULE ALERTS

Show:

🟢 Scheduled

🟡 Due soon

🔴 Due today

🔴 Overdue

Allow the user to configure how many days before due date an alert should appear.

Example:

“Injection for C003 is due in 3 days.”

If overdue:

“Schedule overdue by 2 days.”

Do not provide medical advice about whether the injection itself should be given.

14. AI ANALYSIS

Create an “AI Insights” page.

The AI/data analysis should use the stored records.

Analyze:

Milk production trend

Percentage change

Feed changes

Health observations

Historical patterns

Injection/treatment timing where relevant

The system should identify:

Possible contributing factors

Example:

Cow C005:

Milk baseline: 5.0 L
Current: 3.7 L
Change: -26%

Recent recorded changes:

Feed quantity changed

Activity observation changed

Display:

“Milk production has decreased significantly compared with the recent baseline. The recorded feed and health observations have also changed. These are possible contributing factors that should be checked by the farmer.”

DO NOT diagnose disease.

DO NOT claim medical certainty.

If there is insufficient data:

“Insufficient recorded data to identify meaningful contributing factors.”

15. AI TECHNIQUE

For the C29 technical explanation, use:

Isolation Forest / anomaly detection

Use it where appropriate to identify unusual milk-production patterns.

If a real ML model cannot reasonably run entirely in the browser, implement a transparent anomaly-detection prototype using the available stored data and clearly explain the limitation.

Do NOT fabricate model accuracy.

Do NOT display fake accuracy such as “98% accurate.”

Clearly distinguish:

Actual calculations

Demo data

AI/anomaly analysis

Expected outcomes

16. SEARCH & FILTER

Add search/filter functionality.

Allow filtering by:

Cow ID

Date

Alert status

Health status

Injection schedule

Make the UI fast and simple.

17. DATA STORAGE

Data must persist after page refresh.

Store:

Cows

cow information

Milk Records

daily milk/feed/health information

Health Records

health observations

Injection Records

treatment/injection schedule information

Settings

alert thresholds and preferences

Provide:

Export data

Import data

Clear demo data

Use JSON/CSV export where practical.

18. SAMPLE DATA

Create a clearly labelled DEMO DATA option so I can demonstrate the application.

Create realistic sample records for the 12 cows.

IMPORTANT:

Display a clear label:

“DEMO DATA — Replace with actual farm records.”

Do not mix demo data with the actual observations unless clearly identified.

Include at least one demo cow showing a significant milk decrease so the alert system can be demonstrated.

19. UI DESIGN

Design should look like a professional but simple agricultural dashboard.

Use:

Sidebar navigation

Dashboard cards

Tables

Charts

Alert cards

Forms

Cow profile pages

Responsive layout

Clean typography

Clear icons

Pages:

Dashboard

Cows

Add Milk Record

Milk History

Health Records

Injection Schedule

AI Insights

Alerts

Settings

Make navigation functional.

20. VALIDATION

Add form validation.

Examples:

Milk cannot be negative

Feed cannot be negative

Cow ID must exist before adding a milk record

Cow ID must be unique

Required fields cannot be empty

Dates must be valid

Injection due date must not be earlier than given date when using a manually entered due date

Show friendly error messages.

21. C29 TECHNICAL BLOCK DIAGRAM

The application architecture should correspond to:

Real-world source
↓
Data acquisition
↓
Pre-processing
↓
AI/ML engine
↓
Decision logic
↓
Farmer dashboard
↓
Feedback
↺

Use the actual technique name:

“Isolation Forest / Anomaly Detection”

instead of simply writing “AI Model”.

22. IMPORTANT: BUILD, DON'T JUST EXPLAIN

Do NOT stop at:

UI design

Wireframe

Pseudocode

Feature list

Explanation

I need actual working code.

Generate the complete project.

Every important button must work.

Forms must save data.

Charts must use stored data.

Calculations must be functional.

Navigation must work.

The application must run locally.

23. DEVELOPMENT PROCESS

Before generating the code:

Give me the final technology stack.

Give me the folder structure.

Give me a short implementation plan.

Then immediately build the application.

Generate all required files.

If the response becomes too long, continue generating the remaining files in the next response without asking me to repeat the requirements.

At the end provide:

Installation commands

Run command

Build command

How data storage works

How milk comparison works

How injection date calculation works

How anomaly detection works

How to add real farm data

How to demonstrate the website for my C29 viva

FINAL REQUIREMENT:

This must be a FUNCTIONAL WORKING WEB APPLICATION, not merely a visual prototype.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://udder-wise-monitor.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b8e3561-9402-4d7d-9d48-a6c4cd47b473).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
