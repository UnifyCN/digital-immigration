export const PNP_MVP_PROVINCES = ["BC"] as const
export const PNP_MVP_DEFAULT_PROVINCE = "BC" as const
export const PNP_PROVINCE_LABELS = {
  BC: "British Columbia",
} as const
export const PNP_ENABLE_MULTI_PROVINCE = false

export type EnabledPNPProvinceCode = (typeof PNP_MVP_PROVINCES)[number]

export function isProvinceEnabled(code: string): code is EnabledPNPProvinceCode {
  return PNP_MVP_PROVINCES.includes(code as EnabledPNPProvinceCode)
}

export function getEnabledProvinces(): Array<{
  code: EnabledPNPProvinceCode
  label: (typeof PNP_PROVINCE_LABELS)[EnabledPNPProvinceCode]
}> {
  return PNP_MVP_PROVINCES.map((code) => ({
    code,
    label: PNP_PROVINCE_LABELS[code],
  }))
}
