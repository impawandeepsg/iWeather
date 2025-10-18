import React, { createContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CityContext = createContext();
const STORAGE_KEY = "WEATHER_APP_CITIES_v2";

export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const flatListRef = useRef(null); // reference to HomeScreen FlatList

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setCities(JSON.parse(saved));
    })();
  }, []);

  const addCity = async (city) => {
    const exists = cities.find(
      (c) => c.name === city.name && String(c.lat) === String(city.lat)
    );
    if (!exists) {
      const updated = [...cities, city];
      setCities(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const removeCity = async (city) => {
    const updated = cities.filter(
      (c) => !(c.name === city.name && String(c.lat) === String(city.lat))
    );
    setCities(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const setAllCities = async (list) => {
    setCities(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  // Scroll to a specific city index in HomeScreen FlatList
  const scrollToCity = (index) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  return (
    <CityContext.Provider
      value={{
        cities,
        addCity,
        removeCity,
        setAllCities,
        flatListRef,
        scrollToCity,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};
