# 🌦️ iWeather

![Expo](https://img.shields.io/badge/Expo-51.0.0-blue.svg?style=for-the-badge&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76.0-61DAFB.svg?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Android%20|%20iOS-lightgrey.svg?style=for-the-badge)

> **iWeather** — A modern, elegant weather app built using **React Native (Expo)**.  
> Experience live weather updates, AQI (Air Quality Index) details, and beautiful animations that bring weather to life.

---

## 🌍 Overview

iWeather lets you explore real-time weather conditions and air quality data for cities around the world.  
It’s crafted with smooth Lottie animations, an intuitive UI, and persistent city management using AsyncStorage — making it both visually stunning and highly functional.

---

## ✨ Features

✅ **Live Weather Data** — Real-time updates for temperature, humidity, and conditions.  
💨 **Air Quality Index (AQI)** — Understand how clean or polluted your air is.  
📍 **City Management** — Add, delete, and view multiple saved locations easily.  
🎨 **Lottie Animations** — Dynamic weather effects (rain, snow, thunder, wind, and more).  
🧠 **Context API** — Centralized state management for seamless user experience.  
💾 **Offline Storage** — Keeps last searched cities even after restarting the app.  
📱 **Responsive Design** — Works beautifully on both Android and iOS.  

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| Framework | React Native (Expo) |
| UI | Animated Components, Lottie |
| State Management | React Context API |
| Networking | Axios |
| Local Storage | AsyncStorage |
| API | Weather & AQI data provider (OpenWeatherMap or WeatherAPI) |

---

## 🗂️ Folder Structure

```
iWeather/
├── App.js
├── app.json
├── index.js
├── package.json
│
├── contexts/
│   └── CityContext.js           # Handles global city/weather data
│
├── screens/
│   ├── HomeScreen.js            # Displays current weather
│   ├── CityDetailsScreen.js     # Shows detailed weather + AQI
│   ├── SearchScreen.js          # Search for cities and add to list
│   └── ManageLocationsScreen.js # Manage saved cities
│
├── components/
│   ├── WeatherCard.js           # Compact weather summary card
│   ├── WeatherFullScreen.js     # Full-screen weather animation
│   └── AQIModal.js              # Air quality index popup/modal
│
├── utils/
│   └── storage.js               # AsyncStorage helpers
│
└── assets/
    ├── animations/              # Lottie weather animations
    ├── icon.png
    ├── splash-icon.png
    ├── adaptive-icon.png
    └── favicon.png
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/iWeather.git
cd iWeather/iWeather
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the Expo server
```bash
npx expo start
```

### 4. Run on your device
- 📱 Scan the QR code using **Expo Go** on your phone  
- 💻 Or press `i` (iOS Simulator) / `a` (Android Emulator)  

---

## 🔑 API Configuration

You can use **OpenWeatherMap** or any other weather API.

1. Get your API key from [OpenWeatherMap.org](https://openweathermap.org/api).  
2. Add it inside your fetch/axios call in:
   ```
   /screens/HomeScreen.js
   /screens/CityDetailsScreen.js
   ```
   Example:
   ```js
   const API_KEY = "YOUR_API_KEY_HERE";
   const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
   ```

---

## 🧩 Available Components

| Component | Description |
|------------|-------------|
| **WeatherCard** | Displays small weather overview with icons |
| **WeatherFullScreen** | Full-screen Lottie animation for current condition |
| **AQIModal** | Modal showing air quality data |
| **CityContext** | Centralized global state for cities |

---

## 📸 Screenshots

| Home Screen | City Details | Search |
|--------------|---------------|--------|
| ![Home](https://via.placeholder.com/250x500?text=Home+Screen) | ![City](https://via.placeholder.com/250x500?text=City+Details) | ![Search](https://via.placeholder.com/250x500?text=Search+Screen) |

_Add your real screenshots here from the Expo app._

---

## 🧠 Architecture Overview

The app follows a **modular and scalable structure**:
- **Presentation Layer** — Screens and Components  
- **Logic Layer** — Context API for global state  
- **Data Layer** — Axios + API service with AsyncStorage caching  

This separation keeps the app maintainable and ready for future scaling (like adding forecasts or notifications).

---

## 🧰 Useful Scripts

| Command | Description |
|----------|-------------|
| `npm start` | Start the Expo app |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in a browser (Expo web mode) |

---

## 🤝 Contributing

Contributions, feature requests, and suggestions are always welcome 💬  
1. Fork this repository  
2. Create a new branch (`feature/new-feature`)  
3. Commit changes  
4. Open a Pull Request  

---

## 🪪 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Pawandeep Singh**  
🎵 Loves singing and building creative apps with passion.  
🌐 [GitHub](https://github.com/yourusername) • [LinkedIn](https://linkedin.com/in/yourusername)

---

## 🌟 Support

If you like this project, give it a ⭐ on GitHub — it really helps!

---

> _"Bringing the weather to life with code, design, and animation."_  
> — *Pawandeep Singh*
