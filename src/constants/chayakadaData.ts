export interface ChayakadaSound {
  id: string;
  name: string;
  malayalam: string;
  description: string;
  icon: string;
  url: string;
  defaultVolume: number;
}

export interface ChayakadaPreset {
  id: string;
  name: string;
  malayalam: string;
  description: string;
  icon: string;
  volumes: Record<string, number>;
}

export const CHAYAKADA_SOUNDS: ChayakadaSound[] = [
  {
    id: 'rain',
    name: 'Monsoon Rain',
    malayalam: 'മഴ',
    description: 'Torrential Kerala rain beating on tin roof',
    icon: 'rainy',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-rain.mp4',
    defaultVolume: 0.7,
  },
  {
    id: 'chatter',
    name: '',
    malayalam: 'ചായ അടി & സംസാരം',
    description: 'Kettle clink, hot chai pouring & cozy chatter',
    icon: 'cafe',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-people.mp4',
    defaultVolume: 0.6,
  },
  {
    id: 'fireplace',
    name: 'Wood Stove',
    malayalam: 'അടുപ്പിലെ തീ',
    description: 'Crackling firewood under the big chai samovar',
    icon: 'flame',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-fire.mp4',
    defaultVolume: 0.5,
  },
  {
    id: 'thunder',
    name: 'Distant Thunder',
    malayalam: 'ഇടിമിന്നൽ',
    description: 'Deep rolling thunder echoing across coconut trees',
    icon: 'flash',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-thunder.mp4',
    defaultVolume: 0.4,
  },
  {
    id: 'crickets',
    name: 'Night Crickets',
    malayalam: 'ചീവീട്',
    description: 'Gentle night chorus from the banana groves',
    icon: 'moon',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-crickets.mp4',
    defaultVolume: 0.5,
  },
  {
    id: 'birds',
    name: 'Morning Birds',
    malayalam: 'പക്ഷികൾ',
    description: 'Morning songbirds welcoming the dawn mist',
    icon: 'leaf',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-birds.mp4',
    defaultVolume: 0.6,
  },
  {
    id: 'wind',
    name: 'Kerala Breeze',
    malayalam: 'കാറ്റ്',
    description: 'Cool monsoon gusts rustling through leaves',
    icon: 'cloud',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-wind.mp4',
    defaultVolume: 0.4,
  },
];

export const CHAYAKADA_PRESETS: ChayakadaPreset[] = [
  {
    id: 'rainy-evening',
    name: 'Rainy Evening',
    malayalam: 'മഴ സന്ധ്യ',
    description: 'Chai inside while it pours outside',
    icon: 'rainy',
    volumes: {
      rain: 0.75,
      thunder: 0.4,
      fireplace: 0.5,
      chatter: 0.35,
      wind: 0.25,
      crickets: 0,
      birds: 0,
    },
  },
  {
    id: 'morning-chai',
    name: 'Chai Time',
    malayalam: 'ചായ സമയം',
    description: 'Morning warmth, birds and fresh tea conversations',
    icon: 'sunny',
    volumes: {
      chatter: 0.7,
      birds: 0.65,
      fireplace: 0.35,
      wind: 0.2,
      rain: 0,
      thunder: 0,
      crickets: 0,
    },
  },
  {
    id: 'study-mode',
    name: 'Study & Focus',
    malayalam: 'പഠനം',
    description: 'Gentle rain, distant hearth and deep concentration',
    icon: 'book',
    volumes: {
      rain: 0.55,
      crickets: 0.35,
      fireplace: 0.3,
      chatter: 0.15,
      wind: 0.15,
      thunder: 0,
      birds: 0,
    },
  },
  {
    id: 'monsoon',
    name: 'Monsoon Floods',
    malayalam: 'മഴക്കാലം',
    description: 'Heavy Edavappathi rain, wind and roaring thunder',
    icon: 'thunderstorm',
    volumes: {
      rain: 0.9,
      thunder: 0.65,
      wind: 0.5,
      crickets: 0.2,
      chatter: 0,
      fireplace: 0.2,
      birds: 0,
    },
  },
  {
    id: 'night-cricket',
    name: 'Silent Night',
    malayalam: 'രാത്രി',
    description: 'Starry Kerala night with crackling stove and crickets',
    icon: 'moon',
    volumes: {
      crickets: 0.75,
      fireplace: 0.45,
      wind: 0.25,
      rain: 0.15,
      chatter: 0,
      thunder: 0,
      birds: 0,
    },
  },
];

