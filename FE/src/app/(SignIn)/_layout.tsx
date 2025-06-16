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
                headerShown: false,
                headerTransparent: true,
                // headerLeft: () => <ProfileButton />,
                headerTitleAlign: 'center',
            }}>
            {/* <Stack.Screen name='login' options={{ title: 'Cài đặt' }} /> */}
            <Stack.Screen name='Create_Account' options={{ headerShown: true, title: 'Đăng ký tài khoản' }} />
            <Stack.Screen name='Forgot_Password' options={{ headerShown: true, title: 'Quên mật khẩu' }} />
            <Stack.Screen name='Security_Pin' options={{ headerShown: true, title: 'OTP' }} />
            <Stack.Screen name='New_Password' options={{ headerShown: true, title: 'Mật khẩu mới' }} />
        </Stack>
    </UserProvider>
    )
}

export default RootLayout;