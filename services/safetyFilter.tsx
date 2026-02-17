// services/safetyFilter.ts

const HIGH_RISK_KEYWORDS = [
  'cure', 'treat', 'heal', 'disease', 'cancer', 'diabetes', 'pregnant', 
  'nursing', 'overdose', 'suicide', 'emergency', 'heart attack', 'stroke'
];

export const analyzeSafetyRisk = (input: string): { isHighRisk: boolean; category: string | null } => {
  const lowerInput = input.toLowerCase();
  
  if (HIGH_RISK_KEYWORDS.some(word => lowerInput.includes(word))) {
    // Check if they are asking about medical treatment
    if (lowerInput.includes('cure') || lowerInput.includes('treat')) {
      return { isHighRisk: true, category: 'medical_claim' };
    }
    // Check for sensitive physical states
    if (lowerInput.includes('pregnant') || lowerInput.includes('nursing')) {
      return { isHighRisk: true, category: 'pregnancy' };
    }
    return { isHighRisk: true, category: 'general_safety' };
  }
  
  return { isHighRisk: false, category: null };
};