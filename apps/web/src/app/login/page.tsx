'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { LoginRequest, type LoginResponse } from '@helpdesk/contract';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HalamanLogin() {
  const router = useRouter();
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(LoginRequest) });

  async function onSubmit(data: LoginRequest) {
    setErrorUmum(null);
    try {
      await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      router.push('/beranda');
    } catch (e) {
      if (e instanceof ApiError) {
        // Error per field dari API dipetakan langsung ke form — inilah gunanya
        // `fields` di bentuk error seragam.
        if (e.fields) {
          for (const [nama, pesan] of Object.entries(e.fields)) {
            setError(nama as keyof LoginRequest, { message: pesan });
          }
        } else {
          setErrorUmum(e.message);
        }
      } else {
        setErrorUmum('Tidak dapat menghubungi server.');
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Socfindo Helpdesk</CardTitle>
          <CardDescription>Masuk dengan akun agent kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {errorUmum && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
              >
                {errorUmum}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Memproses…' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
