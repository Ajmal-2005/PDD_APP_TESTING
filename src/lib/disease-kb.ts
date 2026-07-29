import { SCIENTIFIC_NAMES, TREATMENTS, PREVENTION, DISEASE_I18N_KEY, immediateAction } from './diseases';
import type { StringKey } from './i18n';

/**
 * The Disease Library's content model.
 *
 * Treatment, prevention, scientific names and immediate actions are pulled from
 * diseases.ts, which is the verbatim port of ResultScreen.kt - so the library and
 * a scan result can never drift apart or give a farmer conflicting advice.
 * Symptoms, favourable conditions and pathogen class are new here; they have no
 * Android counterpart because no Android screen ever displayed them.
 */
export type Pathogen = 'fungal' | 'bacterial' | 'viral' | 'pest' | 'none';

export interface DiseaseEntry {
  id: string;
  /** Raw model label, for matching a scan back to its library page. */
  disease: string;
  name: string;
  scientific: string;
  pathogen: Pathogen;
  severity: 'high' | 'medium' | 'low' | 'none';
  summary: string;
  symptoms: string[];
  conditions: string;
  spreads: string;
  treatment: string[];
  prevention: string[];
  action: string;
  i18nKey: StringKey;
  /** Spray programme with timing. Empty when no chemical cure exists (viruses). */
  chemical: string[];
  /** Non-chemical measures — for viruses these are the ONLY effective controls. */
  cultural: string[];
  /** Organic / low-residue alternatives. */
  organic: string[];
  /** What to inspect, and how often. */
  monitoring: string;
}

/** Universal guidance appended whenever a report recommends a spray. */
export const RESISTANCE_NOTE =
  'Rotate between different FRAC/IRAC groups and never apply the same mode of action twice ' +
  'in succession. Repeated use of one group is the main cause of resistance, and ' +
  'insensitivity to Group 11 (strobilurins) is already widespread.';

export const LABEL_NOTE =
  'Product registrations, permitted rates and pre-harvest intervals differ by country and ' +
  'crop stage. The product label is the legal authority — always read it before mixing, and ' +
  'confirm the pre-harvest interval before picking.';

interface Seed {
  id: string; disease: string; pathogen: Pathogen; severity: DiseaseEntry['severity'];
  summary: string; symptoms: string[]; conditions: string; spreads: string;
}

