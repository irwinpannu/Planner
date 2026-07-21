# Assignment Planner

A single-folder Node.js application that automatically turns assignments and availability into a study plan. Data lives in your browser's local storage, so no account or database is required.

## Run it

1. Install [Node.js](https://nodejs.org/) 18 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

The server only delivers the application and exposes a health endpoint; the planner data stays private in the browser.

## What it does

- Schedules assignments automatically within your weekly availability.
- Uses urgency, priority, and duration to decide what to work on first.
- Splits work over multiple sessions, including useful 30-minute gaps.
- Rebuilds the schedule after every assignment or availability change.
- Saves assignments, settings, theme, and schedule automatically.
