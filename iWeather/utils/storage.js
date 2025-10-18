// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "WEATHER_APP_CITIES_v1";

export const getCities = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("getCities error:", e);
    return [];
  }
};

export const saveCities = async (cities) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cities));
  } catch (e) {
    console.warn("saveCities error:", e);
  }
};

export const clearCities = async () => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearCities error:", e);
  }
};