const SEEDS: Seed[] = [
  {
    id: 'late-blight', disease: 'Late Blight', pathogen: 'fungal', severity: 'high',
    summary: 'The most destructive tomato disease there is. An untreated field can collapse in under two weeks.',
    symptoms: [
      'Greasy, grey-green blotches on leaf tips and edges',
      'White downy growth on the leaf underside in humid mornings',
      'Dark brown, firm lesions on stems and green fruit',
      'Whole leaves blacken and collapse within days',
    ],
    conditions: 'Cool, wet weather — 10–24 °C with humidity above 90% or prolonged leaf wetness.',
    spreads: 'Airborne spores travel several kilometres on wind and rain splash.',
  },
  {
    id: 'early-blight', disease: 'Early Blight', pathogen: 'fungal', severity: 'medium',
    summary: 'Starts on the oldest leaves and works upward, stripping the canopy and exposing fruit to sunscald.',
    symptoms: [
      'Brown spots with concentric rings, like a target',
      'Yellow halo around each lesion',
      'Lower, older leaves affected first',
      'Dark sunken collar rot at the stem base on seedlings',
    ],
    conditions: 'Warm and humid — 24–29 °C with alternating wet and dry spells.',
    spreads: 'Rain splash and irrigation carry spores up from infected soil and debris.',
  },
  {
    id: 'bacterial-spot', disease: 'Bacterial Spot', pathogen: 'bacterial', severity: 'medium',
    summary: 'A seed- and splash-borne bacterium. There is no curative spray, so prevention carries the whole load.',
    symptoms: [
      'Small, dark, water-soaked spots that turn angular and brown',
      'Spots may drop out, leaving a shot-hole appearance',
      'Raised scabby lesions on fruit',
      'Leaf yellowing and early drop',
    ],
    conditions: 'Warm and wet — 24–30 °C with driving rain or overhead irrigation.',
    spreads: 'Splashing water, contaminated seed, and handling plants while foliage is wet.',
  },
  {
    id: 'septoria', disease: 'Septoria Leaf Spot', pathogen: 'fungal', severity: 'medium',
    summary: 'Rarely kills the plant, but heavy defoliation cuts yield sharply and exposes fruit to the sun.',
    symptoms: [
      'Many small circular spots with grey centres and dark borders',
      'Tiny black specks (fruiting bodies) visible in the spot centres',
      'Begins on lower leaves after the first fruit sets',
      'Severe yellowing and leaf drop from the bottom up',
    ],
    conditions: 'Moderate temperatures, 20–25 °C, with extended leaf wetness.',
    spreads: 'Rain splash, overhead watering, tools, and hands moving through a wet crop.',
  },
  {
    id: 'leaf-mold', disease: 'Leaf Mold', pathogen: 'fungal', severity: 'medium',
    summary: 'Largely a protected-cropping problem. Ventilation matters more than any fungicide.',
    symptoms: [
      'Pale green to yellow patches on the upper leaf surface',
      'Olive-green to brown velvety mould underneath',
      'Leaves curl, wither and drop while still attached',
      'Rarely reaches the fruit',
    ],
    conditions: 'High humidity above 85% with poor airflow, typically 22–24 °C under cover.',
    spreads: 'Spores move on air currents, tools and clothing inside the greenhouse.',
  },
  {
    id: 'target-spot', disease: 'Target Spot', pathogen: 'fungal', severity: 'medium',
    summary: 'Easily mistaken for early blight; it attacks fruit directly, which early blight usually does not.',
    symptoms: [
      'Small brown spots that enlarge into targets with a light centre',
      'Lesions on leaves, stems and fruit alike',
      'Sunken, pitted spots on the fruit surface',
      'Heavy defoliation in a wet season',
    ],
    conditions: 'Warm and wet — 20–28 °C with long periods of leaf wetness.',
    spreads: 'Wind-blown spores and rain splash from infected crop debris.',
  },
  {
    id: 'yellow-leaf-curl', disease: 'Tomato Yellow Leaf Curl Virus', pathogen: 'viral', severity: 'high',
    summary: 'Incurable once a plant has it. Control means controlling the whitefly that carries it.',
    symptoms: [
      'Leaves curl upward and inward at the margins',
      'Strong yellowing between the veins',
      'Severely stunted, bushy growth',
      'Flowers drop; almost no fruit sets after infection',
    ],
    conditions: 'Hot, dry weather that favours whitefly populations, 25–35 °C.',
    spreads: 'Transmitted only by the silverleaf whitefly — not by seed, tools or contact.',
  },
  {
    id: 'mosaic-virus', disease: 'Tomato Mosaic Virus', pathogen: 'viral', severity: 'high',
    summary: 'Extremely stable — it survives in dry debris for years and spreads on hands and tools.',
    symptoms: [
      'Mottled light and dark green mosaic on the leaves',
      'Fern-like narrowing and distortion of young leaves',
      'Internal browning of the fruit wall',
      'Uneven ripening and stunted growth',
    ],
    conditions: 'Any growing condition; the virus is not weather-dependent.',
    spreads: 'Mechanical contact — hands, tools, clothing, and infected seed.',
  },
  {
    id: 'spider-mites', disease: 'Spider Mites Two-spotted Spider Mite', pathogen: 'pest', severity: 'medium',
    summary: 'A mite, not a disease. Populations explode in hot dry weather and in water-stressed crops.',
    symptoms: [
      'Fine pale stippling across the upper leaf surface',
      'Delicate webbing on leaf undersides and between stems',
      'Leaves bronze, dry out and fall',
      'Tiny moving specks visible with a hand lens',
    ],
    conditions: 'Hot and dry — above 30 °C with low humidity, worst on drought-stressed plants.',
    spreads: 'Wind, clothing, tools, and movement of infested plant material.',
  },
  {
    id: 'healthy', disease: 'Healthy', pathogen: 'none', severity: 'none',
    summary: 'No disease detected. Keep scouting — most outbreaks are cheapest to stop in the first week.',
    symptoms: [
      'Uniform green colour with no spotting or mottling',
      'Firm, flat leaves with no curling',
      'Steady new growth at the tips',
    ],
    conditions: 'Balanced irrigation, good airflow and adequate nutrition.',
    spreads: 'n/a',
  },
];

