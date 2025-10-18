import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

const { width, height } = Dimensions.get("window");

const aqiCategories = [
  { label: "Good", min: 0, max: 50, color: "#00E400", advice: "Air quality is satisfactory." },
  { label: "Moderate", min: 51, max: 100, color: "#FFFF00", advice: "Air quality is acceptable." },
  { label: "Unhealthy for Sensitive", min: 101, max: 150, color: "#FF7E00", advice: "People with respiratory issues should limit outdoor activity." },
  { label: "Unhealthy", min: 151, max: 200, color: "#FF0000", advice: "Everyone may begin to experience health effects." },
  { label: "Very Unhealthy", min: 201, max: 300, color: "#8F3F97", advice: "Health alert: everyone may experience serious effects." },
  { label: "Hazardous", min: 301, max: 500, color: "#7E0023", advice: "Health warnings of emergency conditions." },
];

export default function AQIModal({ visible, onClose, location }) {
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const modalAnim = useRef(new Animated.Value(0)).current; // modal opacity/slide
  const cardAnims = useRef([]).current; // animated values for cards

  useEffect(() => {
    if (!visible) return;

    // initialize animated values
    cardAnims.length = 0;
    [0, 1, 2].forEach(() => cardAnims.push(new Animated.Value(0)));

    const fetchAQI = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://api.waqi.info/feed/geo:${location.lat};${location.lon}/?token=014026cb2f3c51e46c4aff0167033ad7a15274dd`
        );
        if (res.data.status === "ok") setAqiData(res.data.data);
        else setAqiData(null);
      } catch (e) {
        console.warn("AQI fetch error:", e.message);
        setAqiData(null);
      } finally {
        setLoading(false);
        animateModalAndCards();
      }
    };

    fetchAQI();
  }, [visible]);

  const animateModalAndCards = () => {
    Animated.timing(modalAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    cardAnims.forEach((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 400, delay: i * 150, useNativeDriver: true }).start()
    );
  };

  const getCategory = (value) =>
    aqiCategories.find((cat) => value >= cat.min && value <= cat.max) || null;

  const renderPollutants = (iaqi) => {
    if (!iaqi) return null;
    return Object.keys(iaqi).map((key, index) => {
      const val = iaqi[key].v;
      const barAnim = useRef(new Animated.Value(0)).current;
      Animated.timing(barAnim, {
        toValue: Math.min((val / 500) * 100, 100),
        duration: 800,
        delay: index * 100,
        useNativeDriver: false,
      }).start();

      return (
        <View key={key} style={styles.pollutantCard}>
          <Text style={styles.pollutantName}>{key.toUpperCase()}</Text>
          <View style={styles.pollutantBarBackground}>
            <Animated.View
              style={[
                styles.pollutantBarFill,
                {
                  width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                  shadowColor: "#fff",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <LinearGradient
                colors={["#00E400", "#FFFF00", "#FF0000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 4 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.pollutantValue}>{val}</Text>
        </View>
      );
    });
  };

  const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });

  return visible ? (
    <BlurView intensity={80} tint="dark" style={styles.blurBackground}>
      <Animated.View
        style={[
          styles.modalContainer,
          { opacity: modalAnim, transform: [{ translateY: modalTranslateY }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : aqiData ? (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {[0, 1, 2].map((_, i) => {
              let content;
              if (i === 0) {
                content = (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Air Quality Index</Text>
                    <LinearGradient
                      colors={["#FF7E00", "#FF0000"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 12, padding: 8, marginVertical: 6 }}
                    >
                      <Text
                        style={{
                          fontSize: 48,
                          fontWeight: "bold",
                          color: getCategory(aqiData.aqi)?.color || "#fff",
                          textAlign: "center",
                          textShadowColor: getCategory(aqiData.aqi)?.color || "#fff",
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 16,
                        }}
                      >
                        {aqiData.aqi}
                      </Text>
                    </LinearGradient>
                    <Text
                      style={[
                        styles.modalCategory,
                        { color: getCategory(aqiData.aqi)?.color },
                      ]}
                    >
                      {getCategory(aqiData.aqi)?.label}
                    </Text>
                    <Text style={styles.modalAdvice}>
                      {getCategory(aqiData.aqi)?.advice}
                    </Text>
                  </View>
                );
              } else if (i === 1) {
                content = (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Dominant Pollutant</Text>
                    <Text style={styles.cardValue}>
                      {aqiData.dominentpol?.toUpperCase()}
                    </Text>
                  </View>
                );
              } else {
                content = (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pollutant Concentrations</Text>
                    {renderPollutants(aqiData.iaqi)}
                  </View>
                );
              }

              return (
                <Animated.View
                  key={i}
                  style={{
                    opacity: cardAnims[i] || 0,
                    transform: [
                      {
                        scale: cardAnims[i]
                          ? cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
                          : 1,
                      },
                    ],
                    width: "100%",
                  }}
                >
                  {content}
                </Animated.View>
              );
            })}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <Text style={styles.errorText}>Failed to fetch AQI data</Text>
        )}
      </Animated.View>
    </BlurView>
  ) : null;
}

const styles = StyleSheet.create({
  blurBackground: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: {
    width: width - 40,
    maxHeight: height - 120,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 25,
    padding: 20,
  },
  scrollContainer: { alignItems: "center" },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 15,
    width: "100%",
    marginVertical: 8,
    shadowColor: "#00f2fe",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    alignItems: "center",
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  cardValue: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalCategory: { fontSize: 20, fontWeight: "600", marginVertical: 4 },
  modalAdvice: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 6 },
  pollutantCard: { marginVertical: 6, width: "100%" },
  pollutantName: { color: "#fff", fontSize: 14, marginBottom: 4 },
  pollutantBarBackground: {
    height: 8,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  pollutantBarFill: { height: "100%", borderRadius: 4 },
  pollutantValue: { color: "#fff", fontSize: 12, marginTop: 2, textAlign: "right" },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorText: { color: "#fff", fontSize: 18, marginTop: 20 },
});
