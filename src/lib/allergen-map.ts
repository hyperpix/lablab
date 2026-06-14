/**
 * Maps allergy category keywords to drug name substrings.
 * Matching is case-insensitive substring.
 * Extend this map to add more allergen groups over time.
 */
export const ALLERGEN_MAP: Record<string, string[]> = {
  penicillin:    ['amoxicillin', 'ampicillin', 'pcn', 'augmentin', 'flucloxacillin', 'piperacillin'],
  cephalosporin: ['cephalexin', 'cefazolin', 'cefuroxime', 'ceftriaxone', 'cefixime'],
  nsaid:         ['ibuprofen', 'aspirin', 'naproxen', 'diclofenac', 'mefenamic'],
  sulfonamide:   ['sulfamethoxazole', 'trimethoprim', 'bactrim'],
  metronidazole: ['metronidazole', 'flagyl'],
  clindamycin:   ['clindamycin', 'dalacin'],
  erythromycin:  ['erythromycin', 'azithromycin', 'clarithromycin'],
  codeine:       ['codeine', 'tramadol'],
  latex:         ['latex'],
}

/**
 * Returns the allergy names that conflict with a given drug name.
 * @param drugName      The drug being prescribed (e.g. "Amoxicillin 500mg")
 * @param patientAllergies  Patient's allergy list (e.g. ["Penicillin", "Latex"])
 */
export function checkAllergyConflicts(drugName: string, patientAllergies: string[]): string[] {
  if (!patientAllergies.length || !drugName) return []
  const drug = drugName.toLowerCase()
  const conflicts: string[] = []

  for (const allergy of patientAllergies) {
    const key = allergy.toLowerCase()
    // Direct match: if the allergy name itself appears in the drug name
    if (drug.includes(key)) {
      conflicts.push(allergy)
      continue
    }
    // Map match: check if this allergy key maps to drug substrings
    const synonyms = ALLERGEN_MAP[key] ?? []
    if (synonyms.some((s) => drug.includes(s))) {
      conflicts.push(allergy)
    }
  }

  return [...new Set(conflicts)] // deduplicate
}
