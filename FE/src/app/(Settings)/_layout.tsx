import {Slot, Stack, Tabs} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NotificationButton from "@/src/Components/NotificationButton";
import ProfileButton from "@/src/Components/ProfileButton";
import { UserProvider } from '@/UserContext';
import AddButton from '@/src/Components/AddButton';

const RootLayout = () => {
    return (
    <UserProvider>
        <Stack
            screenOptions={{
                headerTransparent: true,
                // headerLeft: () => <ProfileButton />,
                headerTitleAlign: 'center',
            }}>
            <Stack.Screen name='profile' options={{ headerShown: true, title: 'Tài khoản', headerRight: () => null }} />
            <Stack.Screen name='Settings' options={{ headerShown: true, title: 'Cài đặt' }} />
            <Stack.Screen name='ProfileSetting' options={{ headerShown: true, title: 'Thông tin' }} />
            <Stack.Screen name='Security' options={{ headerShown: true, title: 'Bảo mật' }} />
            <Stack.Screen name='Fingerprint' options={{ headerShown: true, title: 'Dấu vân tay' }} />
            <Stack.Screen name='AddFingerprint' options={{ headerShown: true, title: 'Thêm vân tay' }} />
            <Stack.Screen name='Setting' options={{ headerShown: true, title: 'Cài đặt' }} />
            <Stack.Screen name='NotiSetting' options={{ headerShown: true, title: 'Cài đặt thông báo' }} />
            <Stack.Screen name='ChangePassword' options={{ headerShown: true, title: 'Thay đổi mật khẩu' }} />
            <Stack.Screen name='DeleteAccount' options={{ headerShown: true, title: 'Xóa tài khoản' }} />
            <Stack.Screen name='AISettings' options={{ headerShown: true, title: 'AI ChatBot' }} />
            <Stack.Screen name='TermOfService' options={{ headerShown: true, title: 'Điều khoản sử dụng' }} />
            <Stack.Screen name='Account' options={{headerShown: false}} />
        </Stack>
    </UserProvider>
    )
}

export default RootLayout;