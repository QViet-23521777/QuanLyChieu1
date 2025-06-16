import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";
import { Account, User } from "@/models/types";
import { 
    getAccountByUserId, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    listenToUserAccounts 
} from "@/QuanLyTaiChinh-backend/accountServices";
import { getUserById } from "@/QuanLyTaiChinh-backend/userServices";
import { deleteAccountWithTransactions } from "@/QuanLyTaiChinh-backend/transactionServices";

const ACCOUNT_TYPES = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank', label: 'Ngân hàng' },
    { value: 'credit', label: 'Thẻ tín dụng' },
    { value: 'saving', label: 'Tiết kiệm' },
    { value: 'others', label: 'Khác' }
];

export default function AccountScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        type: 'cash' as Account['type'],
        balance: '',
        initialBalance: '',
        currency: 'VND',
        isActive: true
    });

    // Load user data and accounts
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const id = await AsyncStorage.getItem('userId');
                
                if (id) {
                    setUserId(id);
                    
                    // Load user info
                    const userData = await getUserById(id);
                    if (userData) {
                        setUser(userData);
                    }
                    
                    // Load accounts
                    await loadAccounts(id);
                    
                    // Setup real-time listener
                    const unsubscribe = listenToUserAccounts(id, (updatedAccounts) => {
                        setAccounts(updatedAccounts);
                    });
                    
                    // return () => {
                    //     if (unsubscribe) unsubscribe();
                    // };
                }
            } catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Lỗi', 'Không thể tải dữ liệu tài khoản');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const loadAccounts = async (userIdParam: string) => {
        try {
            const userAccounts = await getAccountByUserId(userIdParam);
            if (userAccounts && Array.isArray(userAccounts)) {
                setAccounts(userAccounts);
            } else {
                setAccounts([]);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            setAccounts([]);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'cash',
            balance: '',
            initialBalance: '',
            currency: 'VND',
            isActive: true
        });
    };

    const handleAddAccount = () => {
        if (!userId || !user) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
            return;
        }

        if (!formData.name || !formData.name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên tài khoản');
            return;
        }

        const balance = parseFloat(formData.balance) || 0;
        const initialBalance = parseFloat(formData.initialBalance) || balance;
        const typeLabel = getTypeLabel(formData.type);

        // Hiển thị dialog xác nhận
        Alert.alert(
            'Xác nhận thêm tài khoản',
            `Bạn có chắc chắn muốn thêm tài khoản với thông tin sau?\n\n` +
            `Tên: ${formData.name.trim()}\n` +
            `Loại: ${typeLabel}\n` +
            `Số dư hiện tại: ${formatCurrency(balance, formData.currency)}\n` +
            `Số dư ban đầu: ${formatCurrency(initialBalance, formData.currency)}\n` +
            `Trạng thái: ${formData.isActive ? 'Hoạt động' : 'Không hoạt động'}`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            const accountData = {
                                name: formData.name.trim(),
                                type: formData.type,
                                balance: balance,
                                initialBalance: initialBalance,
                                currency: formData.currency || 'VND',
                                userId: userId,
                                familyId: user.familyId || '',
                                isActive: formData.isActive
                            };

                            await addAccount(accountData);
                            Alert.alert('Thành công', 'Đã thêm tài khoản mới');
                            setModalVisible(false);
                            resetForm();
                        } catch (error) {
                            console.error('Error adding account:', error);
                            Alert.alert('Lỗi', 'Không thể thêm tài khoản');
                        }
                    }
                }
            ]
        );
    };

    const handleEditAccount = (account: Account) => {
        setSelectedAccount(account);
        setFormData({
            name: account.name || '',
            type: account.type || 'cash',
            balance: (account.balance || 0).toString(),
            initialBalance: (account.initialBalance || 0).toString(),
            currency: account.currency || 'VND',
            isActive: account.isActive !== false
        });
        setEditModalVisible(true);
    };

    const handleUpdateAccount = () => {
    if (!selectedAccount) return;

    if (!formData.name || !formData.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên tài khoản');
        return;
    }

    const balance = parseFloat(formData.balance) || 0;
    const initialBalance = parseFloat(formData.initialBalance) || 0;
    const typeLabel = getTypeLabel(formData.type);

    // Hiển thị dialog xác nhận
    Alert.alert(
        'Xác nhận cập nhật tài khoản',
        `Bạn có chắc chắn muốn cập nhật tài khoản "${selectedAccount.name || 'Không tên'}" với thông tin sau?\n\n` +
        `Tên mới: ${formData.name.trim()}\n` +
        `Loại: ${typeLabel}\n` +
        `Số dư hiện tại: ${formatCurrency(balance, formData.currency)}\n` +
        `Số dư ban đầu: ${formatCurrency(initialBalance, formData.currency)}\n` +
        `Trạng thái: ${formData.isActive ? 'Hoạt động' : 'Không hoạt động'}`,
        [
            {
                text: 'Hủy',
                style: 'cancel'
            },
            {
                text: 'Xác nhận',
                onPress: async () => {
                    try {
                        // Kiểm tra và validate các giá trị
                        const accountId = selectedAccount.id;
                        const currentUserId = userId;

                        if (!accountId) {
                            throw new Error('ID tài khoản không hợp lệ');
                        }

                        if (!currentUserId) {
                            throw new Error('ID người dùng không hợp lệ');
                        }

                        // Kiểm tra kiểu dữ liệu
                        if (typeof accountId !== 'string' || accountId.trim() === '') {
                            throw new Error('ID tài khoản phải là chuỗi hợp lệ');
                        }

                        if (typeof currentUserId !== 'string' || currentUserId.trim() === '') {
                            throw new Error('ID người dùng phải là chuỗi hợp lệ');
                        }

                        console.log('Updating account with ID:', accountId);
                        console.log('User ID:', currentUserId);

                        const updateData = {
                            name: formData.name.trim(),
                            type: formData.type,
                            balance: balance,
                            initialBalance: initialBalance,
                            currency: formData.currency || 'VND',
                            isActive: formData.isActive
                        };

                        // Cập nhật tài khoản trước
                        await updateAccount(accountId, updateData);
                        console.log('Account updated successfully');

                        // Sau đó xóa các giao dịch liên quan (với kiểm tra bổ sung)
                        try {
                            console.log('Attempting to delete transactions for account:', accountId, 'user:', currentUserId);
                            await deleteAccountWithTransactions(accountId.trim(), currentUserId.trim());
                            console.log('Transactions deleted successfully');
                        } catch (transactionError) {
                            console.warn('Could not delete transactions:', transactionError);
                            // Không throw error ở đây, chỉ log warning
                            // Vì tài khoản đã được cập nhật thành công
                        }

                        Alert.alert('Thành công', 'Đã cập nhật tài khoản');
                        setEditModalVisible(false);
                        setSelectedAccount(null);
                        resetForm();
                    } catch (error) {
                        console.error('Error updating account:', error);

                        let errorMessage = 'Lỗi không xác định';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        } else if (typeof error === 'string') {
                            errorMessage = error;
                        }

                        Alert.alert('Lỗi', `Không thể cập nhật tài khoản: ${errorMessage}`);
                    }
                }
            }
        ]
    );
};

    const handleDeleteAccount = (account: Account) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa tài khoản "${account.name || 'Không tên'}"?\n\nLưu ý: Tất cả giao dịch liên quan đến tài khoản này cũng sẽ bị xóa.`,
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Xóa', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Kiểm tra các giá trị trước khi xóa
                            if (!account.id || !userId) {
                                throw new Error('Thiếu thông tin tài khoản hoặc người dùng');
                            }

                            // Xóa tài khoản cùng với các giao dịch liên quan
                            await deleteAccountWithTransactions(account.id, userId);
                            
                            Alert.alert('Thành công', 'Đã xóa tài khoản và các giao dịch liên quan');
                        } catch (error) {
                            console.error('Error deleting account:', error);

                            let errorMessage = 'Lỗi không xác định';
                            if (error instanceof Error) {
                                errorMessage = error.message;
                            } else if (typeof error === 'string') {
                                errorMessage = error;
                            }

                            Alert.alert('Lỗi', `Không thể xóa tài khoản: ${errorMessage}`);
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount: number, currency: string = 'VND') => {
        // Kiểm tra giá trị đầu vào
        if (typeof amount !== 'number' || isNaN(amount)) {
            amount = 0;
        }
        if (!currency || typeof currency !== 'string') {
            currency = 'VND';
        }
        
        return `${amount.toLocaleString('vi-VN')} ${currency}`;
    };

    const getTypeLabel = (type: Account['type']) => {
        if (!type) return 'Không xác định';
        const foundType = ACCOUNT_TYPES.find(t => t.value === type);
        return foundType ? foundType.label : (type || 'Không xác định');
    };

    const renderAccountItem = ({ item }: { item: Account }) => (
        <View style={styles.accountItem}>
            <View style={styles.accountHeader}>
                <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{item.name || 'Tên không xác định'}</Text>
                    <Text style={styles.accountType}>{getTypeLabel(item.type)}</Text>
                </View>
                <View style={styles.accountActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditAccount(item)}>
                        <Ionicons name="create-outline" size={20} color="#4DB6FF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteAccount(item)}>
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.accountDetails}>
                <Text style={styles.balanceLabel}>Số dư hiện tại:</Text>
                <Text style={[styles.balance, { color: (item.balance || 0) >= 0 ? '#4CAF50' : '#FF6B6B' }]}>
                    {formatCurrency(item.balance || 0, item.currency)}
                </Text>
            </View>
            <View style={styles.accountDetails}>
                <Text style={styles.balanceLabel}>Số dư ban đầu:</Text>
                <Text style={styles.initialBalance}>
                    {formatCurrency(item.initialBalance || 0, item.currency)}
                </Text>
            </View>
            <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#4CAF50' : '#FF6B6B' }]}>
                    <Text style={styles.statusText}>
                        {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderFormModal = (isEdit: boolean) => (
        <Modal
            visible={isEdit ? editModalVisible : modalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => {
                if (isEdit) {
                    setEditModalVisible(false);
                    setSelectedAccount(null);
                } else {
                    setModalVisible(false);
                }
                resetForm();
            }}>
            <View style={styles.modalOverlay}>
                <View style={styles.formModal}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>
                            {isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                        </Text>
                        
                        <Text style={styles.inputLabel}>Tên tài khoản *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.name}
                            onChangeText={(text) => setFormData({...formData, name: text || ''})}
                            placeholder="Nhập tên tài khoản"
                        />

                        <Text style={styles.inputLabel}>Loại tài khoản</Text>
                        <View style={styles.typeSelector}>
                            {ACCOUNT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeOption,
                                        formData.type === type.value && styles.typeOptionSelected
                                    ]}
                                    onPress={() => setFormData({...formData, type: type.value as Account['type']})}>
                                    <Text style={[
                                        styles.typeOptionText,
                                        formData.type === type.value && styles.typeOptionTextSelected
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Số dư hiện tại</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.balance}
                            onChangeText={(text) => setFormData({...formData, balance: text || '0'})}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Số dư ban đầu</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.initialBalance}
                            onChangeText={(text) => setFormData({...formData, initialBalance: text || '0'})}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Đơn vị tiền tệ</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.currency}
                            onChangeText={(text) => setFormData({...formData, currency: text || 'VND'})}
                            placeholder="VND"
                        />

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setFormData({...formData, isActive: !formData.isActive})}>
                            <View style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}>
                                {formData.isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>Tài khoản hoạt động</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={isEdit ? handleUpdateAccount : handleAddAccount}>
                            <Text style={styles.submitButtonText}>
                                {isEdit ? 'Cập nhật' : 'Thêm tài khoản'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                if (isEdit) {
                                    setEditModalVisible(false);
                                    setSelectedAccount(null);
                                } else {
                                    setModalVisible(false);
                                }
                                resetForm();
                            }}>
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaView style={mainStyles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { alignItems: "center" }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.header}>Tài Khoản Tiền</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </SafeAreaView>

            <View style={mainStyles.bottomeSheet}>
                {accounts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="wallet-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Chưa có tài khoản nào</Text>
                        <Text style={styles.emptySubText}>Nhấn nút + để thêm tài khoản mới</Text>
                    </View>
                ) : (
                    <FlatList
                        data={accounts}
                        renderItem={renderAccountItem}
                        keyExtractor={(item) => item.id || Math.random().toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>

            {renderFormModal(false)}
            {renderFormModal(true)}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
        fontFamily: "Montserrat_700Bold",
    },
    backButton: {
        position: 'absolute',
        left: 24,
        top: 0,
        padding: 8,
    },
    addButton: {
        position: 'absolute',
        right: 24,
        top: 0,
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    listContainer: {
        paddingVertical: 16,
    },
    accountItem: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    accountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    accountType: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    accountActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    accountDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#666',
    },
    balance: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    initialBalance: {
        fontSize: 14,
        color: '#333',
    },
    statusContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
    },
    typeOptionSelected: {
        backgroundColor: '#4DB6FF',
        borderColor: '#4DB6FF',
    },
    typeOptionText: {
        fontSize: 14,
        color: '#666',
    },
    typeOptionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4DB6FF',
        borderColor: '#4DB6FF',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4DB6FF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
});