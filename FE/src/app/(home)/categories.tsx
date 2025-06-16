import React, { useState, JSX } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
    MaterialCommunityIcons,
    Entypo,
} from "@expo/vector-icons";
import {
    useFonts,
    Montserrat_700Bold,
    Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useRouter } from "expo-router";
import AddCategoryModal from "@/src/Components/Add_more";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";
import { useCategory } from "@/src/context/categoryContext";
import { addCategory } from "@/src/service/categoryService";

export default function CategoriesScreen() {
    const [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
    });

    const router = useRouter();
    const { categories, loading } = useCategory();
    const [showAddModal, setShowAddModal] = useState(false);

    const iconMap: Record<string, JSX.Element> = {
        "Ăn Uống": (
            <Ionicons name="restaurant-outline" size={36} color="#fff" />
        ),
        "Di Chuyển": (
            <MaterialIcons name="directions-bus" size={36} color="#fff" />
        ),
        "Y Tế": (
            <FontAwesome5 name="briefcase-medical" size={32} color="#fff" />
        ),
        "Mua Sắm": (
            <MaterialCommunityIcons
                name="shopping-outline"
                size={36}
                color="#fff"
            />
        ),
        "Nơi Ở": <Ionicons name="home-outline" size={36} color="#fff" />,
        "Quà Tặng": (
            <MaterialCommunityIcons
                name="gift-outline"
                size={36}
                color="#fff"
            />
        ),
        "Tiết Kiệm": <FontAwesome5 name="piggy-bank" size={32} color="#fff" />,
        "Giải Trí": (
            <MaterialIcons name="sports-esports" size={36} color="#fff" />
        ),
    };

    const navigateToScreen = (label: string) => {
        switch (label) {
            case "Ăn Uống":
                router.push("../Foods");
                break;
            case "Di Chuyển":
                router.push("../Transport");
                break;
            case "Y Tế":
                router.push("../Med");
                break;
            case "Mua Sắm":
                router.push("../Groceries");
                break;
            case "Nơi Ở":
                router.push("../Rent");
                break;
            case "Quà Tặng":
                router.push("../Gift");
                break;
            case "Tiết Kiệm":
                router.push("../Saving");
                break;
            case "Giải Trí":
                router.push("../Entertain");
                break;
            default:
                alert(`Chưa có màn hình cho "${label}"`);
        }
    };

    if (!fontsLoaded || loading) return <Text>Loading...</Text>;

    return (
        <SafeAreaView style={mainStyles.container}>
            <View style={mainStyles.topSheet} />
            <View style={mainStyles.bottomeSheet}>
                <ScrollView contentContainerStyle={styles.grid}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.Id}
                            style={styles.catBtn}
                            onPress={() => navigateToScreen(cat.name || "")}>
                            {iconMap[cat.name || ""] || (
                                <Ionicons
                                    name="apps-outline"
                                    size={36}
                                    color="#fff"
                                />
                            )}
                            <Text style={styles.catLabel}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Nút thêm */}
                    {/* <TouchableOpacity
                        style={styles.catBtn}
                        onPress={() => setShowAddModal(true)}>
                        <Entypo name="plus" size={36} color="#fff" />
                        <Text style={styles.catLabel}>Thêm</Text>
                    </TouchableOpacity> */}
                </ScrollView>
            </View>

            <AddCategoryModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={async (name) => {
                    try {
                        await addCategory(name); // Thêm vào Firestore
                        // await reload();
                    } catch (err) {
                        console.error("Lỗi khi thêm danh mục:", err);
                    }
                    setShowAddModal(false);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
    },
    catBtn: {
        width: 90,
        height: 90,
        backgroundColor: "#7EC6FF",
        borderRadius: 20,
        margin: 8,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    catLabel: {
        color: "#222",
        fontSize: 14,
        marginTop: 8,
        fontFamily: "Montserrat_400Regular",
        textAlign: "center",
    },
});
/* có gì đó đã render tự động tìm kiếm và thay đổi*/ 