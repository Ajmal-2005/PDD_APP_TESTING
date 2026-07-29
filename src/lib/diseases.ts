// Ported verbatim from ui/result/ResultScreen.kt so web and Android give
// identical agronomic advice for the same prediction.

export const SCIENTIFIC_NAMES: Record<string, string> = {
  'Bacterial Spot': 'Xanthomonas campestris',
  'Early Blight': 'Alternaria solani',
  'Late Blight': 'Phytophthora infestans',
  'Leaf Mold': 'Passalora fulva',
  'Septoria Leaf Spot': 'Septoria lycopersici',
  'Spider Mites Two-spotted Spider Mite': 'Tetranychus urticae',
  'Target Spot': 'Corynespora cassiicola',
  'Tomato Yellow Leaf Curl Virus': 'Begomovirus sp.',
  'Tomato Mosaic Virus': 'Tobamovirus sp.',
  Healthy: 'No disease detected',
  'No tomato leaf detected': 'N/A',
};

export const TREATMENTS: Record<string, string[]> = {
  'Bacterial Spot': ['Apply copper-based bactericide', 'Remove infected leaves', 'Avoid overhead irrigation'],
  'Early Blight': ['Apply Mancozeb 75% WP at 2g/L', 'Remove lower infected leaves', 'Ensure proper plant spacing'],
  'Late Blight': ['Apply Metalaxyl + Mancozeb every 7 days', 'Remove and destroy infected parts', 'Improve field drainage'],
  'Leaf Mold': ['Apply fungicide with chlorothalonil', 'Improve greenhouse ventilation', 'Reduce humidity levels'],
  'Septoria Leaf Spot': ['Apply Mancozeb or Chlorothalonil', 'Remove infected leaves', 'Avoid working in wet conditions'],
  'Spider Mites Two-spotted Spider Mite': ['Apply miticide or neem oil', 'Increase humidity around plants', 'Remove heavily infested leaves'],
  'Target Spot': ['Apply fungicide preventively', 'Ensure good air circulation', 'Remove crop debris'],
  'Tomato Yellow Leaf Curl Virus': ['Control whitefly populations', 'Remove infected plants immediately', 'Use resistant varieties'],
  'Tomato Mosaic Virus': ['Remove and destroy infected plants', 'Control aphid vectors', 'Disinfect tools regularly'],
  Healthy: ['Continue regular monitoring', 'Maintain proper nutrition', 'Practice crop rotation'],
  'No tomato leaf detected': ['Ensure you are scanning a tomato leaf', 'Provide good lighting', 'Keep the leaf centered in the frame'],
};

export const PREVENTION: Record<string, string[]> = {
  'Bacterial Spot': ['Use disease-free seeds', 'Rotate crops annually', 'Avoid overhead watering'],
  'Early Blight': ['Use resistant varieties', 'Mulch around plants', 'Water at base of plant'],
  'Late Blight': ['Plant resistant varieties', 'Monitor weather conditions', 'Apply preventive fungicides'],
  'Leaf Mold': ['Use resistant varieties', 'Ensure good ventilation', 'Monitor humidity levels'],
  'Septoria Leaf Spot': ['Use disease-free transplants', 'Rotate crops every 3 years', 'Stake plants for airflow'],
  'Spider Mites Two-spotted Spider Mite': ['Monitor plants regularly', 'Avoid water stress', 'Introduce natural predators'],
  'Target Spot': ['Use certified disease-free seeds', 'Rotate crops', 'Keep field clean of debris'],
  'Tomato Yellow Leaf Curl Virus': ['Use insect-proof screens', 'Plant resistant varieties', 'Apply reflective mulches'],
  'Tomato Mosaic Virus': ['Use virus-free seeds', 'Control insect vectors', 'Wash hands before handling plants'],
  Healthy: ['Regular scouting every week', 'Balanced fertilization', 'Proper irrigation management'],
};

export function immediateAction(disease: string): string {
  if (disease === 'Healthy') return 'Continue regular scouting to maintain tomato crop health.';
  if (disease === 'No tomato leaf detected') return 'Please scan a clear image of a tomato leaf.';
  if (disease === 'Late Blight') return 'Apply Metalaxyl-M immediately and remove infected plants.';
  if (disease === 'Early Blight') return 'Prune lower leaves and apply chlorothalonil fungicide.';
  if (disease === 'Bacterial Spot') return 'Apply copper-based sprays and avoid overhead irrigation.';
  if (/yellow leaf curl/i.test(disease)) return 'Control whitefly population and remove infected hosts.';
  if (/mosaic virus/i.test(disease)) return 'Destroy infected plants and disinfect all farm tools.';
  if (disease === 'Leaf Mold') return 'Improve ventilation and reduce greenhouse humidity.';
  if (disease === 'Septoria Leaf Spot') return 'Apply Mancozeb and improve spacing for airflow.';
  if (disease === 'Target Spot') return 'Apply preventive fungicides and remove crop debris.';
  if (/spider mites/i.test(disease)) return 'Apply miticides and maintain high plant vigor.';
  return 'Ensure you have a clear, well-lit photo of a tomato leaf.';
}

/** Maps a raw model label to the i18n key used for its display name. */
export const DISEASE_I18N_KEY: Record<string, string> = {
  Healthy: 'diseaseHealthy',
  'Bacterial Spot': 'diseaseBacterialSpot',
  'Early Blight': 'diseaseEarlyBlight',
  'Late Blight': 'diseaseLateBlight',
  'Leaf Mold': 'diseaseLeafMold',
  'Septoria Leaf Spot': 'diseaseSeptoriaLeafSpot',
  'Spider Mites Two-spotted Spider Mite': 'diseaseSpiderMites',
  'Target Spot': 'diseaseTargetSpot',
  'Tomato Yellow Leaf Curl Virus': 'diseaseYellowLeafCurl',
  'Tomato Mosaic Virus': 'diseaseMosaicVirus',
  'No tomato leaf detected': 'noLeafDetected',
  Unknown: 'diseaseUnknown',
};

export const RISK_COLORS: Record<string, string> = {
  HIGH: '#FF5252',
  MEDIUM: '#FFAB40',
  LOW: '#00E676',
  SAFE: '#00E676',
  UNKNOWN: '#AAB8B0',
};