export const CHAYAKADA_MENU = [
  { item: 'കട്ടൻ ചായ (Kattan Chaya)', price: '₹5', tag: 'No milk. Pure soul & warm aroma' },
  { item: 'മീറ്റർ ചായ (Meter Paal Chaya)', price: '₹7', tag: 'Rich, frothy & brewed fresh' },
  { item: 'സുലൈമാനി (Sulaimani)', price: '₹6', tag: 'Spiced lemon & cardamom tea' },
  { item: 'പഴംപൊരി (Pazham Pori)', price: '₹8', tag: 'Golden crispy sweet banana fritters' },
  { item: 'പരിപ്പുവട (Parippuvada)', price: '₹6', tag: 'Hot & crunchy spicy dal vadai' },
  { item: 'ഉഴുന്നുവട (Uzhunnu Vada)', price: '₹7', tag: 'Fluffy & crisp savory vada' },
  { item: 'സുഖിയൻ (Sugiyan)', price: '₹7', tag: 'Warm jaggery & sweet payar' },
];

export const BUS_SOUNDS: ChayakadaSound[] = [
  {
    id: 'bus_engine',
    name: 'Bus Engine',
    malayalam: 'ബസ് എൻജിൻ',
    description: 'Steady diesel engine hum of Kerala transport bus',
    icon: 'bus',
    url: 'https://assets.mixkit.co/active_storage/sfx/3031/3031-preview.mp3',
    defaultVolume: 0.7,
  },
  {
    id: 'window_rain',
    name: 'Window Rain',
    malayalam: 'ജനലിലെ മഴ',
    description: 'Rain splashing across the moving window glass',
    icon: 'rainy',
    url: 'https://assets.mixkit.co/active_storage/sfx/2929/2929-preview.mp3',
    defaultVolume: 0.75,
  },
  {
    id: 'road_traffic',
    name: 'Road & Horns',
    malayalam: 'റോഡ് & ഹോൺ',
    description: 'Highway asphalt hum and distant vehicle horns',
    icon: 'car-sport',
    url: 'https://assets.mixkit.co/active_storage/sfx/2932/2932-preview.mp3',
    defaultVolume: 0.45,
  },
  {
    id: 'highway_wind',
    name: 'Highway Wind',
    malayalam: 'യാത്രാ കാറ്റ്',
    description: 'Cool wind rushing past open window shutters',
    icon: 'speedometer',
    url: 'https://assets.mixkit.co/active_storage/sfx/2750/2750-preview.mp3',
    defaultVolume: 0.5,
  },
  {
    id: 'bus_passengers',
    name: 'Passengers',
    malayalam: 'യാത്രക്കാർ',
    description: 'Cozy murmurs and commuter chatter',
    icon: 'people',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-people.mp4',
    defaultVolume: 0.45,
  },
  {
    id: 'bus_thunder',
    name: 'Mountain Thunder',
    malayalam: 'ഇടിമിന്നൽ',
    description: 'Rolling thunder echoing across the Western Ghats',
    icon: 'flash',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-thunder.mp4',
    defaultVolume: 0.4,
  },
];

