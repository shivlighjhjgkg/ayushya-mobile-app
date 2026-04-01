// utils/doshaCalc.ts
// ✅ No changes needed — pure logic, works in both web and RN
export function calculateDosha(answers: Record<string, number>) {
  let vata = 0, pitta = 0, kapha = 0;

  Object.values(answers).forEach((a) => {
    if (a === 0) vata++;
    else if (a === 1) pitta++;
    else kapha++;
  });

  const total = vata + pitta + kapha;

  return {
    vata: Math.round((vata / total) * 100),
    pitta: Math.round((pitta / total) * 100),
    kapha: Math.round((kapha / total) * 100),
  };
}

export function getDominantDosha(dosha: { vata: number; pitta: number; kapha: number }): string {
  if (dosha.vata >= dosha.pitta && dosha.vata >= dosha.kapha) return 'Vata';
  if (dosha.pitta >= dosha.kapha) return 'Pitta';
  return 'Kapha';
}

export const DOSHA_INFO: Record<string, { emoji: string; text: string }> = {
  Vata: {
    emoji: '💨',
    text: 'Your energy is movement and flow. Warm, grounding foods like ghee, cooked grains, and root vegetables will keep you balanced.',
  },
  Pitta: {
    emoji: '🔥',
    text: 'Your energy is transformation. Cool, sweet foods like coconut, rice, and leafy greens bring harmony.',
  },
  Kapha: {
    emoji: '🌊',
    text: 'Your energy is structure. Light, warming foods like ginger, legumes, and bitter greens keep things moving.',
  },
};