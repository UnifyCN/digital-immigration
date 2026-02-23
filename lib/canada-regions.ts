export const CANADIAN_PROVINCES_AND_TERRITORIES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
] as const

export const CURRENT_PROVINCE_TERRITORY_OPTIONS = [
  ...CANADIAN_PROVINCES_AND_TERRITORIES,
  "Outside Canada",
] as const