export const BUS_PRESETS: ChayakadaPreset[] = [
  {
    id: 'ksrtc-rainy-journey',
    name: 'Monsoon Journey',
    malayalam: 'മഴയാത്ര',
    description: 'Heavy rain drumming against the bus window while cruising',
    icon: 'rainy',
    volumes: {
      bus_engine: 0.65,
      window_rain: 0.85,
      highway_wind: 0.4,
      bus_thunder: 0.35,
      road_traffic: 0.2,
      bus_passengers: 0.2,
    },
  },
  {
    id: 'night-express',
    name: 'Night Express',
    malayalam: 'നൈറ്റ് റൈഡർ',
    description: 'Late night highway cruise under starlit Kerala skies',
    icon: 'moon',
    volumes: {
      bus_engine: 0.65,
      highway_wind: 0.6,
      road_traffic: 0.35,
      window_rain: 0,
      bus_thunder: 0,
      bus_passengers: 0.15,
    },
  },
  {
    id: 'window-seat',
    name: 'Window Seat Chill',
    malayalam: 'വിൻഡോ സീറ്റ്',
    description: 'Breeze, gentle drizzle spray and scenic commuter calm',
    icon: 'leaf',
    volumes: {
      highway_wind: 0.65,
      window_rain: 0.5,
      bus_passengers: 0.45,
      bus_engine: 0.4,
      road_traffic: 0.2,
      bus_thunder: 0,
    },
  },
  {
    id: 'ghat-road',
    name: 'Mountain Pass',
    malayalam: 'ഘട്ട് റോഡ്',
    description: 'Hairpin bends, engine gear roar and mountain thunder',
    icon: 'thunderstorm',
    volumes: {
      bus_engine: 0.75,
      window_rain: 0.7,
      bus_thunder: 0.65,
      highway_wind: 0.45,
      road_traffic: 0.15,
      bus_passengers: 0,
    },
  },
];

export const BUS_TRIP_INFO = [
  { item: 'പ്രിയദർശിനി (Priyadarshini)', price: 'KSRTC', tag: 'Iconic Kerala State Road Transport Bus' },
  { item: 'റൂട്ട് (Route)', price: 'മലയോര പാത', tag: 'Western Ghats Scenic Monsoon Highway' },
  { item: 'സീറ്റ് (Seat)', price: 'വിൻഡോ', tag: 'Raindrops & fresh mountain breeze' },
  { item: 'ടിക്കറ്റ് (Ticket)', price: '₹28', tag: 'Conductor punch ticket' },
];

export const TRAIN_SOUNDS: ChayakadaSound[] = [
  {
    id: 'train_track',
    name: 'Rail Track Rhythm',
    malayalam: 'ട്രാക്ക് ശബ്ദം',
    description: 'Steady rhythmic cadence of steel wheels on rail tracks',
    icon: 'train',
    url: 'https://assets.mixkit.co/active_storage/sfx/1628/1628-preview.mp3',
    defaultVolume: 0.75,
  },
  {
    id: 'train_horn',
    name: 'Locomotive Horn',
    malayalam: 'ട്രെയിൻ വിസിൽ',
    description: 'Classic echoing diesel locomotive horn in the distance',
    icon: 'megaphone',
    url: 'https://assets.mixkit.co/active_storage/sfx/1630/1630-preview.mp3',
    defaultVolume: 0.45,
  },
  {
    id: 'train_wind',
    name: 'Window Wind',
    malayalam: 'ജനലിലെ കാറ്റ്',
    description: 'Fast breeze rushing through iron window bars',
    icon: 'speedometer',
    url: 'https://assets.mixkit.co/active_storage/sfx/2750/2750-preview.mp3',
    defaultVolume: 0.55,
  },
  {
    id: 'train_rain',
    name: 'Rain on Window',
    malayalam: 'ജനലിലെ മഴ',
    description: 'Monsoon drops hitting window glass as train speeds ahead',
    icon: 'rainy',
    url: 'https://assets.mixkit.co/active_storage/sfx/2929/2929-preview.mp3',
    defaultVolume: 0.7,
  },
  {
    id: 'train_station',
    name: 'Station Ambience',
    malayalam: 'സ്റ്റേഷൻ ആരവം',
    description: 'Platform announcements, bells and station buzz',
    icon: 'business',
    url: 'https://assets.mixkit.co/active_storage/sfx/3020/3020-preview.mp3',
    defaultVolume: 0.4,
  },
  {
    id: 'train_passengers',
    name: 'Passengers & Chai',
    malayalam: 'യാത്രക്കാർ & ചായ',
    description: 'Coach chatter, newspaper rustles and station chai calls',
    icon: 'people',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-people.mp4',
    defaultVolume: 0.45,
  },
  {
    id: 'train_thunder',
    name: 'Monsoon Thunder',
    malayalam: 'ഇടിമിന്നൽ',
    description: 'Rolling thunder echoing across Kerala river bridges',
    icon: 'flash',
    url: 'https://pub-c11d77cafe7c4576aab9523e6e4324c2.r2.dev/sounds/main-thunder.mp4',
    defaultVolume: 0.4,
  },
];

