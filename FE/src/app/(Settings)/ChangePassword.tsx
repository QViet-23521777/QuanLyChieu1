import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SettingTemplate from "@/src/Components/SettingTemplate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";
import { User } from "@/models/types";
import { getUserById, updateUser } from "@/QuanLyTaiChinh-backend/userServices";

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    
    // State để hiển thị/ẩn mật khẩu
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // State loading
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const id = await AsyncStorage.getItem("userId");
                console.log("Fetched userId:", id);
                setUserId(id);
                
                if (id) {
                    const userData = await getUserById(id);
                    setUser(userData);
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin người dùng:", error);
                Alert.alert("Lỗi", "Không thể lấy thông tin người dùng");
            }
        };
        fetchUserData();
    }, []);

    // Hàm kiểm tra tính hợp lệ của mật khẩu
    const validatePassword = (password: string): boolean => {
        // Mật khẩu phải có ít nhất 6 ký tự
        return password.length >= 6;
    };

    // Hàm xử lý thay đổi mật khẩu
    const handleChangePassword = async () => {
        try {
            // Kiểm tra các trường có được điền đầy đủ không
            if (!currentPassword || !newPassword || !confirmPassword) {
                Alert.alert("Lỗi", "Vui lòng điền đầy đủ tất cả các trường");
                return;
            }

            // Kiểm tra mật khẩu hiện tại có đúng không
            if (!user || user.password !== currentPassword) {
                Alert.alert("Lỗi", "Mật khẩu hiện tại không chính xác");
                return;
            }

            // Kiểm tra mật khẩu mới có hợp lệ không
            if (!validatePassword(newPassword)) {
                Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
                return;
            }

            // Kiểm tra mật khẩu mới và xác nhận có khớp không
            if (newPassword !== confirmPassword) {
                Alert.alert("Lỗi", "Mật khẩu mới và xác nhận mật khẩu không khớp");
                return;
            }

            // Kiểm tra mật khẩu mới có khác mật khẩu cũ không
            if (currentPassword === newPassword) {
                Alert.alert("Lỗi", "Mật khẩu mới phải khác mật khẩu hiện tại");
                return;
            }

            setIsLoading(true);

            // Cập nhật mật khẩu
            if (userId) {
                await updateUser(userId, { password: newPassword });
                
                Alert.alert(
                    "Thành công", 
                    "Đổi mật khẩu thành công",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                // Reset form
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                                // Có thể navigate về màn hình trước
                                // navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);
            Alert.alert("Lỗi", "Không thể đổi mật khẩu. Vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
            <View style={mainStyles.bottomeSheet}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mật Khẩu Hiện Tại</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrent}
                            placeholder="●●●●●●●●"
                            placeholderTextColor="#7a8fa6"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowCurrent(!showCurrent)}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={showCurrent ? "eye" : "eye-off"}
                                size={22}
                                color="#7a8fa6"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mật Khẩu Mới</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNew}
                            placeholder="●●●●●●●●"
                            placeholderTextColor="#7a8fa6"
                            editable={!isLoading}
                        />
                        <TouchableOpacity 
                            onPress={() => setShowNew(!showNew)}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={showNew ? "eye" : "eye-off"}
                                size={22}
                                color="#7a8fa6"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nhập Lại Mật Khẩu Mới</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirm}
                            placeholder="●●●●●●●●"
                            placeholderTextColor="#7a8fa6"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirm(!showConfirm)}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={showConfirm ? "eye" : "eye-off"}
                                size={22}
                                color="#7a8fa6"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                    </Text>
                </TouchableOpacity>

                {/* Thông tin hướng dẫn */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        • Mật khẩu phải có ít nhất 6 ký tự
                    </Text>
                    <Text style={styles.infoText}>
                        • Mật khẩu mới phải khác mật khẩu hiện tại
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 15,
        color: "#222",
        fontFamily: "Montserrat_700Bold",
        marginBottom: 6,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D6EAF8",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 2,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: "#222",
        fontFamily: "Montserrat_700Bold",
        paddingVertical: 10,
        letterSpacing: 4,
    },
    button: {
        backgroundColor: "#7EC6FF",
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 18,
        marginBottom: 8,
        alignSelf: "center",
        width: 220,
    },
    buttonDisabled: {
        backgroundColor: "#B0B0B0",
        opacity: 0.7,
    },
    buttonText: {
        color: "#000",
        fontFamily: "Montserrat_700Bold",
        fontSize: 16,
    },
    infoContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    infoText: {
        fontSize: 12,
        color: "#666",
        fontFamily: "Montserrat_400Regular",
        marginBottom: 4,
    },
});