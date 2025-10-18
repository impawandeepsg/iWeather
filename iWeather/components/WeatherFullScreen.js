import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Circle } from "react-native-progress";

const { width, height } = Dimensions.get("window");

const aqiCategories = [
  { label: "Good", min: 0, max: 50, color: "#00E400", advice: "Air quality is satisfactory." },
  { label: "Moderate", min: 51, max: 100, color: "#FFFF00", advice: "Air quality is acceptable." },
  { label: "Unhealthy for Sensitive Groups", min: 101, max: 150, color: "#FF7E00", advice: "Sensitive people should reduce outdoor activity." },
  { label: "Unhealthy", min: 151, max: 200, color: "#FF0000", advice: "Everyone may experience health effects." },
  { label: "Very Unhealthy", min: 201, max: 300, color: "#8F3F97", advice: "Health alert: serious effects possible." },
  { label: "Hazardous", min: 301, max: 500, color: "#7E0023", advice: "Health warnings of emergency conditions." },
];

export default function WeatherFullScreen({ data }) {
  if (!data) return null;

  const { location, current } = data;
  const [aqi, setAqi] = useState(null);
  const [aqiDataFull, setAqiDataFull] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Detect day/night
  const isDay = current.is_day === 1;

  // Fetch AQI
  useEffect(() => {
    const fetchAQI = async () => {
      try {
        const { lat, lon } = location;
        const res = await axios.get(
          `https://api.waqi.info/feed/geo:${lat};${lon}/?token=014026cb2f3c51e46c4aff0167033ad7a15274dd`
        );
        if (res.data.status === "ok") {
          setAqi(res.data.data.aqi);
          setAqiDataFull(res.data.data);
        } else {
          setAqi(null);
          setAqiDataFull(null);
        }
      } catch (e) {
        console.warn("AQI fetch error:", e.message);
        setAqi(null);
        setAqiDataFull(null);
      }
    };
    fetchAQI();
  }, [location]);

  // Animate AQI pointer
  useEffect(() => {
    const safeAqi = typeof aqi === "number" ? aqi : 0;
    const targetPercent = Math.min((safeAqi / 500) * 100, 100);
    Animated.timing(animatedValue, {
      toValue: targetPercent,
      duration: 1000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [aqi]);

  const condition = current.condition.text.toLowerCase();
  let gradientColors = ["#4facfe", "#00f2fe"];
  let animationSource = null;

  // Day/Night Gradient & Animation
  if (condition.includes("sun") || condition.includes("clear")) {
    gradientColors = isDay ? ["#fceabb", "#f8b500"] : ["#0f2027", "#203a43"];
    animationSource = isDay
      ? require("../assets/animations/sun.json")
      : require("../assets/animations/night_clear.json");
  } else if (condition.includes("cloud") || condition.includes("overcast")) {
    gradientColors = isDay ? ["#bdc3c7", "#2c3e50"] : ["#2c3e50", "#4b6cb7"];
    animationSource = require("../assets/animations/Cloud.json");
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    gradientColors = isDay ? ["#667db6", "#0082c8"] : ["#0f2027", "#203a43"];
    animationSource = require("../assets/animations/Rain.json");
  } else if (condition.includes("snow")) {
    gradientColors = isDay ? ["#83a4d4", "#b6fbff"] : ["#1e3c53", "#2e5d77"];
    animationSource = require("../assets/animations/Snow.json");
  } else if (condition.includes("thunder")) {
    gradientColors = isDay ? ["#141E30", "#243B55"] : ["#0b0c10", "#1f2833"];
    animationSource = require("../assets/animations/Thunder.json");
  } else if (
    condition.includes("mist") ||
    condition.includes("fog") ||
    condition.includes("haze") ||
    condition.includes("smoke")
  ) {
    gradientColors = isDay ? ["#8e9eab", "#eef2f3"] : ["#232526", "#414345"];
    animationSource = require("../assets/animations/Cloud.json");
  }

  const getAqiColor = (value) => {
    for (let cat of aqiCategories) {
      if (value >= cat.min && value <= cat.max) return cat.color;
    }
    return "#7E0023";
  };

  const safeAqi = typeof aqi === "number" ? aqi : 0;
  const aqiColor = getAqiColor(safeAqi);
  const currentCategory =
    aqiCategories.find((cat) => safeAqi >= cat.min && safeAqi <= cat.max)?.label || "Hazardous";

  const PremiumAQIModal = () => {
    if (!aqiDataFull) return null;
    const category = aqiCategories.find(
      (cat) => aqiDataFull.aqi >= cat.min && aqiDataFull.aqi <= cat.max
    ) || { color: "#fff", advice: "" };

    return (
      <View style={styles.modalWrapper}>
        <BlurView intensity={100} tint={isDay ? "light" : "dark"} style={styles.modalContainer}>
          <Circle
            size={160}
            progress={Math.min(aqiDataFull.aqi / 500, 1)}
            showsText
            formatText={() => `${aqiDataFull.aqi}`}
            color={category.color}
            unfilledColor="rgba(255,255,255,0.1)"
            borderWidth={0}
            thickness={12}
            textStyle={{ fontSize: 36, fontWeight: "bold", color: "#fff" }}
          />
          <Text style={[styles.modalCategory, { color: category.color }]}>{category.label}</Text>
          <Text style={styles.modalAdvice}>{category.advice}</Text>

          <Text style={styles.sectionTitle}>Dominant Pollutant:</Text>
          <Text style={styles.pollutant}>{aqiDataFull.dominentpol.toUpperCase()}</Text>

          <Text style={styles.sectionTitle}>Pollutant Concentrations:</Text>
          <View style={styles.pollutantGrid}>
            {aqiDataFull.iaqi &&
              Object.keys(aqiDataFull.iaqi).map((key) => (
                <View key={key} style={styles.pollutantItem}>
                  <Text style={styles.pollutant}>{key.toUpperCase()}</Text>
                  <Text style={[styles.pollutant, { fontWeight: "700" }]}>{aqiDataFull.iaqi[key].v}</Text>
                </View>
              ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.topCard}>
            <Text style={styles.city}>{location.name}</Text>
            <Text style={styles.country}>{location.country}</Text>
            <Text style={styles.temp}>{current.temp_c.toFixed(1)}°C</Text>
            <Text style={styles.condition}>{current.condition.text}</Text>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="water-percent" size={20} color="#fff" />
              <Text style={styles.info}>Humidity: {current.humidity}%</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="weather-windy" size={20} color="#fff" />
              <Text style={styles.info}>Wind: {current.wind_kph.toFixed(1)} kph</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="thermometer-lines" size={20} color="#fff" />
              <Text style={styles.info}>
                High: {(current.temp_c + 2).toFixed(1)}°C | Low: {(current.temp_c - 2).toFixed(1)}°C
              </Text>
            </View>
          </View>

          <View style={styles.animationWrapper}>
            {animationSource && (
              <LottieView
                source={animationSource}
                autoPlay
                loop
                style={{ width: 200, height: 200, opacity: 0.85 }}
              />
            )}
          </View>

          {aqi !== null && (
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <View style={styles.aqiContainer}>
                <Animated.View style={[styles.aqiBarBackground]}>
                  <Animated.View
                    style={[
                      styles.aqiFill,
                      {
                        width: animatedValue.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                        backgroundColor: aqiColor,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.glowCircle,
                      {
                        left: animatedValue.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                        backgroundColor: aqiColor,
                        shadowColor: aqiColor,
                      },
                    ]}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.aqiValueContainer,
                    {
                      left: animatedValue.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                      transform: [{ translateX: -10 }],
                    },
                  ]}
                >
                  <Text style={[styles.aqiValue, { color: aqiColor }]}>{aqi}</Text>
                </Animated.View>
              </View>
            </TouchableOpacity>
          )}

          {modalVisible && <PremiumAQIModal />}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { width, height, paddingHorizontal: 20, justifyContent: "flex-start" },
  topCard: { borderRadius: 25, padding: 20, marginVertical: 20 },
  city: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  country: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  temp: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  condition: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 4 },
  info: { fontSize: 18, color: "#fff", marginLeft: 6, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  animationWrapper: { alignItems: "center", justifyContent: "center", marginVertical: 10 },
  aqiContainer: { marginTop: 20 },
  aqiBarBackground: { height: 12, width: "100%", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden", position: "relative" },
  aqiFill: { height: "100%", borderRadius: 6 },
  glowCircle: { position: "absolute", top: -6, width: 20, height: 20, borderRadius: 10, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  aqiValueContainer: { position: "absolute", top: 20 },
  aqiValue: { fontSize: 16, fontWeight: "bold" },
  modalWrapper: { position: "absolute", top: 0, left: 0, width, height, justifyContent: "center", alignItems: "center", zIndex: 10 },
  modalContainer: { width: width - 40, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 25, padding: 20, alignItems: "center" },
  modalCategory: { fontSize: 22, fontWeight: "bold", marginTop: 12 },
  modalAdvice: { fontSize: 14, color: "#fff", marginTop: 6, textAlign: "center" },
  sectionTitle: { fontSize: 16, color: "#fff", fontWeight: "600", marginTop: 12 },
  pollutant: { fontSize: 14, color: "#fff" },
  pollutantGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 6 },
  pollutantItem: { width: "48%", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 8, marginVertical: 4, alignItems: "center" },
  closeButton: { marginTop: 20, backgroundColor: "#007AFF", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 12 },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
