import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mainStyles from "@/src/styles/mainStyle";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserById, updateUser } from "@/QuanLyTaiChinh-backend/userServices";
import { User } from "@/models/types";

export default function ProfileSettingScreen() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [darkTheme, setDarkTheme] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load user data and settings on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const id = await AsyncStorage.getItem("userId");
                console.log("Fetched userId:", id);
                setUserId(id);

                if (id) {
                    const userData = await getUserById(id);
                    
                    // Kiểm tra userData có tồn tại trước khi sử dụng
                    if (userData) {
                        setUser(userData);
                        
                        // Populate form fields with user data
                        setUsername(userData.name || "");
                        setEmail(userData.email || "");
                    } else {
                        console.error("Không tìm thấy dữ liệu người dùng");
                        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
                    }
                }

                // Load app settings from AsyncStorage
                const savedDarkTheme = await AsyncStorage.getItem("darkTheme");
                const savedPushNotifications = await AsyncStorage.getItem("pushNotifications");
                
                if (savedDarkTheme !== null) {
                    setDarkTheme(JSON.parse(savedDarkTheme));
                }
                if (savedPushNotifications !== null) {
                    setPushNotifications(JSON.parse(savedPushNotifications));
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin người dùng:", error);
                Alert.alert("Lỗi", "Không thể lấy thông tin người dùng");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // Validate email format
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Save user settings
    const handleSave = async () => {
        if (!userId) {
            Alert.alert("Lỗi", "Không tìm thấy ID người dùng");
            return;
        }

        // Validation
        if (!username.trim()) {
            Alert.alert("Lỗi", "Tên đăng nhập không được để trống!");
            return;
        }

        if (email && !validateEmail(email)) {
            Alert.alert("Lỗi", "Email không hợp lệ!");
            return;
        }

        try {
            setIsSaving(true);
            
            // Update user profile
            const updateData: Partial<User> = {
                name: username.trim(),
            };
            
            if (email.trim()) {
                updateData.email = email.trim();
            }

            await updateUser(userId, updateData);

            // Save app settings to AsyncStorage
            await AsyncStorage.setItem("darkTheme", JSON.stringify(darkTheme));
            await AsyncStorage.setItem("pushNotifications", JSON.stringify(pushNotifications));

            // Update local user state - Kiểm tra user có tồn tại trước khi cập nhật
            if (user) {
                setUser({
                    ...user,
                    name: username.trim(),
                    email: email.trim() || user.email || "",
                });
            }

            Alert.alert("Thành công", "Đã cập nhật thông tin!");
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin:", error);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại!");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle dark theme toggle
    const handleDarkThemeToggle = async (value: boolean) => {
        setDarkTheme(value);
        try {
            await AsyncStorage.setItem("darkTheme", JSON.stringify(value));
        } catch (error) {
            console.error("Lỗi khi lưu setting dark theme:", error);
        }
    };

    // Handle push notifications toggle
    const handlePushNotificationsToggle = async (value: boolean) => {
        setPushNotifications(value);
        try {
            await AsyncStorage.setItem("pushNotifications", JSON.stringify(value));
        } catch (error) {
            console.error("Lỗi khi lưu setting push notifications:", error);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[mainStyles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#6EB5FF" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { alignItems: "center" }]}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={require("@/assets/images/logo app.png")}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                </View>
                <Text style={styles.name}>{username || user?.name || "Người dùng"}</Text>
            </SafeAreaView>
            <View style={mainStyles.bottomeSheet}>
                <Text style={styles.sectionTitle}>Thông Tin Tài Khoản</Text>
                
                <Text style={styles.label}>Tên Đăng Nhập *</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Nhập tên đăng nhập"
                    placeholderTextColor="#7a8fa6"
                    editable={!isSaving}
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Nhập địa chỉ email"
                    placeholderTextColor="#7a8fa6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSaving}
                />

                <Text style={styles.sectionTitle}>Cài Đặt Ứng Dụng</Text>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Chế độ tối</Text>
                    <Switch
                        value={darkTheme}
                        onValueChange={handleDarkThemeToggle}
                        trackColor={{ false: "#D6EAF8", true: "#6EB5FF" }}
                        thumbColor={darkTheme ? "#fff" : "#fff"}
                        disabled={isSaving}
                    />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Thông báo đẩy</Text>
                    <Switch
                        value={pushNotifications}
                        onValueChange={handlePushNotificationsToggle}
                        trackColor={{ false: "#D6EAF8", true: "#6EB5FF" }}
                        thumbColor={pushNotifications ? "#fff" : "#fff"}
                        disabled={isSaving}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.updateBtn, isSaving && styles.disabledBtn]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.updateBtnText}>Cập Nhật</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#6EB5FF" },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6EB5FF",
        fontFamily: "Montserrat_400Regular",
    },
    topBackground: {
        height: 100,
        backgroundColor: "#6EB5FF",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        paddingBottom: 0,
    },
    backBtn: {
        position: "absolute",
        top: 64,
        left: 24,
        zIndex: 2,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 8,
        marginTop: 40,
        fontFamily: "Montserrat_700Bold",
    },
    avatarContainer: {
        alignItems: "center",
        marginTop: 0,
        marginBottom: 8,
        zIndex: 2,
    },
    avatarWrapper: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        overflow: "hidden",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginTop: 0,
        textAlign: "center",
        fontFamily: "Montserrat_700Bold",
    },
    contentBox: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        flex: 1,
        paddingTop: 32,
        paddingHorizontal: 24,
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 18,
        marginTop: 10,
        fontFamily: "Montserrat_700Bold",
    },
    label: {
        fontSize: 15,
        color: "#000",
        marginBottom: 6,
        fontFamily: "Montserrat_700Bold",
    },
    input: {
        backgroundColor: "#D6EAF8",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 14,
        fontFamily: "Montserrat_400Regular",
        color: "#222",
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    switchLabel: {
        fontSize: 15,
        color: "#000",
        fontFamily: "Montserrat_700Bold",
    },
    updateBtn: {
        backgroundColor: "#6EB5FF",
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
        marginBottom: 8,
        alignSelf: "center",
        width: 200,
        height: 48,
    },
    updateBtnText: {
        color: "#fff",
        fontFamily: "Montserrat_700Bold",
        fontSize: 18,
    },
    disabledBtn: {
        opacity: 0.6,
    },
});