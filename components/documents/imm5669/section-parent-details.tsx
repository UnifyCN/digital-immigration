"use client"

import { useFormContext } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Imm5669Data } from "@/lib/imm5669/types"

function ParentFields({
  prefix,
  title,
  familyNameLabel,
}: {
  prefix: "father" | "mother"
  title: string
  familyNameLabel: string
}) {
  const { control } = useFormContext<Imm5669Data>()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`${prefix}.familyName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{familyNameLabel}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${prefix}.givenNames`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Given name(s)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={`${prefix}.dateOfBirth`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of birth</FormLabel>
            <FormDescription>YYYY-MM-DD (e.g. 1960-03-22). Leave blank if unknown.</FormDescription>
            <FormControl>
              <Input placeholder="1960-03-22" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`${prefix}.townCityOfBirth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Town/City of birth</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${prefix}.countryOfBirth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country of birth</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={`${prefix}.dateOfDeath`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of death (if deceased)</FormLabel>
            <FormDescription>YYYY-MM-DD. Leave blank if living.</FormDescription>
            <FormControl>
              <Input placeholder="" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function SectionParentDetails() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Parent Details
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide personal details of your father and mother.
        </p>
      </div>

      <ParentFields prefix="father" title="Father" familyNameLabel="Family name" />
      <ParentFields prefix="mother" title="Mother" familyNameLabel="Family name at birth" />
    </div>
  )
}
