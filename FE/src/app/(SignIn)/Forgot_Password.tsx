import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { SafeAreaView } from 'react-native-safe-area-context';
import mainStyles from '@/src/styles/mainStyle';
import { User } from '../../../models/types';
import { getUserByEmail, getAllUsers } from '../../../QuanLyTaiChinh-backend/userServices';

export default function AccountSelectionScreen() {
  const [email, setEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Tìm kiếm tài khoản theo email
  const searchAccounts = async (searchEmail: string) => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      let results: User[] = [];

      try {
        // Tìm kiếm chính xác theo email
        const exactMatchResponse = await getUserByEmail(searchEmail);
        
        if (exactMatchResponse) {
          // Xử lý trường hợp trả về là User hoặc User[]
          if (Array.isArray(exactMatchResponse)) {
            results = exactMatchResponse as User[];
          } else {
            results = [exactMatchResponse as User];
          }
        } else {
          // Nếu không có exact match, tìm kiếm gần đúng
          const allUsersResponse = await getAllUsers();
          const allUsers = Array.isArray(allUsersResponse) ? allUsersResponse as User[] : [];
          results = allUsers.filter((user: User) => 
            user.email && user.email.toLowerCase().includes(searchEmail.toLowerCase())
          );
        }
      } catch (exactMatchError) {
        // Nếu getUserByEmail thất bại, thử tìm kiếm gần đúng
        console.log('Exact match failed, trying fuzzy search');
        try {
          const allUsersResponse = await getAllUsers();
          const allUsers = Array.isArray(allUsersResponse) ? allUsersResponse as User[] : [];
          results = allUsers.filter((user: User) => 
            user.email && user.email.toLowerCase().includes(searchEmail.toLowerCase())
          );
        } catch (fuzzySearchError) {
          console.error('Fuzzy search also failed:', fuzzySearchError);
          results = [];
        }
      }
      
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching accounts:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm tài khoản. Vui lòng thử lại.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search để tránh gọi API quá nhiều
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchAccounts(email);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [email]);

  // Chọn tài khoản để thay đổi mật khẩu
  const selectAccount = (user: User) => {
    setSelectedUser(user);
    Alert.alert(
      'Xác nhận',
      `Bạn có muốn thay đổi mật khẩu cho tài khoản:\n${user.email}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: () => proceedToPasswordReset(user) }
      ]
    );
  };

  const proceedToPasswordReset = (user: User) => {
    // Lưu thông tin user đã chọn và chuyển sang màn hình tiếp theo
    console.log('Selected user for password reset:', user);
    // Có thể lưu vào AsyncStorage hoặc context để sử dụng ở màn hình tiếp theo
    // Chuyển sang màn hình Security_Pin hoặc màn hình nhập mật khẩu mới
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => selectAccount(item)}
    >
      <View style={styles.userInfo}>
        <FontAwesome name="user-circle" size={24} color="#3887FE" />
        <View style={styles.userDetails}>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.name && <Text style={styles.userName}>{item.name}</Text>}
          {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
        </View>
      </View>
      <FontAwesome name="chevron-right" size={16} color="#A0AFC0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={mainStyles.container}>
      <View style={mainStyles.topSheet}/>
      <View style={mainStyles.bottomeSheet}>
        <Text style={styles.title}>Tìm tài khoản</Text>
        <Text style={styles.desc}>
          Nhập email để tìm kiếm tài khoản cần thay đổi mật khẩu
        </Text>

        <Text style={[styles.label, { marginTop: 32 }]}>Nhập email:</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="example@example.com"
            placeholderTextColor="#A0AFC0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {isSearching && (
            <FontAwesome 
              name="spinner" 
              size={20} 
              color="#3887FE" 
              style={styles.searchIcon}
            />
          )}
        </View>

        {showResults && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Tìm thấy {searchResults.length} tài khoản:
            </Text>
            
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id?.toString() || item.email}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <FontAwesome name="user-times" size={48} color="#A0AFC0" />
                <Text style={styles.noResultsText}>
                  Không tìm thấy tài khoản nào với email này
                </Text>
                <Text style={styles.noResultsSubText}>
                  Vui lòng kiểm tra lại email hoặc thử email khác
                </Text>
              </View>
            )}
          </View>
        )}

        {!showResults && (
          <View style={styles.instructionContainer}>
            <FontAwesome name="search" size={48} color="#A0AFC0" />
            <Text style={styles.instructionText}>
              Nhập email để bắt đầu tìm kiếm
            </Text>
          </View>
        )}

        <View style={styles.bottomContainer}>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.backBtn}>
              <FontAwesome name="arrow-left" size={16} color="#3887FE" />
              <Text style={styles.backBtnText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { 
    color: '#222', 
    fontWeight: 'bold', 
    fontSize: 18, 
    alignSelf: 'flex-start', 
    marginBottom: 8, 
    marginTop: 16, 
    fontFamily: 'Montserrat' 
  },
  desc: { 
    color: '#666', 
    fontSize: 14, 
    alignSelf: 'flex-start', 
    fontFamily: 'Montserrat',
    marginBottom: 8
  },
  label: { 
    alignSelf: 'flex-start', 
    color: '#000', 
    fontWeight: '500', 
    marginTop: 12, 
    marginBottom: 8, 
    fontFamily: 'Montserrat' 
  },
  searchContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#D6EAF8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: '100%',
    paddingRight: 50,
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  resultsList: {
    flex: 1,
    width: '100%',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'Montserrat',
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Montserrat',
  },
  userPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
    fontFamily: 'Montserrat',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Montserrat',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  instructionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Montserrat',
  },
  bottomContainer: {
    width: '100%',
    paddingTop: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3887FE',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: {
    color: '#3887FE',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
});