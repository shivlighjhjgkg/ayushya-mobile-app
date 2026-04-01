// app/_layout.tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '../utils/authContext.tsx';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}