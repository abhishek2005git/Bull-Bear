'use client'
import React from 'react'
import { useForm } from "react-hook-form";
import InputField from '@/components/forms/InputField';
import { Button } from '@/components/ui/button';
import FooterLink from '@/components/forms/FooterLink';

const SignIn = () => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async(data: SignInFormData) => {
    try {
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <h1 className="form-title">Welcome Back</h1>

    <form action="" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
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
      <Button type="submit" disabled={isSubmitting}   className=" yellow-btn w-full mt-5">
          {isSubmitting ? 'Signing In' : 'Sign In'}
        </Button>

        <FooterLink text="Don't have an account" linkText="Sign Up" href="/sign-up" />
    </form>
    </>
  )
}

export default SignIn