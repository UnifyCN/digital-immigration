import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPSignals } from "./pnpSignals.ts"
import {
  buildPNPProvinceFinderSignals,
  mergeSignals,
  resolveMVPProvince,
  resolveMVPProvinceCode,
} from "./pnpProvinceScope.ts"

test("MVP resolver returns BC and notice=true when preferred province is Ontario", () => {
  const { signals: mainSignals } = buildPNPSignals({
    preferredProvince: "Ontario",
  })
  const finderSignals = buildPNPProvinceFinderSignals({})

  const provinceCode = resolveMVPProvinceCode({ mainSignals, finderSignals })
  const resolution = resolveMVPProvince({ mainSignals, finderSignals })

  assert.equal(provinceCode, "BC")
  assert.equal(resolution.provinceCode, "BC")
  assert.equal(resolution.mvpProvinceNotice, true)
})

test("MVP resolver keeps BC and notice=false when preferred province is British Columbia", () => {
  const { signals: mainSignals } = buildPNPSignals({
    preferredProvince: "British Columbia",
  })
  const finderSignals = buildPNPProvinceFinderSignals({})
  const resolution = resolveMVPProvince({ mainSignals, finderSignals })

  assert.equal(resolution.provinceCode, "BC")
  assert.equal(resolution.mvpProvinceNotice, false)
})

test("MVP resolver returns BC and notice=false when preferred province label is invalid", () => {
  const { signals: mainSignals } = buildPNPSignals({
    preferredProvince: "Atlantis",
  })
  const finderSignals = buildPNPProvinceFinderSignals({})
  const resolution = resolveMVPProvince({ mainSignals, finderSignals })

  assert.equal(resolution.provinceCode, "BC")
  assert.equal(resolution.mvpProvinceNotice, false)
})

test("MVP resolver returns BC and notice=false when preferred province is missing", () => {
  const { signals: mainSignals } = buildPNPSignals({})
  const finderSignals = buildPNPProvinceFinderSignals({})
  const resolution = resolveMVPProvince({ mainSignals, finderSignals })

  assert.equal(resolution.provinceCode, "BC")
  assert.equal(resolution.mvpProvinceNotice, false)
})

test("mergeSignals does not overwrite non-empty main values with empty finder values", () => {
  const { signals: mainSignals } = buildPNPSignals({
    preferredProvince: "British Columbia",
    jobOfferProvinceTerritory: "British Columbia",
  })
  const finderSignals = buildPNPProvinceFinderSignals({
    // empty finder inputs should not override populated main values
    targetProvince: "",
    jobOfferProvince: "",
  })

  const merged = mergeSignals(mainSignals, finderSignals)

  assert.equal(merged.preferredProvince, "British Columbia")
  assert.equal(merged.jobOfferProvince, "British Columbia")
})
