import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Text,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { CityProvider } from "./contexts/CityContext";

import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ManageLocationsScreen from "./screens/ManageLocationsScreen";
import CityDetailsScreen from "./screens/CityDetailsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width } = Dimensions.get("window");
const APP_BLUE = "#0A84FF"; // Apple's accent

function HomeStack({ currentCity, setCurrentCity }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="HomeMain">
        {(props) => (
          <HomeScreen
            {...props}
            currentCity={currentCity}
            setCurrentCity={setCurrentCity}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ManageLocations" component={ManageLocationsScreen} />
      <Stack.Screen name="CityDetails" component={CityDetailsScreen} />
    </Stack.Navigator>
  );
}

function LiquidFAB({ navigation, currentCity }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current; // for glowing

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    if (currentCity && navigation) {
      navigation.navigate("HomeTab", {
        screen: "CityDetails",
        params: { city: currentCity },
      });
    }
  };

  const glowInterpolation = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.18],
  });

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ scale }],
          shadowColor: APP_BLUE,
          shadowOpacity: 0.32,
          shadowRadius: 18,
          elevation: 12,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ borderRadius: 30 }}
      >
        <BlurView
          intensity={120}
          tint={useColorScheme() === "dark" ? "dark" : "light"}
          style={styles.fabBlur}
        >
          <Animated.View
            style={[
              styles.fabInner,
              {
                shadowColor: APP_BLUE,
                shadowOpacity: glowInterpolation,
                shadowRadius: 20,
                elevation: 6,
              },
            ]}
          >
            <Ionicons name="expand-outline" size={26} color={APP_BLUE} />
          </Animated.View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LiquidTabBar({ state, descriptors, navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const shimmerX = useRef(new Animated.Value(-width)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, { toValue: width, duration: 2200, useNativeDriver: true })
    ).start();
  }, []);

  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      <BlurView
        intensity={130}
        tint={isDark ? "dark" : "light"}
        style={styles.tabBarBlur}
      >
        <View
          style={[
            styles.tabBarInner,
            {
              backgroundColor: isDark ? "rgba(20,20,22,0.5)" : "rgba(255,255,255,0.22)",
              borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.34)",
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerX }], opacity: 0.12 },
            ]}
          />

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const icon = route.name === "HomeTab" ? "home" : "search";

            const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
            useEffect(() => {
              Animated.spring(scale, { toValue: focused ? 1.08 : 1, friction: 6, useNativeDriver: true }).start();
            }, [focused]);

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                onPress={onPress}
                activeOpacity={0.9}
                style={styles.tabButton}
              >
                <Animated.View style={{ transform: [{ scale }] }}>
                  <Ionicons
                    name={focused ? `${icon}` : `${icon}-outline`}
                    size={focused ? 28 : 24}
                    color={focused ? "#fff" : "rgba(255,255,255,0.75)"}
                    style={focused ? styles.iconGlow : null}
                  />
                </Animated.View>
                {focused ? <View style={styles.activeDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function App() {
  const navigationRef = useRef();
  const [currentCity, setCurrentCity] = useState(null);
  const [currentRoute, setCurrentRoute] = useState("HomeMain");

  return (
    <CityProvider>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={(state) => {
          const route = state.routes[state.index];
          if (route.name === "HomeTab") {
            const nestedRoute = route.state
              ? route.state.routes[route.state.index].name
              : "HomeMain";
            setCurrentRoute(nestedRoute);
          } else {
            setCurrentRoute(route.name);
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <LiquidTabBar {...props} />}
          >
            <Tab.Screen name="HomeTab">
              {() => <HomeStack currentCity={currentCity} setCurrentCity={setCurrentCity} />}
            </Tab.Screen>
            <Tab.Screen name="Search" component={SearchScreen} />
          </Tab.Navigator>

          {/* Show FAB only on HomeScreen */}
          {currentRoute === "HomeMain" && (
            <LiquidFAB navigation={navigationRef.current} currentCity={currentCity} />
          )}
        </View>
      </NavigationContainer>
    </CityProvider>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 28 : 18,
    height: 78,
    borderRadius: 30,
    alignItems: "center",
  },
  tabBarBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
  },
  tabBarInner: {
    margin: 6,
    height: 66,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 6 },
    textShadowColor: APP_BLUE,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },

  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 82 : 72,
    alignSelf: "center",
    zIndex: 100,
  },
  fabBlur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: APP_BLUE,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  shimmer: {
    position: "absolute",
    left: -width,
    top: 0,
    bottom: 0,
    width: width * 0.5,
    backgroundColor: "rgba(255,255,255,0.7)",
    transform: [{ rotate: "20deg" }],
  },
});
