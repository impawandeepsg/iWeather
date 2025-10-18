import React, { useState, useEffect, useContext, useRef } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import axios from "axios";
import { CityContext } from "../contexts/CityContext";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const API_KEY = "b708f52f62fd4cc6acd93153231711";
const AQI_TOKEN = "014026cb2f3c51e46c4aff0167033ad7a15274dd";

const aqiCategories = [
  { label: "Good", min: 0, max: 50, color: "#00E400" },
  { label: "Moderate", min: 51, max: 100, color: "#FFFF00" },
  { label: "Unhealthy for Sensitive Groups", min: 101, max: 150, color: "#FF7E00" },
  { label: "Unhealthy", min: 151, max: 200, color: "#FF0000" },
  { label: "Very Unhealthy", min: 201, max: 300, color: "#8F3F97" },
  { label: "Hazardous", min: 301, max: 500, color: "#7E0023" },
];

const popularCities = [
  "New Delhi",
  "Mumbai",
  "London",
  "New York",
  "Tokyo",
  "Paris",
  "Sydney",
  "Bangalore",
  "Dubai",
  "Singapore",
];

const AQIBadge = ({ aqi, color, label }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (aqi >= 151) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
      glowAnim.setValue(0.5);
    }
  }, [aqi]);

  return (
    <Animated.View
      style={{
        borderRadius: 12,
        padding: 4,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowAnim,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      <Animated.View
        style={{
          borderRadius: 8,
          paddingVertical: 4,
          paddingHorizontal: 8,
          alignItems: "center",
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Text style={styles.aqiValue}>{aqi ?? "--"}</Text>
        <Text style={styles.aqiLabel}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default function SearchScreen() {
  const { addCity } = useContext(CityContext);
  const navigation = useNavigation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({});

  const DARK_COLORS = {
    background: "#000000",
    card: "#111111",
    cardGradient: ["rgba(10,10,10,0.8)", "rgba(0,0,0,0.2)"],
    text: "#FFFFFF",
    subtext: "#AAAAAA",
    input: "#1C1C1E",
    border: "#222222",
    accent: "#0A84FF",
    popularCity: "#1F1F1F",
  };

  useEffect(() => {
    let cancelled = false;
    const doSearch = async () => {
      if (!query || query.length < 2) return setSuggestions([]);
      setLoading(true);
      try {
        const res = await axios.get(
          `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`
        );
        if (!cancelled) setSuggestions(res.data || []);
      } catch (e) {
        console.warn("search error", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(doSearch, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    suggestions.forEach(async (item) => {
      if (previews[item.name]) return;
      try {
        const q = item.lat && item.lon ? `${item.lat},${item.lon}` : item.name;
        const weatherRes = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}&aqi=yes`
        );

        const { lat, lon } = weatherRes.data.location;
        const aqiRes = await axios.get(
          `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQI_TOKEN}`
        );
        const aqiValue = aqiRes.data.status === "ok" ? aqiRes.data.data.aqi : null;

        setPreviews((prev) => ({
          ...prev,
          [item.name]: {
            searchItem: item,
            weather: weatherRes.data,
            aqi: aqiValue,
          },
        }));
      } catch (e) {
        console.warn("preview fetch error", e.message);
      }
    });
  }, [suggestions]);

  const getAqiColor = (aqi) => {
    if (aqi === null) return "#555";
    const cat = aqiCategories.find((c) => aqi >= c.min && aqi <= c.max);
    return cat ? cat.color : "#7E0023";
  };

  const getAqiLabel = (aqi) => {
    if (aqi === null) return "N/A";
    const cat = aqiCategories.find((c) => aqi >= c.min && aqi <= c.max);
    return cat ? cat.label : "Hazardous";
  };

  const getWeatherAnimation = (condition) => {
    condition = condition.toLowerCase();
    if (condition.includes("sun") || condition.includes("clear"))
      return require("../assets/animations/sun.json");
    if (condition.includes("cloud") || condition.includes("overcast"))
      return require("../assets/animations/Cloud.json");
    if (condition.includes("rain") || condition.includes("drizzle"))
      return require("../assets/animations/Rain.json");
    if (condition.includes("snow")) return require("../assets/animations/Snow.json");
    if (condition.includes("thunder"))
      return require("../assets/animations/Thunder.json");
    if (
      condition.includes("mist") ||
      condition.includes("fog") ||
      condition.includes("haze") ||
      condition.includes("smoke")
    )
      return require("../assets/animations/Cloud.json");
    return null;
  };

  const addCityFromPreview = (cityName) => {
    const data = previews[cityName] || {
      weather: { location: { name: cityName, country: "Unknown", lat: 0, lon: 0 } },
    };
    const { location } = data.weather;

    addCity({
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
    });

    setQuery("");
    setSuggestions([]);
    navigation.navigate("HomeTab", { newCity: location.name });
  };

  const renderItem = ({ item }) => {
    const preview = previews[item.name];
    const weather = preview?.weather;
    const aqi = preview?.aqi;
    const aqiColor = getAqiColor(aqi);
    const aqiLabel = getAqiLabel(aqi);

    if (!weather) {
      return (
        <View style={styles.loadingItem}>
          <ActivityIndicator color={DARK_COLORS.accent} />
          <Text style={{ marginLeft: 10, color: DARK_COLORS.text }}>
            {item.name}, {item.country}
          </Text>
        </View>
      );
    }

    const animationSource = getWeatherAnimation(weather.current.condition.text);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: DARK_COLORS.card, borderColor: DARK_COLORS.border },
        ]}
        onPress={() => addCityFromPreview(item.name)}
      >
        <LinearGradient
          colors={DARK_COLORS.cardGradient}
          style={styles.cardGradient}
        >
          <View style={styles.cardLeft}>
            <Text style={[styles.cityName, { color: DARK_COLORS.text }]}>
              {weather.location.name}
            </Text>
            <Text style={[styles.countryName, { color: DARK_COLORS.subtext }]}>
              {weather.location.country}
            </Text>
            <Text style={[styles.temp, { color: DARK_COLORS.text }]}>
              {weather.current.temp_c}°C
            </Text>
            <Text style={[styles.condition, { color: DARK_COLORS.text }]}>
              {weather.current.condition.text}
            </Text>
          </View>

          <View style={styles.cardRight}>
            {animationSource && (
              <LottieView
                source={animationSource}
                autoPlay
                loop
                style={styles.animation}
              />
            )}
            <AQIBadge aqi={aqi} color={aqiColor} label={aqiLabel} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK_COLORS.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <TextInput
          placeholder="Search city..."
          placeholderTextColor="#777"
          value={query}
          onChangeText={setQuery}
          style={[
            styles.input,
            { borderColor: DARK_COLORS.border, color: DARK_COLORS.text, backgroundColor: DARK_COLORS.input },
          ]}
        />
        {loading && <ActivityIndicator size="small" color={DARK_COLORS.accent} />}

        {query.length > 1 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item, idx) => item.name + idx}
            renderItem={renderItem}
            style={{ marginTop: 8 }}
          />
        ) : (
          <ScrollView contentContainerStyle={{ marginTop: 20 }}>
            <Text style={[styles.tipText, { color: DARK_COLORS.subtext }]}>
              Type a city name to check weather & AQI
            </Text>

            {popularCities.map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => addCityFromPreview(city)}
                style={[styles.popularCityButton, { backgroundColor: DARK_COLORS.popularCity }]}
              >
                <Text style={[styles.popularCityText, { color: DARK_COLORS.text }]}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ alignItems: "center", marginTop: 30 }}>
              <LottieView
                source={require("../assets/animations/search.json")}
                autoPlay
                loop
                style={{ width: 180, height: 180 }}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  loadingItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  card: { borderRadius: 14, marginVertical: 6, overflow: "hidden", flexDirection: "row", alignItems: "center", borderWidth: 0.5 },
  cardGradient: { flexDirection: "row", alignItems: "center", padding: 16, flex: 1, justifyContent: "space-between" },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: "center" },
  cityName: { fontSize: 20, fontWeight: "700" },
  countryName: { fontSize: 14, marginTop: 2 },
  temp: { fontSize: 18, marginTop: 6 },
  condition: { fontSize: 16, marginTop: 2 },
  animation: { width: 60, height: 60 },
  tipText: { fontSize: 16, marginBottom: 12, textAlign: "center" },
  popularCityButton: { paddingVertical: 12, marginVertical: 6, borderRadius: 8, alignItems: "center" },
  popularCityText: { fontSize: 16, fontWeight: "600" },
  aqiValue: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  aqiLabel: { fontSize: 12, color: "#fff" },
});
