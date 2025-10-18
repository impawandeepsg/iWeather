import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Dimensions
} from "react-native";
import WeatherFullScreen from "../components/WeatherFullScreen";
import { CityContext } from "../contexts/CityContext";
import * as Location from "expo-location";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_KEY = "b708f52f62fd4cc6acd93153231711";

export default function HomeScreen({ setCurrentCity }) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { cities, setAllCities, removeCity, flatListRef } = useContext(CityContext);
  const [weatherList, setWeatherList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    initCities();
    return () => (mountedRef.current = false);
  }, []);

  useEffect(() => {
    if (cities.length > 0) fetchAllWeather();
  }, [cities]);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.newCity) {
        const index = cities.findIndex(c => c.name === route.params.newCity);
        if (index >= 0 && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index, animated: true });
        }
      }
    }, [route.params, cities])
  );

  const initCities = async () => {
    if (!cities || cities.length === 0) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let list = [];
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          const q = `${loc.coords.latitude},${loc.coords.longitude}`;
          const res = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}&aqi=yes`
          );
          list = [{ name: res.data.location.name, lat: res.data.location.lat, lon: res.data.location.lon, country: res.data.location.country }];
        } else {
          list = [{ name: "Ludhiana", lat: 30.901, lon: 75.8573, country: "India" }];
        }
        setAllCities(list);
      } catch (e) {
        Alert.alert("Error", "Failed to get location, default city added");
        setAllCities([{ name: "Ludhiana", lat: 30.901, lon: 75.8573, country: "India" }]);
      } finally {
        setLoading(false);
      }
    } else setLoading(false);
  };

  const fetchWeatherFor = async (city) => {
    try {
      const q = city.lat && city.lon ? `${city.lat},${city.lon}` : city.name;
      const res = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}&aqi=yes`);
      return res.data;
    } catch (e) {
      console.warn("fetchWeatherFor error", e?.message || e);
      return null;
    }
  };

  const fetchAllWeather = async () => {
    const results = [];
    for (const c of cities) {
      const w = await fetchWeatherFor(c);
      if (w) results.push(w);
    }
    if (mountedRef.current) setWeatherList(results);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllWeather();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { flex: 1, backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ManageLocations")}
          style={styles.manageButton}
        >
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={weatherList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, idx) => item?.location?.name + idx}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get("window").width);
          setCurrentIndex(index);
          if (setCurrentCity) setCurrentCity(weatherList[index]?.location);
        }}
        renderItem={({ item }) => <WeatherFullScreen data={item} onRemove={removeCity} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center" },
  topBar: { position: "absolute", right: 15, zIndex: 2 },
  manageButton: { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20 },
});
