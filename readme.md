# SkyCast – Live Weather & Forecast Dashboard

A responsive weather dashboard built with plain HTML, CSS and JavaScript. It shows live conditions, a 24-hour chart and a 7-day forecast for any city, using the free [Open-Meteo](https://open-meteo.com/) API (no API key needed).

**Live demo:** _add your Vercel link here_

## Features (v1)

- City search with autocomplete, plus "Use my location" (asks permission)
- Current temperature, feels-like, condition and local time for the selected city
- Humidity, wind speed and direction, pressure, visibility, UV index, chance of rain, sunrise and sunset
- Next-24-hours strip and temperature chart (Chart.js)
- 7-day forecast with min/max range bars and rain chance
- °C/°F and km/mi toggles
- Background changes with the weather, and darkens at night
- Saved cities and recent searches (localStorage)
- Cached results (10 minutes), offline fallback, error messages, refresh button, last-updated time

- Air quality: US AQI with PM2.5, PM10, NO₂ and ozone
- Chart tabs for temperature, wind and rain, plus moon phase
- Interactive Leaflet map: click anywhere to get the weather there
- Compare two cities side by side
- Animated rain and snow, and an Auto/Light/Dark theme toggle

## Tech stack

HTML5, CSS3, JavaScript (async/await), Open-Meteo Forecast and Geocoding APIs, Chart.js, localStorage, Git, Vercel.

## Run locally

```bash
git clone https://github.com/heyravinder/skycast.git
cd skycast
npx serve .      # or use the VS Code "Live Server" extension
```

Open the printed address in your browser.

## Deploy

Push to GitHub, import the repo in Vercel, and deploy. No build settings are needed for a static site.

## Project structure

```
skycast/
├── index.html
├── css/style.css
├── js/app.js
└── README.md
```

## Roadmap

- [x] Air quality, extra charts, map, city comparison, moon phase, theme toggle
- [ ] Weather alerts where data is available
- [ ] Settings page and installable PWA

## Credits

Weather data by [Open-Meteo.com](https://open-meteo.com/). Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
