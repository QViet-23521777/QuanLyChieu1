import {Slot, Stack, Tabs} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NotificationButton from "@/src/Components/NotificationButton";
import ProfileButton from "@/src/Components/ProfileButton";
import { CategoryProvider } from '../context/categoryContext';
import { UserProvider } from '@/UserContext';
import AddButton from '@/src/Components/AddButton';

const RootLayout = () => {
    return (
    <UserProvider>

        <CategoryProvider>
            <Stack
                screenOptions={{
                    headerTransparent: true,
                    headerShown: true,
                    title: ' ',
                    // headerLeft: () => <ProfileButton />,
                    headerRight: () => <AddButton />,
                    headerTitleAlign: 'center',
                }}>
                <Stack.Screen name='index' options={{ headerShown: false }} />
                <Stack.Screen name='OnBoarding1' options={{ headerShown: false }} />
                <Stack.Screen name='OnBoarding2' options={{ headerShown: false }} />
                <Stack.Screen name='(SignIn)' options={{ headerShown: false }} />
                <Stack.Screen name='(home)' options={{ headerShown: false }} />
                <Stack.Screen name='(Categories)' options={{ headerShown: false }} />
                <Stack.Screen name='(Settings)' options={{ headerShown: false }} />
                <Stack.Screen name='AddExpense' options={{ headerShown: true, title: 'Thêm', headerRight: () => null }} />
                <Stack.Screen name='notification' options={{ headerShown: true, title: 'Thông báo' }} />
                <Stack.Screen name='search' options={{ headerShown: true, title: 'Tìm kiếm' }} />
                <Stack.Screen name='calendar' options={{ headerShown: true, title: 'Lịch' }} />
                <Stack.Screen name='transfer' options={{ headerShown: true, title: 'Giao dịch' }} />
                <Stack.Screen name='groups' options={{ headerShown: false, title: 'Nhóm', headerRight: () => { return null; } }} />
                <Stack.Screen name='(chat)' options={{ headerShown: false }} />
            </Stack>
        </CategoryProvider>
    </UserProvider>
    )
}

export default RootLayout;