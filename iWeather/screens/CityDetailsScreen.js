// screens/CityDetailsScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { Circle } from "react-native-progress";

const { width } = Dimensions.get("window");

// API keys
const WEATHER_API_KEY = "b708f52f62fd4cc6acd93153231711";
const WAQI_TOKEN = "014026cb2f3c51e46c4aff0167033ad7a15274dd";

const aqiCategories = [
  { label: "Good", min: 0, max: 50, color: "#00E400" },
  { label: "Moderate", min: 51, max: 100, color: "#FFFF00" },
  { label: "Unhealthy for Sensitive Groups", min: 101, max: 150, color: "#FF7E00" },
  { label: "Unhealthy", min: 151, max: 200, color: "#FF0000" },
  { label: "Very Unhealthy", min: 201, max: 300, color: "#8F3F97" },
  { label: "Hazardous", min: 301, max: 500, color: "#7E0023" },
];

function chooseAnimation(condition, is_day = 1) {
  const c = (condition || "").toLowerCase();
  if ((c.includes("sun") || c.includes("clear"))) {
    return is_day
      ? require("../assets/animations/sun.json")
      : require("../assets/animations/night_clear.json");
  }
  if (c.includes("cloud") || c.includes("overcast")) return require("../assets/animations/Cloud.json");
  if (c.includes("rain") || c.includes("drizzle")) return require("../assets/animations/Rain.json");
  if (c.includes("snow")) return require("../assets/animations/Snow.json");
  if (c.includes("thunder")) return require("../assets/animations/Thunder.json");
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke"))
    return require("../assets/animations/Cloud.json");
  return null;
}

const format1 = (n) => (n === null || n === undefined || Number.isNaN(n) ? "--" : Number(n).toFixed(1));

const getAqiCategory = (aqi) => {
  if (aqi === null || aqi === undefined) return { label: "N/A", color: "#999" };
  const cat = aqiCategories.find((c) => aqi >= c.min && aqi <= c.max);
  return cat || { label: "Hazardous", color: "#7E0023" };
};

