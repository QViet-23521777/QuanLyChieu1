import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
    useFonts,
    Montserrat_400Regular,
    Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mainStyles from "@/src/styles/mainStyle";
import { register } from "@/QuanLyTaiChinh-backend/userServices";
import { User } from "@/models/types";

export default function CreateAccountScreen() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        rePassword: "",
    });
    
    // Error states
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        rePassword: "",
    });

    let [fontsLoaded] = useFonts({
        Montserrat_400Regular,
        Montserrat_700Bold,
    });

    // Validation functions
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone.replace(/\s/g, ""));
    };

    const validatePassword = (password: string): boolean => {
        return password.length >= 6;
    };

    // Handle input change
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors = {
            name: "",
            email: "",
            phone: "",
            password: "",
            rePassword: "",
        };

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Tên đầy đủ không được để trống";
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email không được để trống";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        // Validate phone
        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống";
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = "Mật khẩu không được để trống";
        } else if (!validatePassword(formData.password)) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        // Validate re-password
        if (!formData.rePassword) {
            newErrors.rePassword = "Vui lòng nhập lại mật khẩu";
        } else if (formData.password !== formData.rePassword) {
            newErrors.rePassword = "Mật khẩu nhập lại không khớp";
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === "");
    };

    // Handle registration
    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const userData: Omit<User,  'id'|  'createdAt' | 'updatedAt'> = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.replace(/\s/g, ""),
                password: formData.password,
                familyId: null, // Will be set later when user joins/creates a family
                role: 'member', // Default role
            };

            const userId = await register(userData);
            
            // Save user ID to AsyncStorage for auto-login
            await AsyncStorage.setItem("userId", userId);
            
            Alert.alert(
                "Thành công", 
                "Đăng ký tài khoản thành công!",
                [
                    {
                        text: "OK",
                    }
                ]
            );
        } catch (error: any) {
            console.error("Lỗi đăng ký:", error);
            Alert.alert(
                "Lỗi đăng ký", 
                error.message || "Có lỗi xảy ra. Vui lòng thử lại!"
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
            <View style={mainStyles.bottomeSheet}>
                <ScrollView
                    contentContainerStyle={{ alignItems: "center" }}
                    showsVerticalScrollIndicator={false}>
                    
                    <Text style={styles.label}>Tên đầy đủ</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        placeholder="Nhập tên đầy đủ"
                        placeholderTextColor="#A0AFC0"
                        value={formData.name}
                        onChangeText={(text) => handleInputChange("name", text)}
                        editable={!isLoading}
                    />
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                    
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="example@example.com"
                        placeholderTextColor="#A0AFC0"
                        value={formData.email}
                        onChangeText={(text) => handleInputChange("email", text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        placeholder="0123 456 789"
                        placeholderTextColor="#A0AFC0"
                        value={formData.phone}
                        onChangeText={(text) => handleInputChange("phone", text)}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                    />
                    {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                    
                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
                            placeholder="••••••••"
                            placeholderTextColor="#A0AFC0"
                            secureTextEntry={!showPassword}
                            value={formData.password}
                            onChangeText={(text) => handleInputChange("password", text)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((v) => !v)}
                            disabled={isLoading}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#A0AFC0"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                    
                    <Text style={styles.label}>Nhập lại mật khẩu</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }, errors.rePassword && styles.inputError]}
                            placeholder="••••••••"
                            placeholderTextColor="#A0AFC0"
                            secureTextEntry={!showRePassword}
                            value={formData.rePassword}
                            onChangeText={(text) => handleInputChange("rePassword", text)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowRePassword((v) => !v)}
                            disabled={isLoading}>
                            <Ionicons
                                name={showRePassword ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#A0AFC0"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.rePassword ? <Text style={styles.errorText}>{errors.rePassword}</Text> : null}
                    
                    <Text style={styles.terms}>
                        Bằng việc tiếp tục, bạn chấp nhận{"\n"}
                        <Text style={styles.termsLink}>Điều khoản sử dụng</Text>{" "}
                        và{" "}
                        <Text style={styles.termsLink}>Chính sách quyền riêng tư</Text>.
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.registerBtn, isLoading && styles.disabledBtn]} 
                        onPress={handleRegister}
                        disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#222" />
                        ) : (
                            <Text style={styles.registerBtnText}>Đăng Ký</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={styles.bottomRow}>
                        <Text style={styles.bottomText}>Đã có tài khoản? </Text>
                        <Link href="/" style={styles.loginLink}>
                            Đăng nhập
                        </Link>
                    </View>
                </ScrollView>
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#97A2FF", alignItems: "center" },
    topBackground: {
        width: "100%",
        height: 100,
        backgroundColor: "#97A2FF",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 12,
    },
    header: { 
        color: "#fff", 
        fontSize: 24, 
        fontWeight: "bold", 
        marginTop: 40,
        fontFamily: "Montserrat_700Bold",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 40,
        width: "100%",
        height: "100%",
        padding: 24,
        alignItems: "center",
        marginTop: 24,
    },
    label: {
        alignSelf: "flex-start",
        color: "#222",
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 4,
        fontFamily: "Montserrat_700Bold",
    },
    input: {
        backgroundColor: "#D6EAF8",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        width: "100%",
        marginBottom: 4,
        fontFamily: "Montserrat_400Regular",
    },
    inputError: {
        borderWidth: 1,
        borderColor: "#FF6B6B",
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 12,
        alignSelf: "flex-start",
        marginBottom: 8,
        fontFamily: "Montserrat_400Regular",
    },
    passwordRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        width: "100%",
        marginBottom: 4,
    },
    terms: {
        color: "#222",
        fontSize: 13,
        textAlign: "center",
        marginVertical: 16,
        fontFamily: "Montserrat_400Regular",
    },
    termsLink: { 
        color: "#4A90E2", 
        textDecorationLine: "underline",
        fontFamily: "Montserrat_700Bold",
    },
    registerBtn: {
        backgroundColor: "#B9CFFF",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 32,
        marginTop: 8,
        marginBottom: 8,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        height: 48,
    },
    registerBtnText: { 
        color: "#222", 
        fontWeight: "bold", 
        fontSize: 18,
        fontFamily: "Montserrat_700Bold",
    },
    disabledBtn: {
        opacity: 0.6,
    },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    bottomText: { 
        color: "#222", 
        fontSize: 15,
        fontFamily: "Montserrat_400Regular",
    },
    loginLink: {
        color: "#4A90E2",
        fontWeight: "bold",
        fontSize: 15,
        textDecorationLine: "underline",
        fontFamily: "Montserrat_700Bold",
    },
});