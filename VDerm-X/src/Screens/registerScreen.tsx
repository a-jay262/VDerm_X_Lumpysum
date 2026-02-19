import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

const RegisterScreen = ({ navigation }: any) => {
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVet, setIsVet] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [contact, setContact] = useState("");
  const [area, setArea] = useState("");
  const [availability, setAvailability] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Password requirement checks
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(req => req === true);

  const PasswordRequirementItem = ({ text, met }: { text: string; met: boolean }) => (
    <View style={styles.requirementRow}>
      <Ionicons 
        name={met ? "checkmark-circle" : "close-circle"} 
        size={20} 
        color={met ? "#4CAF50" : "#FF6B6B"} 
      />
      <Text style={[styles.requirementText, { color: met ? "#4CAF50" : "#FF6B6B" }]}>
        {text}
      </Text>
    </View>
  );

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    // Validate vet fields if registering as vet
    if (isVet) {
      if (!specialization || !contact || !area || !availability || !licenseNumber) {
        Alert.alert("Error", "All vet fields are required.");
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Invalid email address.");
      return;
    }

    // Validate password requirements
    if (!allRequirementsMet) {
      Alert.alert("Error", "Password must meet all complexity requirements.");
      return;
    }

    try {
      const payload: any = {
        username,
        email,
        password,
        role: isVet ? 'vet' : 'user',
      };

      // Add vet fields if registering as vet
      if (isVet) {
        payload.specialization = specialization;
        payload.contact = contact;
        payload.area = area;
        payload.availability = availability;
        payload.licenseNumber = licenseNumber;
      }

      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        Alert.alert('Error', 'Backend is not responding properly. Make sure the server is running.');
        return;
      }

      if (response.status === 409) {
        Alert.alert("Error", "Email already exists.");
      } else if (response.ok) {
        // Check if user is already verified (email service not configured)
        if (data.verified) {
          Alert.alert("Success", "Account created! You can now login.", [
            { text: "OK", onPress: () => navigation.navigate("Login") }
          ]);
        } else {
          Alert.alert("Success", "Verification OTP sent. Check your email.");
          navigation.navigate("Verify", { email });
        }
      } else {
        Alert.alert("Error", data.message || "Failed to sign up.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Cannot connect to server. Make sure backend is running.");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <Image source={require("../Assets/logo.png")} style={styles.logo} />
      </Animated.View>

      <Animated.View
        style={[
          styles.formContainer,
          { opacity: formOpacity, transform: [{ translateY: formTranslateY }] },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create an Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password Input with Eye Button */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showPassword ? "eye" : "eye-off"} 
                size={24} 
                color="#259D8A" 
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          {password.length > 0 && (
            <View style={styles.requirementsContainer}>
              <PasswordRequirementItem text="At least 8 characters" met={passwordRequirements.minLength} />
              <PasswordRequirementItem text="Lowercase letter (a-z)" met={passwordRequirements.hasLowercase} />
              <PasswordRequirementItem text="Uppercase letter (A-Z)" met={passwordRequirements.hasUppercase} />
              <PasswordRequirementItem text="Number (0-9)" met={passwordRequirements.hasNumber} />
              <PasswordRequirementItem text="Special character (@$!%*?&)" met={passwordRequirements.hasSpecialChar} />
            </View>
          )}

          {/* Role Selection Toggle */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setIsVet(!isVet)}
          >
            <View style={styles.checkbox}>
              {isVet && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>Register as Veterinarian</Text>
          </TouchableOpacity>

          {/* Vet-specific fields */}
          {isVet && (
            <View style={styles.vetFieldsContainer}>
              <TextInput
                style={styles.input}
                placeholder="Specialization (e.g., Cattle Specialist)"
                value={specialization}
                onChangeText={setSpecialization}
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                value={contact}
                onChangeText={setContact}
              />
              <TextInput
                style={styles.input}
                placeholder="Area/Location"
                value={area}
                onChangeText={setArea}
              />
              <TextInput
                style={styles.input}
                placeholder="Availability (e.g., Mon-Fri 9AM-5PM)"
                value={availability}
                onChangeText={setAvailability}
              />
              <TextInput
                style={styles.input}
                placeholder="License Number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </View>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleSignup}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#F7F8FA" },
  logoContainer: { marginBottom: 30 },
  logo: { width: 120, height: 120, resizeMode: "contain" },
  formContainer: { width: "100%", maxHeight: "80%", padding: 20, backgroundColor: "#FFFFFF", borderRadius: 10 },
  title: { fontSize: 22, fontWeight: "700", color: "#333", textAlign: "center", marginBottom: 20 },
  input: { height: 50, backgroundColor: "#F2F2F2", borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, color: "#333" },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    padding: 10,
  },
  requirementsContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#259D8A",
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "500",
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: "#259D8A", borderRadius: 4, marginRight: 10, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { width: 14, height: 14, backgroundColor: "#259D8A", borderRadius: 2 },
  checkboxLabel: { fontSize: 16, color: "#333" },
  vetFieldsContainer: { marginBottom: 10 },
  registerButton: { backgroundColor: "#259D8A", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  registerButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  loginText: { marginTop: 15, color: "#259D8A", fontSize: 16, textAlign: "center", textDecorationLine: "underline", marginBottom: 10 },
});

export default RegisterScreen;
