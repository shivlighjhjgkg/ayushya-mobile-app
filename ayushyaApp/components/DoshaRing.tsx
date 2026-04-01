// components/DoshaRing.tsx
// requires: npx expo install react-native-svg
import Svg, { Circle } from 'react-native-svg';

interface DoshaRingProps {
  vata: number;
  pitta: number;
  kapha: number;
  size?: number;
  stroke?: number;
}

export default function DoshaRing({ vata, pitta, kapha, size = 180, stroke = 20 }: DoshaRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gap = 4;
  const vA = (vata / 100) * circ;
  const pA = (pitta / 100) * circ;
  const kA = (kapha / 100) * circ;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8df" strokeWidth={stroke} />
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#4a9b5f" strokeWidth={stroke}
        strokeDasharray={`${kA - gap} ${circ - kA + gap}`} strokeLinecap="round" />
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0b930" strokeWidth={stroke}
        strokeDasharray={`${pA - gap} ${circ - pA + gap}`} strokeDashoffset={-kA} strokeLinecap="round" />
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8763a" strokeWidth={stroke}
        strokeDasharray={`${vA - gap} ${circ - vA + gap}`} strokeDashoffset={-(kA + pA)} strokeLinecap="round" />
    </Svg>
  );
}