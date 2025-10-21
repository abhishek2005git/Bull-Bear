"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";

const Signup = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "India",
      investmentGoals: "",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  },);



  const onSubmit = async(data: SignUpFormData) => {
    try {
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>
      <form action="" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Inputs */}
      <InputField
        name='fullName'
        label='Full Name'
        placeholder='John Doe'
        register={register}
        error={errors.fullName}
        validation={{ require: 'Full Name is required', minLength: 2}}
      
      />
      
      <InputField
        name='email'
        label='Email'
        placeholder='contact@gmail.com'
        register={register}
        error={errors.email}
        validation={{ require: 'Email address is required', pattern: /^\w+@\w+\.\w+$/
      }}
      
      />

      <InputField
        name='password'
        label='Password'
        type="password"
        placeholder='Enter a strong password'
        register={register}
        error={errors.password}
        validation={{ require: 'Password is required', minLength: 5}}
      
      />

      <CountrySelectField
        // name="country"
        // label="Country"
        // control={control}
        // error={errors.country}
        // required
      />
      <p className="text-sm text-gray-500">Helps us show market data and news relevant to you</p>

      <SelectField
        name="investmentGoals"
        label="Investment Goals"
        placeholder="Select your investment goal"
        options={INVESTMENT_GOALS}
        control={control}
        error={errors.investmentGoals}
        required
      />
      <SelectField
        name="riskTolerance"
        label="Risk Tolerance"
        placeholder="Select your risk level"
        options={RISK_TOLERANCE_OPTIONS}
        control={control}
        error={errors.riskTolerance}
        required
      />
      <SelectField
        name="preferredIndustry"
        label="Preferred Industry"
        placeholder="Select your preferred industry"
        options={PREFERRED_INDUSTRIES}
        control={control}
        error={errors.preferredIndustry}
        required
      />

        <Button type="submit" disabled={isSubmitting}   className=" yellow-btn w-full mt-5">
          {isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}
        </Button>

        <FooterLink text="Already have an account" linkText="Sign In" href="/sign-in" />
    
      </form>
    </>
  );
};

export default Signup;