export default function CityDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const incoming = route.params?.data || route.params?.city || {};
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [aqiFull, setAqiFull] = useState(null);
  const [aqiModalVisible, setAqiModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [260, 120],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        let q = "";
        if (incoming?.lat && incoming?.lon) q = `${incoming.lat},${incoming.lon}`;
        else if (incoming?.location?.lat && incoming?.location?.lon) q = `${incoming.location.lat},${incoming.location.lon}`;
        else if (incoming?.name) q = incoming.name;
        else q = `${incoming?.lat ?? 0},${incoming?.lon ?? 0}`;

        const weatherRes = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
            q
          )}&days=7&aqi=no&alerts=yes`
        );

        if (cancelled) return;
        setWeatherData(weatherRes.data);

        const loc = weatherRes.data?.location;
        if (loc?.lat && loc?.lon) {
          try {
            const aqiRes = await axios.get(
              `https://api.waqi.info/feed/geo:${loc.lat};${loc.lon}/?token=${WAQI_TOKEN}`
            );
            if (!cancelled && aqiRes.data?.status === "ok") {
              setAqi(aqiRes.data.data.aqi);
              setAqiFull(aqiRes.data.data);
            } else {
              setAqi(null);
              setAqiFull(null);
            }
          } catch {
            setAqi(null);
            setAqiFull(null);
          }
        }
      } catch (err) {
        console.warn("CityDetails fetch error:", err?.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => (cancelled = true);
  }, [incoming]);

  if (loading || !weatherData) {
    return (
      <SafeAreaView style={[styles.center, { flex: 1, backgroundColor: "#0b1220" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const { location, current, forecast, forecast: { forecastday } = {} } = weatherData;
  const animationSource = chooseAnimation(current?.condition?.text, current?.is_day);
  const aqiCategory = getAqiCategory(aqi);
  const hourly = (forecastday && forecastday[0] && forecastday[0].hour) || [];
  const astro = forecastday && forecastday[0] && forecastday[0].astro;

  const parseHour = (str) => {
    if (!str) return 6;
    const [hmin, period] = str.split(" ");
    let [h, m] = hmin.split(":").map(Number);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h;
  };
  const sunriseHour = parseHour(astro?.sunrise);
  const sunsetHour = parseHour(astro?.sunset);

  const now = new Date(weatherData.location.localtime);
  const currentHour = now.getHours();
  const shiftedHourly = [...hourly.slice(currentHour), ...hourly.slice(0, currentHour)];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
          style={StyleSheet.absoluteFill}
        />
        {animationSource && (
          <LottieView
            source={animationSource}
            autoPlay
            loop
            style={styles.headerLottie}
            resizeMode="cover"
          />
        )}
        <BlurView intensity={30} tint="dark" style={styles.headerBlur} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="star-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.headerTitleWrap, { transform: [{ scale: titleScale }] }]}>
          <Text style={styles.cityTitle}>{location.name}</Text>
          <Text style={styles.citySub}>{location.country}</Text>
          <View style={styles.tempRow}>
            <Text style={styles.tempLarge}>{format1(current.temp_c)}°C</Text>
            <View style={styles.conditionCol}>
              <Text style={styles.conditionLarge}>{current.condition.text}</Text>
              <Text style={styles.feels}>Feels like {format1(current.feelslike_c)}°C</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ScrollView */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Quick stat cards */}
        <View style={styles.section}>
          <View style={styles.cardsRow}>
            <View style={[styles.statCard, styles.cardElev]}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>{current.humidity}%</Text>
            </View>
            <View style={[styles.statCard, styles.cardElev]}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statValue}>{format1(current.wind_kph)} kph</Text>
            </View>
            <View style={[styles.statCard, styles.cardElev]}>
              <Text style={styles.statLabel}>Pressure</Text>
              <Text style={styles.statValue}>{format1(current.pressure_mb)} mb</Text>
            </View>
          </View>
        </View>

        {/* Hourly Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly — Today</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {shiftedHourly.map((h, idx) => {
              const hour = new Date(h.time).getHours();
              const isDayHour = hour >= sunriseHour && hour < sunsetHour;
              return (
                <View key={idx} style={styles.hourItem}>
                  <Text style={styles.hourTime}>{idx === 0 ? "Now" : h.time.split(" ").pop()}</Text>
                  <LottieMini condition={h.condition.text} is_day={isDayHour} />
                  <Text style={styles.hourTemp}>{format1(h.temp_c)}°</Text>
                  <Text style={styles.hourChance}>
                    {h.chance_of_rain ?? h.will_it_rain ? `${h.chance_of_rain ?? h.will_it_rain}%` : ""}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 7-Day Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          <View style={{ marginTop: 12 }}>
            {forecastday.map((day, i) => {
              const weekday = new Date(day.date).toLocaleDateString(undefined, { weekday: "short" });
              return (
                <View key={i} style={[styles.dayRow, styles.cardElev]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.dayName}>{weekday}</Text>
                    <Text style={styles.dayCondition}>{day.day.condition.text}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.dayTemp}>
                      {format1(day.day.maxtemp_c)}° / {format1(day.day.mintemp_c)}°
                    </Text>
                    <Text style={styles.dayExtra}>Rain: {day.day.daily_chance_of_rain ?? "--"}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* AQI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Air Quality</Text>
          <View style={[styles.aqiRow, styles.cardElev]}>
            <View style={styles.aqiLeft}>
              <Circle
                size={80}
                progress={Math.min((aqi ?? 0) / 500, 1)}
                showsText
                formatText={() => (aqi !== null ? `${aqi}` : "NA")}
                color={aqiCategory.color}
                unfilledColor="rgba(255,255,255,0.08)"
                borderWidth={0}
                thickness={10}
                textStyle={{ fontSize: 18, fontWeight: "700", color: "#fff" }}
              />
            </View>
            <View style={styles.aqiRight}>
              <Text style={[styles.aqiLabel, { color: aqiCategory.color }]}>{aqiCategory.label}</Text>
              <Text style={styles.aqiAdvice}>
                {aqiFull?.dominentpol ? `Dominant: ${aqiFull.dominentpol.toUpperCase()}` : "Dominant pollutant: —"}
              </Text>
              <TouchableOpacity
                style={styles.aqiDetailBtn}
                onPress={() => setAqiModalVisible(true)}
              >
                <Text style={styles.aqiDetailText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Environment Extras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={[styles.grid, styles.cardElev]}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>UV Index</Text>
              <Text style={styles.gridValue}>{format1(current.uv)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Visibility</Text>
              <Text style={styles.gridValue}>{format1(current.vis_km)} km</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Cloud</Text>
              <Text style={styles.gridValue}>{current.cloud}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Precip (1h)</Text>
              <Text style={styles.gridValue}>{format1(current.precip_mm)} mm</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {weatherData?.alerts?.alert?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            <View style={[styles.cardElev, { padding: 12, marginTop: 8 }]}>
              {weatherData.alerts.alert.map((al, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: "700", color: "#ffcc00" }}>{al.headline}</Text>
                  <Text style={{ color: "#fff", marginTop: 4 }}>{al.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Premium AQI Modal */}
      {aqiModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPremium}>
            <Text style={styles.modalTitle}>Air Quality Details</Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>City:</Text>
              <Text style={styles.modalValue}>{location.name}</Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>AQI:</Text>
              <Text style={[styles.modalValue, { color: aqiCategory.color }]}>{aqi}</Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Category:</Text>
              <Text style={styles.modalValue}>{aqiCategory.label}</Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Dominant Pollutant:</Text>
              <Text style={styles.modalValue}>{aqiFull?.dominentpol?.toUpperCase() ?? "—"}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAqiModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Mini Lottie for hourly
function LottieMini({ condition, is_day }) {
  const src = chooseAnimation(condition, is_day ? 1 : 0);
  if (!src) return <Ionicons name="cloud-outline" size={26} color="#fff" />;
  return <LottieView source={src} autoPlay loop style={{ width: 44, height: 44 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  center: { justifyContent: "center", alignItems: "center" },

  header: { width, backgroundColor: "transparent", overflow: "hidden", justifyContent: "flex-start" },
  headerLottie: { position: "absolute", width: width * 1.2, height: 300, top: -40, left: -(width * 0.1), opacity: 0.9 },
  headerBlur: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },

  headerTopRow: { marginTop: Platform.OS === "ios" ? 10 : 20, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, zIndex: 10 },
  headerBack: { backgroundColor: "rgba(255,255,255,0.06)", padding: 8, borderRadius: 10 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 8, marginLeft: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)" },

  headerTitleWrap: { paddingHorizontal: 20, marginTop: 10 },
  cityTitle: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center" },
  citySub: { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 6 },

  tempRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tempLarge: { fontSize: 56, fontWeight: "900", color: "#fff", marginRight: 12 },
  conditionCol: { alignItems: "flex-start" },
  conditionLarge: { color: "#fff", fontSize: 16, fontWeight: "600" },
  feels: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },

  cardsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 12, marginHorizontal: 6, borderRadius: 14, alignItems: "center" },
  cardElev: { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6, backgroundColor: "rgba(255,255,255,0.03)" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 16, marginTop: 6, fontWeight: "700" },

  hourItem: { width: 84, marginRight: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10, alignItems: "center" },
  hourTime: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  hourTemp: { color: "#fff", fontSize: 14, marginTop: 6, fontWeight: "700" },
  hourChance: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },

  dayRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderRadius: 12, marginVertical: 6 },
  dayName: { color: "#fff", fontWeight: "700", marginRight: 8 },
  dayCondition: { color: "rgba(255,255,255,0.85)", marginLeft: 8 },
  dayTemp: { color: "#fff", fontWeight: "700" },
  dayExtra: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  aqiRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12 },
  aqiLeft: { marginRight: 12 },
  aqiRight: { flex: 1 },
  aqiLabel: { fontSize: 18, fontWeight: "800", color: "#fff" },
  aqiAdvice: { color: "rgba(255,255,255,0.9)", marginTop: 6 },
  aqiDetailBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)" },
  aqiDetailText: { color: "#fff" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", padding: 12, borderRadius: 12 },
  gridItem: { width: "48%", marginBottom: 12 },
  gridLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  gridValue: { color: "#fff", fontWeight: "800", marginTop: 6 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 1000 },

  // Premium modal
  modalContentPremium: {
    width: "85%",
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 20, textAlign: "center" },
  modalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalLabel: { color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  modalValue: { color: "#fff", fontWeight: "700" },
  modalCloseBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
