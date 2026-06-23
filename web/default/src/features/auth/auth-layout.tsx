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
import { ArrowLeft, Braces, KeyRound, Route, ShieldCheck } from 'lucide-react'
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
  const capabilityItems = [
    {
      label: t('OpenAI-compatible API'),
      detail: t('Use /v1 routes with existing clients.'),
      icon: Braces,
    },
    {
      label: t('Model routing'),
      detail: t('Route text, image, and video requests.'),
      icon: Route,
    },
    {
      label: t('API keys and quota'),
      detail: t('Manage access, pricing, and usage records.'),
      icon: KeyRound,
    },
    {
      label: t('Protected access'),
      detail: t('Sign in before changing gateway settings.'),
      icon: ShieldCheck,
    },
  ]
  const endpointItems = [
    '/v1/chat/completions',
    '/v1/images/generations',
    '/v1/images/edits',
    '/v1/videos',
  ]

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]'>
      <section className='border-border/70 hidden min-h-svh border-r bg-background px-8 py-7 lg:block'>
        <div className='flex h-full flex-col'>
          <Link
            to='/'
            className='text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors'
          >
            <ArrowLeft className='size-4' />
            {t('Back to home')}
          </Link>

          <div className='mt-12 max-w-[330px] space-y-8'>
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='border-border/70 bg-muted/30 flex size-11 items-center justify-center rounded-lg border'>
                  {loading ? (
                    <Skeleton className='size-7 rounded-md' />
                  ) : (
                    <img
                      src={displayLogo}
                      alt={t('Logo')}
                      className='size-7 rounded-md object-cover'
                    />
                  )}
                </div>
                <div className='min-w-0'>
                  <div className='text-muted-foreground text-xs font-semibold uppercase'>
                    {BRAND.productLabel}
                  </div>
                  {loading ? (
                    <Skeleton className='mt-1 h-6 w-32' />
                  ) : (
                    <h1 className='truncate text-xl font-semibold'>
                      {displayName}
                    </h1>
                  )}
                </div>
              </div>
              <p className='text-muted-foreground text-sm leading-6'>
                {t(
                  'Secure console access for model routing, keys, pricing, and usage operations.'
                )}
              </p>
            </div>

            <div className='space-y-4'>
              <div className='text-muted-foreground text-xs font-semibold uppercase tracking-normal'>
                {t('Console access')}
              </div>
              <div className='space-y-4'>
                {capabilityItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className='flex gap-3'>
                      <div className='bg-muted text-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md'>
                        <Icon className='size-4' />
                      </div>
                      <div className='min-w-0 space-y-1'>
                        <div className='text-sm font-medium leading-none'>
                          {item.label}
                        </div>
                        <div className='text-muted-foreground text-xs leading-5'>
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className='border-border/70 mt-auto space-y-3 border-t pt-6'>
            <div className='text-muted-foreground text-xs font-semibold uppercase tracking-normal'>
              {t('Primary endpoints')}
            </div>
            <div className='space-y-2 font-mono text-xs'>
              {endpointItems.map((endpoint) => (
                <div
                  key={endpoint}
                  className='text-muted-foreground flex items-center gap-3'
                >
                  <span className='text-foreground w-9 shrink-0'>POST</span>
                  <span className='truncate'>{endpoint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='bg-muted/15 flex min-h-svh flex-col'>
        <div className='border-border/70 flex items-center justify-between border-b bg-background px-5 py-4 lg:hidden'>
          <Link to='/' className='flex min-w-0 items-center gap-2'>
            {loading ? (
              <Skeleton className='size-7 rounded-md' />
            ) : (
              <img
                src={displayLogo}
                alt={t('Logo')}
                className='size-7 rounded-md object-cover'
              />
            )}
            <span className='truncate font-semibold'>{displayName}</span>
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-center px-5 py-8 sm:px-8'>
          <div className='border-border/70 w-full max-w-[430px] rounded-lg border bg-background p-6 shadow-sm sm:p-8'>
            {children}
          </div>
        </div>
      </section>
    </div>
  )
}
