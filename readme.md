
# 🌤️ SkyCast — Live Weather Forecast App

A modern, responsive weather dashboard built using HTML, CSS, and JavaScript, powered by the Open-Meteo API.

SkyCast allows users to search cities, check current weather conditions, explore hourly and 7-day forecasts, and view detailed weather information through an interactive interface.

### 🚀 Live Demo

Coming soon — deployment in progress.

### 🔗 Project Links

- **GitHub:** https://github.com/heyravinder/skycast-live-weather-app
- **Live Website:** Coming soon

---
  

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

1. Clone the repository:

```bash
git clone https://github.com/heyravinder/skycast-live-weather-app.git
```

2. Open the project folder:

```bash
cd skycast-live-weather-app
```

3. Start a local server:

```bash
npx serve .
```

4. Open the local URL displayed in your terminal.

Alternatively, use the Live Server extension in VS Code.

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
