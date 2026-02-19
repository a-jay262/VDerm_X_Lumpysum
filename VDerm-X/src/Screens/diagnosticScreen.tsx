import React, { useState, useEffect } from "react";
import { View, Button, Image, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { getUserData, UserData } from "../utils/auth";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";

const DiagnosticScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const handleImagePick = async (type: "camera" | "gallery") => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== "granted" || libraryPermission.status !== "granted") {
        Alert.alert("Permission Denied", "We need permission to access your camera and gallery.");
        return;
      }

      let result;
      if (type === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while selecting the image.");
      console.error(error);
    }
  };

  const uploadImageToAPI = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImage,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    setLoading(true);
    setPredictionResult(null);

    try {
      const headers: any = {};
      
      if (userData?._id) {
        headers['x-user-id'] = userData._id;
      }

      const response = await fetch(`${BASE_URL}/images/predicts`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPredictionResult(data);
        if (data.diagnosisId) {
          setDiagnosisId(data.diagnosisId);
        }
      } else {
        Alert.alert("Error", data.message || "An error occurred.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload the image.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatAboutResult = async () => {
    if (!diagnosisId || !userData?._id) {
      Alert.alert("Error", "Cannot start chat without diagnosis data");
      return;
    }

    try {
      // Generate a descriptive title based on the prediction result
      const classification = predictionResult?.prediction?.classification || predictionResult?.classification || "Diagnosis";
      const title = `Chat about ${classification} Result`;

      const response = await fetch(`${BASE_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userData._id, // Backend requires userId in headers, not body
        },
        body: JSON.stringify({
          diagnosisId: diagnosisId,
          title: title,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // @ts-ignore
        navigation.navigate("ChatConversation", {
          conversationId: data._id,
          title: data.title || title,
        });
      } else {
        Alert.alert("Error", data.message || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", "Failed to start chat");
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPredictionResult(null);
    setDiagnosisId(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Disease Diagnosis</Text>
          <Text style={styles.headerSubtitle}>Upload an image for analysis</Text>
        </View>

        {!selectedImage && !predictionResult && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleImagePick("camera")}
            >
              <Ionicons name="camera" size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleImagePick("gallery")}
            >
              <Ionicons name="images" size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            
            {!predictionResult && (
              <View style={styles.uploadButtonContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#259D8A" />
                    <Text style={styles.loadingText}>Analyzing image...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.uploadButton}
                      onPress={uploadImageToAPI}
                    >
                      <Text style={styles.uploadButtonText}>Analyze Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleReset}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {predictionResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#259D8A" />
              <Text style={styles.resultTitle}>Analysis Complete</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Classification:</Text>
              <Text style={styles.resultValue}>
                {typeof predictionResult.prediction === 'object' 
                  ? (predictionResult.prediction?.classification || 
                     predictionResult.prediction?.prediction || "N/A")
                  : (predictionResult.classification || predictionResult.prediction || "N/A")}
              </Text>
              
              <Text style={styles.resultLabel}>Confidence:</Text>
              <Text style={styles.resultValue}>
                {(() => {
                  // Extract confidence from prediction result
                  let confidenceValue = null;
                  
                  if (typeof predictionResult.prediction === 'object' && predictionResult.prediction?.prediction) {
                    // prediction.prediction is an array like [0.15, 0.85]
                    const predArray = predictionResult.prediction.prediction;
                    if (Array.isArray(predArray)) {
                      // Get the maximum probability as confidence
                      confidenceValue = Math.max(...predArray);
                    }
                  } else if (predictionResult.confidence) {
                    confidenceValue = predictionResult.confidence;
                  } else if (predictionResult.prediction && Array.isArray(predictionResult.prediction)) {
                    // prediction is directly an array
                    confidenceValue = Math.max(...predictionResult.prediction);
                  }
                  
                  return confidenceValue ? ((confidenceValue * 100).toFixed(2) + '%') : "N/A";
                })()}
              </Text>
            </View>

            {diagnosisId && (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={handleChatAboutResult}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Chat about this result</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.newAnalysisButton}
              onPress={handleReset}
            >
              <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={28} color="#A5A5A5" />
          <Text style={styles.navTextInactive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Vets")}
        >
          <MaterialIcons name="pets" size={28} color="#A5A5A5" />
          <Text style={styles.navTextInactive}>Vets</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Diagnosis")}
        >
          <MaterialIcons name="healing" size={28} color="#259D8A" />
          <Text style={styles.navText}>Diagnosis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
    width: "100%",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#259D8A",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    gap: 20,
    width: "100%",
  },
  actionButton: {
    backgroundColor: "#259D8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  imageContainer: {
    alignItems: "center",
    width: "100%",
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadButtonContainer: {
    width: "100%",
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#259D8A",
  },
  uploadButton: {
    backgroundColor: "#259D8A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F2F2F2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    alignItems: "center",
    width: "100%",
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  resultLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
    marginTop: 12,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  chatButton: {
    backgroundColor: "#259D8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    width: "100%",
    marginBottom: 12,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  newAnalysisButton: {
    backgroundColor: "#F2F2F2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  newAnalysisButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#259D8A",
    marginTop: 5,
  },
  navTextInactive: {
    fontSize: 12,
    color: "#A5A5A5",
    marginTop: 5,
  },
});

export default DiagnosticScreen;