export const TRAIN_PRESETS: ChayakadaPreset[] = [
  {
    id: 'konkan-monsoon',
    name: 'Konkan Monsoon',
    malayalam: 'മഴക്കാല യാത്ര',
    description: 'Heavy rain drumming on windows while crossing rivers and tunnels',
    icon: 'rainy',
    volumes: {
      train_track: 0.75,
      train_rain: 0.85,
      train_wind: 0.4,
      train_thunder: 0.35,
      train_horn: 0.25,
      train_station: 0,
      train_passengers: 0.2,
    },
  },
  {
    id: 'night-mail',
    name: 'Night Express',
    malayalam: 'നൈറ്റ് മെയിൽ',
    description: 'Rhythmic rail clicks under starry skies with distant horn calls',
    icon: 'moon',
    volumes: {
      train_track: 0.7,
      train_wind: 0.55,
      train_horn: 0.3,
      train_rain: 0,
      train_thunder: 0,
      train_station: 0,
      train_passengers: 0.15,
    },
  },
  {
    id: 'venad-express',
    name: 'Venad Morning',
    malayalam: 'വേണാട് എക്സ്പ്രസ്സ്',
    description: 'Morning breeze, chai seller and scenic Kerala paddy fields',
    icon: 'sunny',
    volumes: {
      train_track: 0.65,
      train_wind: 0.6,
      train_passengers: 0.45,
      train_station: 0.25,
      train_horn: 0.2,
      train_rain: 0,
      train_thunder: 0,
    },
  },
  {
    id: 'river-crossing',
    name: 'Bridge Crossing',
    malayalam: 'പാലം കടക്കൽ',
    description: 'Thunderous bridge crossing roar echoing across backwaters',
    icon: 'thunderstorm',
    volumes: {
      train_track: 0.85,
      train_horn: 0.5,
      train_wind: 0.6,
      train_thunder: 0.45,
      train_rain: 0.4,
      train_station: 0,
      train_passengers: 0,
    },
  },
];

export const TRAIN_TRIP_INFO = [
  { item: 'വണ്ടി (Train)', price: 'വേണാട് എക്സ്പ്രസ്സ്', tag: 'Venad Express Daily Intercity' },
  { item: 'റൂട്ട് (Route)', price: 'തീരദേശ പാത', tag: 'Scenic Coastal Backwaters & River Bridges' },
  { item: 'സീറ്റ് (Seat)', price: 'വിൻഡോ', tag: 'Breeze through iron bars with hot chai' },
  { item: 'റെയിൽവേ ചായ (Chai)', price: '₹10', tag: 'Hot railway station platform tea' },
];

export const ALL_AMBIENT_SOUNDS: ChayakadaSound[] = [
  ...CHAYAKADA_SOUNDS,
  ...BUS_SOUNDS,
  ...TRAIN_SOUNDS,
];

export const ALL_AMBIENT_PRESETS: ChayakadaPreset[] = [
  ...CHAYAKADA_PRESETS,
  ...BUS_PRESETS,
  ...TRAIN_PRESETS,
];
