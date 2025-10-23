'use client';
import React from 'react';
import { useForm } from "react-hook-form";
import InputField from '@/components/forms/InputField';
import { Button } from '@/components/ui/button';
import FooterLink from '@/components/forms/FooterLink';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { signinWithEmail } from '@/lib/actions/auth.actions';

const SignIn = () => {
  const router = useRouter();

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

  const onSubmit = async (data: SignInFormData) => {
    try {
      const response = await signinWithEmail(data);
      if (response.success) {
        toast.success('Signed in successfully!');
        router.push('/');
      }
    } catch (error) {
      toast.error('Sign In failed', {
        description: error instanceof Error ? error.message : 'Failed to sign in',
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Welcome Back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="contact@gmail.com"
          register={register}
          error={errors.email}
          validation={{
            required: 'Email address is required',
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Invalid email address',
            },
          }}
        />

        <InputField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          register={register}
          error={errors.password}
          validation={{
            required: 'Password is required',
            minLength: {
              value: 5,
              message: 'Password must be at least 5 characters long',
            },
          }}
        />

        <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>

        <FooterLink text="Don't have an account?" linkText="Sign Up" href="/sign-up" />
      </form>
    </>
  );
};

export default SignIn;
