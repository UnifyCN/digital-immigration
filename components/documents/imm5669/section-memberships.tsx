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
import { RepeatableRow, AddRowButton } from "./repeatable-row"
import type { Imm5669Data } from "@/lib/imm5669/types"
import {
  EMPTY_MEMBERSHIP_ROW,
  EMPTY_GOVERNMENT_POSITION_ROW,
} from "@/lib/imm5669/types"

export function SectionMemberships() {
  const { control } = useFormContext<Imm5669Data>()

  const memberships = useFieldArray({ control, name: "memberships" })
  const govPositions = useFieldArray({ control, name: "governmentPositions" })

  return (
    <div className="flex flex-col gap-8">
      {/* Memberships */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Memberships & Associations
          </h2>
          <FormDescription>
            Political, social, youth, student organizations, trade unions, and professional
            associations. Write &quot;NONE&quot; or leave empty if not applicable.
          </FormDescription>
        </div>

        {memberships.fields.length > 0 && (
          <div className="flex flex-col gap-3">
            {memberships.fields.map((field, index) => (
              <RepeatableRow
                key={field.id}
                index={index}
                canRemove
                onRemove={() => memberships.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`memberships.${index}.from`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2018-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`memberships.${index}.to`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2022-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`memberships.${index}.organizationName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Organization name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`memberships.${index}.organizationType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Type of organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Professional association" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`memberships.${index}.activitiesOrPositions`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Activities/Positions</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`memberships.${index}.cityAndCountry`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">City and country</FormLabel>
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
          label="Add membership"
          onClick={() => memberships.append({ ...EMPTY_MEMBERSHIP_ROW })}
        />

        {memberships.fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No memberships added. If none, you may leave this section empty.
          </p>
        )}
      </div>

      {/* Government positions */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Government Positions
          </h3>
          <FormDescription>
            Civil servant, judge, police officer, security organization employee, etc.
            Leave empty if not applicable.
          </FormDescription>
        </div>

        {govPositions.fields.length > 0 && (
          <div className="flex flex-col gap-3">
            {govPositions.fields.map((field, index) => (
              <RepeatableRow
                key={field.id}
                index={index}
                canRemove
                onRemove={() => govPositions.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`governmentPositions.${index}.from`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2015-06" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`governmentPositions.${index}.to`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="2020-03" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`governmentPositions.${index}.countryAndJurisdiction`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Country and level of jurisdiction</FormLabel>
                        <FormDescription className="text-[10px]">
                          e.g. India — National, Canada — Municipal
                        </FormDescription>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`governmentPositions.${index}.departmentBranch`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Department/Branch</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`governmentPositions.${index}.activitiesOrPositions`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Activities/Positions</FormLabel>
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
          label="Add government position"
          onClick={() => govPositions.append({ ...EMPTY_GOVERNMENT_POSITION_ROW })}
        />

        {govPositions.fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No government positions added. If none, you may leave this section empty.
          </p>
        )}
      </div>
    </div>
  )
}
