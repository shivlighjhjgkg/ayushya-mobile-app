// utils/constants.ts
// ✅ No changes needed — pure data, works in both web and RN
export const QUIZ_QUESTIONS = [
  { id:1, cat:"Body", q:"How would you describe your build?", opts:["Thin, lean, hard to gain weight","Medium, athletic build","Stocky, sturdy, gains weight easily"] },
  { id:2, cat:"Skin", q:"Your skin is typically…", opts:["Dry, rough, or flaky","Sensitive, prone to rashes","Smooth, oily, or thick"] },
  { id:3, cat:"Digestion", q:"How does your digestion usually behave?", opts:["Irregular — shifts day to day","Strong but can get acidic","Slow and sluggish"] },
  { id:4, cat:"Appetite", q:"Describe your appetite:", opts:["Variable, changes often","Strong and consistent","Low or moderate"] },
  { id:5, cat:"Mind", q:"When stressed, you tend to feel…", opts:["Anxious or restless","Irritable or critical","Withdrawn or indifferent"] },
  { id:6, cat:"Sleep", q:"Your sleep pattern is…", opts:["Light and restless","Short but deep","Long and heavy"] },
  { id:7, cat:"Activity", q:"Which suits you best?", opts:["Walking, yoga, travel","Sports, competition","Routine, gardening, relaxing"] },
  { id:8, cat:"Food", q:"You gravitate toward…", opts:["Warm soups, salty-sweet","Spicy, sour, sharp","Sweet, heavy, comforting"] },
];

export const WEEKLY_GROCERY = ["Rice (basmati)","Ghee","Carrots","Bananas","Fresh ginger","Mung dal","Sesame seeds","Sweet potato","Coconut milk","Turmeric"];

export const WEEKLY_MEALS = [
  { day:"Monday", lunch:"Ghee rice + carrot sabzi + banana", dinner:"Mung dal soup + roti", tags:["Vata-balancing","Warm"] },
  { day:"Tuesday", lunch:"Sweet potato curry + rice", dinner:"Ginger lentil soup", tags:["Grounding","Satmya-match"] },
  { day:"Wednesday", lunch:"Sesame rice + steamed veggies + ghee", dinner:"Banana + warm turmeric milk", tags:["Vata-balancing","Light"] },
  { day:"Thursday", lunch:"Carrot & coconut soup + roti", dinner:"Mung dal + rice", tags:["Warming","Easy digest"] },
  { day:"Friday", lunch:"Ghee rice + banana + dal", dinner:"Sweet potato + ginger chai", tags:["Satmya-match","Grounding"] },
  { day:"Saturday", lunch:"Warm sesame & mung salad + rice", dinner:"Coconut milk khichdi", tags:["Light","Vata-balancing"] },
  { day:"Sunday", lunch:"Full thali: rice, dal, carrot sabzi, roti, banana", dinner:"Turmeric milk + light roti", tags:["Rejuvenating","Full"] },
];

export const FOOD_PAIRS = [
  { good:true, a:"Rice", b:"Ghee", why:"Ghee enhances absorption and calms Vata" },
  { good:true, a:"Turmeric", b:"Black pepper", why:"Pepper boosts turmeric's effect 2000×" },
  { good:true, a:"Mung dal", b:"Ginger", why:"Ginger aids digestion and warms Vata" },
  { good:true, a:"Banana", b:"Cardamom", why:"Cardamom makes banana easier to digest" },
  { good:false, a:"Milk", b:"Honey", why:"Heating honey destroys its benefits — Ayurveda warns against this" },
  { good:false, a:"Fish", b:"Dairy", why:"Opposite-nature foods — increases Ama (toxins)" },
  { good:false, a:"Fruit", b:"Grains", why:"Fruit digests fast; grains slow — causes fermentation" },
  { good:true, a:"Coconut", b:"Lime", why:"Cool + sour balances Pitta beautifully" },
];

export const RISK_FLAGS = [
  { icon:"🔥", title:"Low Agni", sev:"warn", desc:"Weak digestion detected. Avoid raw & cold foods this week. Add ginger to meals." },
  { icon:"💨", title:"Vata Spike", sev:"alert", desc:"Stress + irregular eating aggravated Vata. Prioritise warm, grounding meals." },
  { icon:"✅", title:"Satmya Aligned", sev:"ok", desc:"Recent feedback matches your satmya. Keep up ghee and rice." },
];

export const FAMILY = [
  { name:"You", emoji:"👨", dosha:"Vata 60 · Pitta 25 · Kapha 15", ok:true },
  { name:"Mom", emoji:"👩", dosha:"Kapha 55 · Pitta 30 · Vata 15", ok:false },
  { name:"Dad", emoji:"🧔", dosha:"Pitta 50 · Kapha 35 · Vata 15", ok:true },
];

export const MOCK_ROUTES = [
  { id:1, name:"Cubbon Park Loop", dist:"4.2 km", time:"22 min", avgAqi:38, maxAqi:52, segments:[{name:"MG Road → Cubbon",aqi:42},{name:"Cubbon inner loop",aqi:31},{name:"Cubbon → Back",aqi:41}], bestFor:"cycling" },
  { id:2, name:"Lalbagh Botanical Walk", dist:"3.1 km", time:"18 min", avgAqi:34, maxAqi:45, segments:[{name:"Lalbagh Gate 1 → Rose Garden",aqi:36},{name:"Rose Garden → Glass House",aqi:29},{name:"Glass House → Exit",aqi:37}], bestFor:"jogging" },
  { id:3, name:"Mahadevapura Park Trail", dist:"5.8 km", time:"34 min", avgAqi:55, maxAqi:72, segments:[{name:"Hoodi Junction → Park",aqi:58},{name:"Park trail loop",aqi:49},{name:"Park → Back road",aqi:63}], bestFor:"cycling" },
  { id:4, name:"Yelahanka Lake Path", dist:"2.6 km", time:"15 min", avgAqi:28, maxAqi:39, segments:[{name:"Lake entrance → Walkway",aqi:26},{name:"Lakeside loop",aqi:24},{name:"Walkway → Exit",aqi:34}], bestFor:"jogging" },
];

export const LOG_HISTORY = [
  { meal:"Lunch", food:"Ghee rice + dal", fb:"good" },
  { meal:"Dinner", food:"Mung dal soup", fb:"good" },
  { meal:"Breakfast", food:"Banana + warm milk", fb:"neutral" },
  { meal:"Lunch", food:"Spicy sambar + rice", fb:"bad" },
];

export const NAV = [
  { key:'dash', icon:'🏠', label:'Dashboard' },
  { key:'recs', icon:'📋', label:'Weekly Plan' },
  { key:'satmya', icon:'📝', label:'Daily Log' },
  { key:'pairing', icon:'🥗', label:'Food Pairs' },
  { key:'aqi', icon:'🌬️', label:'AQI Routes' },
  { key:'family', icon:'👪', label:'Family' },
  { key:'more', icon:'⋯', label:'More' },
];