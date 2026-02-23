import { isProvinceEnabled, PNP_MVP_DEFAULT_PROVINCE } from "../config/pnpScope"
import type { CombinedPNPSignals } from "./pnpProvinceScope"

export type PNPProvinceEvaluationResult = {
  supported: boolean
  provinceCode: string
  message?: string
}

export function evaluatePNPProvince(params: {
  provinceCode: string
  combinedSignals: CombinedPNPSignals
}): PNPProvinceEvaluationResult {
  const { provinceCode } = params
  if (!isProvinceEnabled(provinceCode)) {
    return {
      supported: false,
      provinceCode,
      message: "MVP scope",
    }
  }

  if (provinceCode !== PNP_MVP_DEFAULT_PROVINCE) {
    return {
      supported: false,
      provinceCode,
      message: "MVP scope",
    }
  }

  return {
    supported: true,
    provinceCode,
  }
}