/**
 * Management protocols, keyed by seed id.
 *
 * Sources: UC IPM Pest Management Guidelines (Tomato), University of Minnesota Extension,
 * NC State Extension, Penn State Extension. Active ingredients are named rather than brands
 * because registrations and trade names differ by country; rates appear only where they are
 * the widely published field rate, otherwise the label governs.
 *
 * Kept identical to the Kotlin DiseaseKb.kt so a report generated on the phone and one
 * generated in the browser give the same advice.
 */
interface Protocol { chemical: string[]; cultural: string[]; organic: string[]; monitoring: string }

const PROTOCOLS: Record<string, Protocol> = {
  'late-blight': {
    chemical: [
      'ACT IMMEDIATELY — an untreated field can collapse in under two weeks.',
      'Protectant base: Mancozeb 75% WP at 2 g/L, or Chlorothalonil, on a 5–7 day interval in wet weather.',
      'Systemic knockdown for active infection: Metalaxyl-M + Mancozeb, or Cymoxanil + Mancozeb.',
      'Newer targeted actives: Cyazofamid, Mandipropamid, or Oxathiapiprolin-based products.',
      'Shorten the interval to 5 days while rain and fog persist; protectants wash off.',
    ],
    cultural: [
      'Remove and destroy infected plants — bury or burn, never compost.',
      'Improve field drainage and avoid overhead irrigation.',
      'Do not work the crop while foliage is wet.',
      'Destroy volunteer tomato and potato plants and nearby cull piles.',
    ],
    organic: [
      'Fixed copper (e.g. copper hydroxide) applied preventively before infection.',
      'Copper is protectant only — it cannot cure established lesions.',
    ],
    monitoring: 'Inspect lower leaves every 2–3 days once night temperatures fall and dew persists past sunrise.',
  },
  'early-blight': {
    chemical: [
      'Begin at first symptom, or when warm humid weather sets in after fruit set.',
      'Protectant: Mancozeb 75% WP at 2 g/L or Chlorothalonil, 7–10 day interval.',
      'Systemic options: Azoxystrobin, Difenoconazole, or Boscalid.',
      'Alternate protectant and systemic sprays rather than repeating one product.',
    ],
    cultural: [
      'Prune and remove the lowest infected leaves to slow upward spread.',
      'Mulch to stop soil splashing onto foliage.',
      'Water at the base of the plant, never over the canopy.',
      'Stake plants and widen spacing to speed canopy drying.',
      'Maintain balanced nitrogen — stressed plants are hit hardest.',
    ],
    organic: [
      'Copper-based fungicide on a weekly schedule.',
      'Bacillus subtilis biofungicide as a preventive rotation partner.',
    ],
    monitoring: 'Check the oldest leaves weekly from first fruit set; early blight always starts at the bottom.',
  },
  septoria: {
    chemical: [
      'Protectant: Mancozeb 75% WP at 2 g/L or Chlorothalonil, 7–10 day interval.',
      'Copper products are effective and suit organic production.',
      'Continue on schedule through the wet period — it rarely kills the plant, but defoliation cuts yield sharply.',
    ],
    cultural: [
      'Remove infected lower leaves and destroy them.',
      'Rotate away from tomato for 2–3 years.',
      'Stake plants and increase spacing for airflow.',
      'Clear crop debris and solanaceous weeds that harbour the fungus.',
      'Avoid working in the field while plants are wet.',
    ],
    organic: [
      'Fixed copper applied weekly during wet spells.',
      'Mulching to break the soil-to-leaf splash cycle.',
    ],
    monitoring: 'Scout lower leaves weekly after fruit set; look for the black pycnidia that distinguish it from early blight.',
  },
  'bacterial-spot': {
    chemical: [
      'There is NO curative spray — bactericides only slow spread, so prevention carries the load.',
      'Fixed copper tank-mixed with Mancozeb, applied preventively on a 7 day interval.',
      'Copper alone is weaker where copper-tolerant strains are present.',
      'Stop overhead irrigation before spraying, or the spray is wasted.',
    ],
    cultural: [
      'Use certified disease-free or hot-water-treated seed — seed is the usual entry point.',
      'Rotate crops for at least 2 years away from tomato and pepper.',
      'Switch to drip irrigation and avoid overhead watering entirely.',
      'Never handle or prune plants while wet.',
      'Disinfect stakes, tools and trays between plantings.',
    ],
    organic: [
      'Copper plus a labelled biological (e.g. Bacillus subtilis).',
      'Plant-activator products may reduce severity but do not eliminate it.',
    ],
    monitoring: 'Inspect transplants before planting; most outbreaks arrive with infected seedlings.',
  },
  'leaf-mold': {
    chemical: [
      'Chlorothalonil or Mancozeb where registered for protected cropping.',
      'Copper-based products are an effective alternative.',
      'Sprays are secondary here — humidity control does more than any fungicide.',
    ],
    cultural: [
      'Increase ventilation and air movement; this is the single most effective measure.',
      'Hold humidity below 85% — vent and heat in the evening to prevent condensation.',
      'Widen plant spacing and prune lower leaves to open the canopy.',
      'Remove infected leaves and all crop residue between cycles.',
      'Use resistant cultivars where available.',
    ],
    organic: [
      'Copper fungicide combined with aggressive ventilation.',
      'Sanitise greenhouse structures between crops.',
    ],
    monitoring: 'Check leaf undersides twice weekly under cover, especially after cool humid nights.',
  },
  'target-spot': {
    chemical: [
      'Apply preventively — it attacks fruit directly, unlike early blight.',
      'Azoxystrobin, Chlorothalonil or Mancozeb on a 7–10 day interval.',
      'Rotate modes of action; this pathogen develops resistance readily.',
    ],
    cultural: [
      'Remove and destroy crop debris after harvest.',
      'Rotate away from tomato and other hosts.',
      'Improve air circulation through spacing and pruning.',
      'Use certified disease-free seed.',
    ],
    organic: [
      'Copper-based products applied preventively.',
      'Strict field sanitation between crops.',
    ],
    monitoring: 'Inspect mid-canopy leaves and developing fruit weekly in humid weather.',
  },
  'yellow-leaf-curl': {
    chemical: [
      'No chemical cures an infected plant — fungicides and antibiotics do nothing.',
      'Control the whitefly vector instead: systemic insecticide at transplant, then rotate actives.',
      'Avoid repeated pyrethroid use — it kills whitefly predators and worsens outbreaks.',
      'Integrated control suppresses this virus far better than insecticides alone.',
    ],
    cultural: [
      'Plant TYLCV-resistant varieties — the single most effective measure.',
      'Start with virus-free and whitefly-free transplants.',
      'Rogue out infected plants immediately; bag them before removal so whiteflies do not disperse.',
      'Use insect-proof netting (50 mesh) on nurseries and protected structures.',
      'Lay reflective/silver plastic mulch to repel incoming whiteflies.',
      'Observe a tomato-free period between seasons to break the cycle.',
    ],
    organic: [
      'Yellow sticky traps for monitoring and mass trapping.',
      'Insecticidal soap or neem oil against whitefly nymphs on leaf undersides.',
      'Encourage natural enemies such as Encarsia formosa.',
    ],
    monitoring: 'Shake plants and check leaf undersides for adult whiteflies twice weekly; act on the vector, not the symptom.',
  },
  'mosaic-virus': {
    chemical: [
      'No chemical control exists. Sprays cannot cure or suppress a plant virus.',
      'Sanitation is the entire control programme.',
    ],
    cultural: [
      'Remove and destroy infected plants immediately — do not compost.',
      'Use certified virus-free seed, or hot-water-treat seed before sowing.',
      'Wash hands with soap and disinfect tools between plants; milk or skim-milk dips inactivate the virus.',
      'Do not use tobacco products near the crop — ToMV and TMV survive in cured tobacco.',
      'Choose resistant cultivars carrying the Tm-2a gene.',
      'Remove all crop debris; the virus persists in dry residue for years.',
    ],
    organic: ['Strict sanitation and resistant varieties — no product substitutes for these.'],
    monitoring: 'Inspect young growing tips weekly; mosaic shows first on new leaves, unlike blights which start low.',
  },
  'spider-mites': {
    chemical: [
      'Use a true miticide — ordinary insecticides do not control mites.',
      'Effective actives include Abamectin, Bifenazate, Spiromesifen or Fenpyroximate.',
      'Direct the spray at leaf UNDERSIDES, where mites actually live.',
      'AVOID broad-spectrum pyrethroids and carbaryl — they kill predatory mites and cause flare-ups.',
      'Rotate IRAC groups; this mite develops resistance faster than almost any other pest.',
    ],
    cultural: [
      'Keep plants well watered — water stress is the main trigger for outbreaks.',
      'Raise humidity around the canopy where practical.',
      'Remove and bag heavily infested leaves.',
      'Control dusty conditions on field margins and roads; dust favours mites.',
    ],
    organic: [
      'Release predatory mites (Phytoseiulus persimilis) early, before populations explode.',
      'Insecticidal soap, horticultural oil or neem oil, thoroughly covering leaf undersides.',
      'A strong water spray physically dislodges colonies.',
    ],
    monitoring: 'Use a hand lens on leaf undersides twice weekly in hot dry spells; treat before webbing appears.',
  },
  healthy: {
    chemical: [
      'No treatment required. Do not spray preventively without cause — unnecessary applications accelerate resistance and kill beneficial insects.',
    ],
    cultural: [
      'Continue weekly scouting — most outbreaks are cheapest to stop in the first week.',
      'Maintain balanced fertilisation and consistent irrigation.',
      'Keep mulch in place and preserve airflow through the canopy.',
      'Practise crop rotation to keep soil-borne inoculum low.',
    ],
    organic: ['Preventive cultural practice is the whole programme while the crop is clean.'],
    monitoring: 'Scout the whole block weekly, checking the oldest leaves and the newest growing tips.',
  },
};

const EMPTY_PROTOCOL: Protocol = { chemical: [], cultural: [], organic: [], monitoring: '' };

export const DISEASE_KB: DiseaseEntry[] = SEEDS.map((s) => ({
  ...s,
  ...(PROTOCOLS[s.id] ?? EMPTY_PROTOCOL),
  name: s.disease,
  scientific: SCIENTIFIC_NAMES[s.disease] ?? '',
  treatment: TREATMENTS[s.disease] ?? [],
  prevention: PREVENTION[s.disease] ?? [],
  action: immediateAction(s.disease),
  i18nKey: (DISEASE_I18N_KEY[s.disease] ?? 'diseaseUnknown') as StringKey,
}));

export const kbById = (id: string) => DISEASE_KB.find((d) => d.id === id);
export const kbByDisease = (disease: string) => DISEASE_KB.find((d) => d.disease === disease);

export const PATHOGEN_TONE: Record<Pathogen, 'high' | 'medium' | 'low' | 'safe' | 'neutral'> = {
  fungal: 'medium', bacterial: 'low', viral: 'high', pest: 'medium', none: 'safe',
};
