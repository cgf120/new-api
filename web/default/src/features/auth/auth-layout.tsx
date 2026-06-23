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
import { ArrowLeft } from 'lucide-react'
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

  return (
    <div className='bg-muted/15 min-h-svh'>
      <main className='flex min-h-svh items-center justify-center px-5 py-12 sm:px-8'>
        <div className='w-full max-w-[430px] space-y-6'>
          <Link to='/' className='mx-auto flex w-fit items-center gap-3'>
            <div className='border-border/70 bg-background flex size-11 shrink-0 items-center justify-center rounded-lg border shadow-sm'>
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
              {loading ? (
                <Skeleton className='h-6 w-32' />
              ) : (
                <span className='block truncate text-lg font-semibold'>
                  {displayName}
                </span>
              )}
            </div>
          </Link>

          <div className='border-border/70 rounded-lg border bg-background p-6 shadow-sm sm:p-8'>
            {children}
          </div>

          <Link
            to='/'
            className='text-muted-foreground hover:text-foreground mx-auto flex w-fit items-center gap-2 text-sm font-medium transition-colors'
          >
            <ArrowLeft className='size-4' />
            {t('Back to home')}
          </Link>
        </div>
      </main>
    </div>
  )
}
