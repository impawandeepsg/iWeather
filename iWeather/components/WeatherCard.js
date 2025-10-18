// components/WeatherCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function WeatherCard({ data }) {
  const { location, current } = data;
  const aqi = current?.air_quality?.["us-epa-index"];

  const getAQIText = (index) => {
    if (index === 1) return "Good";
    if (index === 2) return "Moderate";
    if (index === 3) return "Unhealthy for Sensitive Groups";
    if (index === 4) return "Unhealthy";
    if (index === 5) return "Very Unhealthy";
    if (index === 6) return "Hazardous";
    return "N/A";
  };

  return (
    <LinearGradient
      colors={["#3a7bd5", "#3a6073"]}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.city}>{location.name}</Text>
      <Text style={styles.temp}>{current.temp_c}°</Text>
      <Text style={styles.condition}>{current.condition.text}</Text>
      <View style={styles.row}>
        <Text style={styles.minmax}>
          H: {current.temp_c + 2}°  L: {current.temp_c - 3}°
        </Text>
      </View>
      <Text style={styles.aqi}>AQI: {getAQIText(aqi)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
  },
  city: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
  },
  temp: {
    fontSize: 80,
    color: "#fff",
    fontWeight: "200",
  },
  condition: {
    fontSize: 20,
    color: "#f5f5f5",
  },
  row: { flexDirection: "row", marginVertical: 6 },
  minmax: { color: "#eee", fontSize: 16 },
  aqi: { color: "#fffa", fontSize: 14, marginTop: 10 },
});
