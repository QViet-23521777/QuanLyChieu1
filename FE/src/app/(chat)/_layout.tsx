import { Stack } from 'expo-router';

const ChatLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Ẩn tất cả header trong chat group
            }}>
            <Stack.Screen 
                name='chatscreen' 
                options={{ 
                    headerShown: false // Đảm bảo chatscreen không có header
                }} 
            />
        </Stack>
    );
};

export default ChatLayout;