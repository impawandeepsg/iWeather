import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { CityContext } from "../contexts/CityContext";
import debounce from "lodash.debounce";

const API_KEY = "b708f52f62fd4cc6acd93153231711";

export default function ManageLocationsScreen({ navigation }) {
  const { cities, setAllCities } = useContext(CityContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`
      );
      setSuggestions(res.data || []);
    } catch (e) {
      console.warn("Autocomplete error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = debounce(fetchSuggestions, 300);

  const handleInputChange = (text) => {
    setSearchQuery(text);
    debouncedFetch(text);
  };

  const handleAddLocation = (city) => {
    const newCity = {
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      country: city.country,
    };

    const exists = cities.some(
      (c) =>
        c.name.toLowerCase() === newCity.name.toLowerCase() &&
        c.country.toLowerCase() === newCity.country.toLowerCase()
    );

    if (exists) {
      Alert.alert("Already added", `${city.name} is already in your list.`);
    } else {
      setAllCities([...cities, newCity]);
      setSearchQuery("");
      setSuggestions([]);
      Keyboard.dismiss();
    }
  };

  const handleRemove = (city) => {
    Alert.alert(
      "Remove City",
      `Do you want to remove ${city.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updated = cities.filter(
              (c) => !(c.name === city.name && c.country === city.country)
            );
            setAllCities(updated);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSelect = (index) => {
    const selectedCity = cities[index];
    const updatedCities = [selectedCity, ...cities.filter((_, i) => i !== index)];
    setAllCities(updatedCities);
    navigation.navigate("HomeMain"); // make sure this matches your Home screen name
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Locations</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#aaa" style={{ marginLeft: 10 }} />
        <TextInput
          placeholder="Add a new city..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={handleInputChange}
          style={styles.searchInput}
        />
        {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />}
      </View>

      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.map((city, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleAddLocation(city)}
            >
              <Text style={styles.suggestionText}>{city.name}, {city.country}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Saved Cities */}
      <FlatList
        data={cities}
        keyExtractor={(item, index) => item.name + index}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.cityItem}
            onPress={() => handleSelect(index)}
            onLongPress={() => handleRemove(item)}
          >
            <Ionicons name="location-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cityName}>{item.name}</Text>
              <Text style={styles.cityCountry}>{item.country}</Text>
            </View>
            {index === 0 && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50, paddingHorizontal: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  title: { color: "#fff", fontSize: 20, fontWeight: "600" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    height: 45,
    marginBottom: 5,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16, paddingHorizontal: 10 },
  suggestionsContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: "#555" },
  suggestionText: { color: "#fff", fontSize: 16 },
  cityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomColor: "rgba(255,255,255,0.1)", borderBottomWidth: 1 },
  cityName: { color: "#fff", fontSize: 17, fontWeight: "500" },
  cityCountry: { color: "#aaa", fontSize: 13 },
  currentBadge: { backgroundColor: "#007AFF", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  currentText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
