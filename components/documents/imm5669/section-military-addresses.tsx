"use client"

import { useFormContext, useFieldArray } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { RepeatableRow, AddRowButton } from "./repeatable-row"
import type { Imm5669Data } from "@/lib/imm5669/types"
import { EMPTY_MILITARY_ROW, EMPTY_ADDRESS_ROW } from "@/lib/imm5669/types"

export function SectionMilitaryAddresses() {
  const { control, formState } = useFormContext<Imm5669Data>()

  const military = useFieldArray({ control, name: "militaryService" })
  const addresses = useFieldArray({ control, name: "addresses" })

  const militaryGapError = formState.errors.militaryService?.message
    || formState.errors.militaryService?.root?.message
  const addressGapError = formState.errors.addresses?.message
    || formState.errors.addresses?.root?.message

  return (
    <div className="flex flex-col gap-8">
      {/* Military service */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Military / Paramilitary Service
          </h2>
          <FormDescription>
            Provide details of military or paramilitary service. Do not leave gaps in time.
            Leave empty if not applicable.
          </FormDescription>
        </div>

        {militaryGapError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-xs">{militaryGapError}</AlertDescription>
          </Alert>
        )}

        {military.fields.length > 0 && (
          <div className="flex flex-col gap-3">
            {military.fields.map((field, index) => (
              <RepeatableRow
                key={field.id}
                index={index}
                canRemove
                onRemove={() => military.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`militaryService.${index}.country`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.from`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2010-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.to`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2014-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.branchAndUnit`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Branch of service, unit, commanding officers</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.ranks`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Rank(s)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.combatDetails`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Active combat dates/places</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`militaryService.${index}.reasonForEnd`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Reason for end of service</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </RepeatableRow>
            ))}
          </div>
        )}

        <AddRowButton
          label="Add military service entry"
          onClick={() => military.append({ ...EMPTY_MILITARY_ROW })}
        />

        {military.fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No military service added. If none, you may leave this section empty.
          </p>
        )}
      </div>

      {/* Addresses */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Addresses
          </h3>
          <FormDescription>
            All addresses where you have lived since age 18 or the past 10 years.
            Do not use P.O. box addresses. Do not leave gaps.
          </FormDescription>
        </div>

        <Alert variant="default" className="border-tier-moderate/30 bg-tier-moderate/5">
          <AlertTriangle className="size-4 text-tier-moderate" />
          <AlertDescription className="text-xs">
            Ensure there are no gaps in time between addresses.
          </AlertDescription>
        </Alert>

        {addressGapError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-xs">{addressGapError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          {addresses.fields.map((field, index) => (
            <RepeatableRow
              key={field.id}
              index={index}
              canRemove={addresses.fields.length > 1}
              onRemove={() => addresses.remove(index)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`addresses.${index}.from`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                      <FormControl>
                        <Input placeholder="2020-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.to`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                      <FormControl>
                        <Input placeholder="2023-06" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.streetAndNumber`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">Street and number</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, Apt 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.cityOrTown`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City or town</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.provinceStateDistrict`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Province/State/District</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.postalCode`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Postal/Zip code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`addresses.${index}.country`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </RepeatableRow>
          ))}
        </div>

        <AddRowButton
          label="Add address"
          onClick={() => addresses.append({ ...EMPTY_ADDRESS_ROW })}
        />
      </div>
    </div>
  )
}
