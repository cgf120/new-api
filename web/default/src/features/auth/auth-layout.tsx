/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { ArrowLeft, KeyRound, Route, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'
import { BRAND } from '@/config/brand'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()
  const displayName = systemName || BRAND.name
  const displayLogo = logo || BRAND.logo
  const accessItems = [
    { label: t('Unified routing'), icon: Route },
    { label: t('Account security'), icon: ShieldCheck },
    { label: t('API key control'), icon: KeyRound },
  ]

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,560px)]'>
      <section className='border-border/70 bg-muted/25 relative hidden min-h-svh flex-col justify-between border-r px-10 py-8 lg:flex'>
        <Link
          to='/'
          className='text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors'
        >
          <ArrowLeft className='size-4' />
          {t('Back to home')}
        </Link>

        <div className='space-y-8'>
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <div className='border-border/70 bg-background flex size-12 items-center justify-center rounded-lg border shadow-sm'>
                {loading ? (
                  <Skeleton className='size-8 rounded-md' />
                ) : (
                  <img
                    src={displayLogo}
                    alt={t('Logo')}
                    className='size-8 rounded-md object-cover'
                  />
                )}
              </div>
              <div>
                <div className='text-muted-foreground text-xs font-semibold uppercase'>
                  {BRAND.productLabel}
                </div>
                {loading ? (
                  <Skeleton className='mt-1 h-7 w-36' />
                ) : (
                  <h1 className='text-2xl font-semibold tracking-tight'>
                    {displayName}
                  </h1>
                )}
              </div>
            </div>
            <div className='max-w-md space-y-3'>
              <p className='text-muted-foreground text-sm leading-6'>
                {t('Secure console access for AI gateway operations.')}
              </p>
              <div className='grid gap-2'>
                {accessItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className='border-border/70 bg-background/70 flex items-center gap-3 rounded-md border px-3 py-2 text-sm'
                    >
                      <Icon className='text-primary size-4' />
                      <span>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className='border-border/70 bg-card rounded-lg border p-4 shadow-sm'>
            <div className='text-muted-foreground mb-3 text-xs font-semibold uppercase'>
              {t('API Surface')}
            </div>
            <div className='space-y-2 font-mono text-xs'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>POST</span>
                <span className='truncate'>/v1/chat/completions</span>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>POST</span>
                <span className='truncate'>/v1/images/generations</span>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>POST</span>
                <span className='truncate'>/v1/videos</span>
              </div>
            </div>
          </div>
        </div>

        <p className='text-muted-foreground text-xs'>
          {BRAND.name} · {t('Operations Console')}
        </p>
      </section>

      <section className='flex min-h-svh flex-col'>
        <div className='flex items-center justify-between px-5 py-4 lg:hidden'>
          <Link to='/' className='flex items-center gap-2'>
            <img
              src={displayLogo}
              alt={t('Logo')}
              className='size-7 rounded-md object-cover'
            />
            <span className='font-semibold'>{displayName}</span>
          </Link>
        </div>
        <div className='flex flex-1 items-center px-5 py-8 sm:px-8'>
          <div className='mx-auto w-full max-w-[420px]'>{children}</div>
        </div>
      </section>
    </div>
  )
}
