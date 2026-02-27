"use client";
import React, { useState, useMemo } from "react";
import { Controller } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import countryList from "react-select-country-list";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Helper component to render the flag image
const FlagComponent = ({ country, className }: { country: string, className?: string }) => {
  const countryCode = country.toLowerCase();
  return (
    <div className={cn("relative flex h-4 w-6 shrink-0 overflow-hidden rounded-sm", className)}>
       <Image
        src={`https://flagcdn.com/w40/${countryCode}.png`}
        alt={`Flag of ${country}`}
        fill // This makes the image fill the parent container
        className="object-cover"
        sizes="30px" // Helps Next.js optimize for small size
      />
    </div>
  );
};

export const CountrySelectField = ({
  name,
  label,
  control,
  error,
  required = false,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => countryList().getData(), []);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => {
          // Find the selected country object to get the label and value
          const selectedCountry = countries.find(
            (country) => country.value === field.value
          );

          return (
            <div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                  >
                    {selectedCountry ? (
                      <div className="flex items-center gap-2">
                        {/* 1. Display Flag in Button */}
                        <FlagComponent country={selectedCountry.value} />
                        <span>{selectedCountry.label}</span>
                      </div>
                    ) : (
                      "Select country..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-gray-600">
                  <Command className="bg-gray-800 text-white">
                    <CommandInput
                      placeholder="Search country..."
                      className="text-white placeholder:text-gray-400"
                    />
                    <CommandList>
                      <CommandEmpty className="text-gray-400">
                        No country found.
                      </CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.value}
                            value={country.label}
                            onSelect={() => {
                              field.onChange(country.value);
                              setOpen(false);
                            }}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === country.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {/* 2. Display Flag in List */}
                            <FlagComponent country={country.value} className="mr-2" />
                            {country.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error.message}</p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};