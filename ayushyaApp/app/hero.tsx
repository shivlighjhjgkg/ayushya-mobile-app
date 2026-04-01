// app/hero.tsx
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <SafeAreaView style={styles.hero}>
      <View style={styles.content}>

        <View style={styles.logoWrap}>
          <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
            <Path
              d="M28 8 C28 8 16 18 12 30 C10 36 14 42 20 44 C22 44.5 24 44.8 26 44.9 L26 28 C26 26 27 24 28 22 C29 24 30 26 30 28 L30 44.9 C32 44.8 34 44.5 36 44 C42 42 46 36 44 30 C40 18 28 8 28 8Z"
              fill="white"
              opacity={0.9}
            />
            <Path
              d="M28 14 C28 14 20 22 18 30 C17 33.5 19 37 22 38.5 L22 28 C22 26.5 24.5 23 28 20 C31.5 23 34 26.5 34 28 L34 38.5 C37 37 39 33.5 38 30 C36 22 28 14 28 14Z"
              fill="white"
              opacity={0.6}
            />
          </Svg>
        </View>

        <Text style={styles.title}>Ayushya</Text>
        <Text style={styles.tagline}>
          Personalized Ayurvedic nutrition rooted in your unique dosha, adapted to your climate, season, and lifestyle.
        </Text>

        <View style={styles.pillsRow}>
          {[['🌿', 'Dosha Profiling'], ['📋', 'Weekly Meal Plans'], ['🌬️', 'AQI Route Finder'], ['📝', 'Satmya Logging']].map(([icon, label]) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{icon} {label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onStart}>
          <Text style={styles.btnText}>Begin Your Journey</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: {
    color: '#2d6a4f',
    fontSize: 16,
    fontWeight: '700',
  },
});