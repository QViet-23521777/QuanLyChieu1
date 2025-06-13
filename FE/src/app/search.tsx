import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
//import { Picker } from '@react-native-picker/picker';

// Import services
import { 
    getTransactionsByDate,
    getTransactionsByMonth,
    getTransactionsByYear,
    getTransactionsByDateRange,
    getTransactionsByUserId,
    getTodayTransactions,
    getCurrentMonthTransactions,
    getCurrentYearTransactions
} from "@/QuanLyTaiChinh-backend/transactionServices";
import { getCategoryById, getAllCategories } from "@/QuanLyTaiChinh-backend/categoryServices";
import { getUserById } from "@/QuanLyTaiChinh-backend/userServices";

// Import types
import { Transaction, Category, User } from "@/models/types";
import mainStyles from "@/src/styles/mainStyle";

interface SearchFilters {
    searchText: string;
    selectedCategoryId: string;
    reportType: 'income' | 'expense' | 'all';
    dateFilter: 'today' | 'thisMonth' | 'thisYear' | 'custom' | 'all';
    customStartDate?: Date;
    customEndDate?: Date;
    selectedDate?: Date;
}

export default function SearchScreen() {
    // States cho user
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    
    // States cho filters
    const [filters, setFilters] = useState<SearchFilters>({
        searchText: '',
        selectedCategoryId: '',
        reportType: 'all',
        dateFilter: 'all'
    });
    
    // States cho data
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    
    // States cho UI
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Lấy thông tin user khi component mount
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

    // Lấy danh sách categories khi có userId
    useEffect(() => {
        const fetchCategories = async () => {
            if (!userId) return;
            
            try {
                const allCategories = await getAllCategories();
                setCategories(allCategories);
            } catch (error) {
                console.error("Lỗi khi lấy danh mục:", error);
            }
        };
        
        fetchCategories();
    }, [userId]);

    // Hàm tìm kiếm chính
    const handleSearch = async () => {
        if (!userId) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
            return;
        }

        setLoading(true);
        try {
            let searchResults: Transaction[] = [];

            // Lọc theo thời gian trước
            switch (filters.dateFilter) {
                case 'today':
                    searchResults = await getTodayTransactions(userId);
                    break;
                case 'thisMonth':
                    searchResults = await getCurrentMonthTransactions(userId);
                    break;
                case 'thisYear':
                    searchResults = await getCurrentYearTransactions(userId);
                    break;
                case 'custom':
                    if (filters.customStartDate && filters.customEndDate) {
                        searchResults = await getTransactionsByDateRange(
                            userId, 
                            filters.customStartDate, 
                            filters.customEndDate
                        );
                    } else if (filters.selectedDate) {
                        searchResults = await getTransactionsByDate(userId, filters.selectedDate);
                    } else {
                        searchResults = await getTransactionsByUserId(userId);
                    }
                    break;
                default:
                    searchResults = await getTransactionsByUserId(userId);
            }

            // Lọc theo loại giao dịch
            if (filters.reportType !== 'all') {
                searchResults = searchResults.filter(transaction => 
                    transaction.type === filters.reportType
                );
            }

            // Lọc theo danh mục
            if (filters.selectedCategoryId) {
                searchResults = searchResults.filter(transaction => 
                    transaction.categoryId === filters.selectedCategoryId
                );
            }

            // Lọc theo text tìm kiếm
            if (filters.searchText.trim()) {
                searchResults = searchResults.filter(transaction =>
                    transaction.decription.toLowerCase().includes(filters.searchText.toLowerCase())
                );
            }

            setFilteredTransactions(searchResults);
            console.log(`Tìm thấy ${searchResults.length} giao dịch`);
            
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi tìm kiếm");
        } finally {
            setLoading(false);
        }
    };

    // Hàm reset filters
    const resetFilters = () => {
        setFilters({
            searchText: '',
            selectedCategoryId: '',
            reportType: 'all',
            dateFilter: 'all'
        });
        setFilteredTransactions([]);
    };

    // Hàm lấy tên category
    const getCategoryName = (categoryId: string): string => {
        const category = categories.find(cat => cat.id === categoryId);
        return category?.name || 'Không xác định';
    };

    // Hàm format số tiền
    const formatAmount = (amount: number): string => {
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    // Hàm format ngày
    const formatDate = (date: any): string => {
        try {
            let dateObj: Date;
            
            if (date?.toDate && typeof date.toDate === 'function') {
                dateObj = date.toDate();
            } else if (date instanceof Date) {
                dateObj = date;
            } else {
                dateObj = new Date(date);
            }
            
            return dateObj.toLocaleDateString('vi-VN');
        } catch (error) {
            return 'Không xác định';
        }
    };

    // Render item giao dịch
    const renderTransactionItem = ({ item }: { item: Transaction }) => (
        <View style={styles.resultItem}>
            <View style={[
                styles.iconBox, 
                { backgroundColor: item.type === 'income' ? '#4CAF50' : '#F44336' }
            ]}>
                <Ionicons
                    name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color="#fff"
                />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>
                    {item.decription || 'Không có mô tả'}
                </Text>
                <Text style={styles.itemCategory}>
                    {getCategoryName(item.categoryId)}
                </Text>
                <Text style={styles.itemTime}>
                    {formatDate(item.date)}
                </Text>
            </View>
            <Text style={[
                styles.amount,
                item.type === 'income' ? styles.green : styles.red
            ]}>
                {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
            </Text>
        </View>
    );

    // Render category picker modal
    const renderCategoryModal = () => (
        <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Chọn danh mục</Text>
                    <FlatList
                        data={[{ id: '', name: 'Tất cả danh mục' }, ...categories]}
                        keyExtractor={(item) => item.id || 'all'}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.categoryItem}
                                onPress={() => {
                                    setFilters(prev => ({ ...prev, selectedCategoryId: item.id }));
                                    setShowCategoryModal(false);
                                }}
                            >
                                <Text style={styles.categoryItemText}>
                                    {item.name || 'Tất cả danh mục'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowCategoryModal(false)}
                    >
                        <Text style={styles.closeButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={mainStyles.container}>
            {/* Header với search */}
            <SafeAreaView style={[mainStyles.topSheet, { padding: 16 }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Tìm kiếm theo mô tả..."
                    value={filters.searchText}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
                />
            </SafeAreaView>

            {/* Filters */}
            <View style={mainStyles.bottomeSheet}>
                {/* Loại danh mục */}
                <Text style={styles.label}>Danh mục</Text>
                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={styles.dropdownText}>
                        {filters.selectedCategoryId 
                            ? getCategoryName(filters.selectedCategoryId)
                            : "Chọn danh mục"
                        }
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#333" />
                </TouchableOpacity>

                {/* Lọc theo thời gian */}
                <Text style={styles.label}>Thời gian</Text>
                <View style={styles.timeFilterContainer}>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'today', label: 'Hôm nay' },
                        { key: 'thisMonth', label: 'Tháng này' },
                        { key: 'thisYear', label: 'Năm này' },
                        { key: 'custom', label: 'Tùy chọn' }
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                styles.timeFilterButton,
                                filters.dateFilter === option.key && styles.timeFilterButtonActive
                            ]}
                            onPress={() => setFilters(prev => ({ 
                                ...prev, 
                                dateFilter: option.key as any 
                            }))}
                        >
                            <Text style={[
                                styles.timeFilterText,
                                filters.dateFilter === option.key && styles.timeFilterTextActive
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom date picker */}
                {filters.dateFilter === 'custom' && (
                    <View style={styles.customDateContainer}>
                        <TouchableOpacity
                            style={styles.datePicker}
                            onPress={() => setShowStartDatePicker(true)}
                        >
                            <Text>
                                Từ: {filters.customStartDate?.toLocaleDateString('vi-VN') || 'Chọn ngày'}
                            </Text>
                            <Ionicons name="calendar" size={20} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.datePicker}
                            onPress={() => setShowEndDatePicker(true)}
                        >
                            <Text>
                                Đến: {filters.customEndDate?.toLocaleDateString('vi-VN') || 'Chọn ngày'}
                            </Text>
                            <Ionicons name="calendar" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loại giao dịch */}
                <Text style={styles.label}>Loại giao dịch</Text>
                <View style={styles.radioGroup}>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'income', label: 'Thu nhập' },
                        { key: 'expense', label: 'Chi tiêu' }
                    ].map((type) => (
                        <TouchableOpacity
                            key={type.key}
                            onPress={() => setFilters(prev => ({ 
                                ...prev, 
                                reportType: type.key as any 
                            }))}
                            style={styles.radioButton}
                        >
                            <View style={[
                                styles.radioCircle,
                                filters.reportType === type.key && styles.radioSelected,
                            ]} />
                            <Text style={styles.radioText}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={resetFilters}
                    >
                        <Text style={styles.resetButtonText}>Đặt lại</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.searchBtn]}
                        onPress={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.searchText}>Tìm kiếm</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results */}
                {filteredTransactions.length > 0 && (
                    <>
                        <Text style={styles.resultHeader}>
                            Tìm thấy {filteredTransactions.length} giao dịch
                        </Text>
                        <FlatList
                            data={filteredTransactions}
                            keyExtractor={(item) => item.Id}
                            style={styles.resultList}
                            renderItem={renderTransactionItem}
                            showsVerticalScrollIndicator={false}
                        />
                    </>
                )}

                {filteredTransactions.length === 0 && !loading && filters.searchText && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Không tìm thấy giao dịch nào</Text>
                    </View>
                )}

                {/* Date Pickers */}
                {showStartDatePicker && (
                    <DateTimePicker
                        value={filters.customStartDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowStartDatePicker(false);
                            if (date) {
                                setFilters(prev => ({ ...prev, customStartDate: date }));
                            }
                        }}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={filters.customEndDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowEndDatePicker(false);
                            if (date) {
                                setFilters(prev => ({ ...prev, customEndDate: date }));
                            }
                        }}
                    />
                )}

                {/* Category Modal */}
                {renderCategoryModal()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        fontSize: 16
    },
    label: { 
        fontWeight: "bold", 
        marginTop: 15, 
        marginBottom: 8,
        fontSize: 16,
        color: "#333"
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    dropdownText: {
        fontSize: 16,
        color: "#333"
    },
    timeFilterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10
    },
    timeFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff'
    },
    timeFilterButtonActive: {
        backgroundColor: '#4c8cf5',
        borderColor: '#4c8cf5'
    },
    timeFilterText: {
        fontSize: 14,
        color: '#666'
    },
    timeFilterTextActive: {
        color: '#fff',
        fontWeight: 'bold'
    },
    customDateContainer: {
        gap: 10,
        marginTop: 10
    },
    datePicker: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#e5e9ff",
        padding: 12,
        borderRadius: 12,
    },
    radioGroup: { 
        flexDirection: "row", 
        marginVertical: 10,
        gap: 15
    },
    radioButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#555",
        marginRight: 8,
    },
    radioSelected: { 
        backgroundColor: "#4c8cf5",
        borderColor: "#4c8cf5"
    },
    radioText: { 
        fontSize: 16,
        color: "#333"
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    resetButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    resetButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 16
    },
    searchBtn: {
        backgroundColor: "#4c8cf5",
    },
    searchText: { 
        fontWeight: "bold", 
        color: "#fff",
        fontSize: 16
    },
    resultHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333'
    },
    resultList: { 
        maxHeight: 400
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        marginVertical: 4,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    iconBox: {
        padding: 12,
        borderRadius: 12,
        marginRight: 15,
    },
    itemInfo: { 
        flex: 1 
    },
    itemTitle: { 
        fontWeight: "bold",
        fontSize: 16,
        color: "#333",
        marginBottom: 4
    },
    itemCategory: {
        fontSize: 14,
        color: "#666",
        marginBottom: 2
    },
    itemTime: { 
        fontSize: 12, 
        color: "#999"
    },
    amount: { 
        fontWeight: "bold", 
        fontSize: 16
    },
    red: { color: "#F44336" },
    green: { color: "#4CAF50" },
    blue: { color: "#2196F3" },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
        textAlign: 'center'
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        maxHeight: '70%',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#333'
    },
    categoryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    categoryItemText: {
        fontSize: 16,
        color: '#333'
    },
    closeButton: {
        backgroundColor: '#4c8cf5',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});