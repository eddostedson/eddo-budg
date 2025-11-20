'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

interface TenantRecord {
  id: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface TenantOption {
  id: string
  fullName: string
}

const TENANTS_STORAGE_KEY = 'tenants'

const supabase = createClient()

const buildFullName = (tenant: TenantRecord): string => {
  const parts = [tenant.first_name, tenant.last_name].filter(Boolean)
  const fullName = parts.join(' ').trim()
  return fullName || tenant.id
}

const loadTenantsFromStorage = (): TenantRecord[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(TENANTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.error('❌ Erreur lors du chargement des locataires depuis localStorage:', error)
    return []
  }
}

const saveTenantsToStorage = (tenants: TenantRecord[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants))
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des locataires dans localStorage:', error)
  }
}

export const useTenants = () => {
  const [tenants, setTenants] = useState<TenantRecord[]>([])

  useEffect(() => {
    const load = async () => {
      const localTenants = loadTenantsFromStorage()

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setTenants(localTenants)
          return
        }

        const { data, error } = await supabase
          .from('receipts')
          .select('id, nom_locataire')
          .eq('user_id', user.id)

        if (error) {
          console.error('❌ Erreur lors du chargement des locataires depuis les reçus:', error)
          setTenants(localTenants)
          return
        }

        const receiptTenants: TenantRecord[] =
          (data || [])
            .map((row: any, index: number) => {
              const name: string = (row.nom_locataire || '').trim()
              if (!name) return null
              const [firstName, ...rest] = name.split(' ')
              const lastName = rest.join(' ')
              return {
                id: row.id || `receipt-tenant-${index}`,
                first_name: firstName,
                last_name: lastName
              } as TenantRecord
            })
            .filter(Boolean) as TenantRecord[]

        // Fusionner les noms provenant des reçus et du localStorage, en évitant les doublons
        const mergedByName = new Map<string, TenantRecord>()

        const addList = (list: TenantRecord[]) => {
          for (const tenant of list) {
            const name = buildFullName(tenant)
            if (!name) continue
            const key = name.toLowerCase()
            if (!mergedByName.has(key)) {
              mergedByName.set(key, tenant)
            }
          }
        }

        addList(receiptTenants)
        addList(localTenants)

        setTenants(Array.from(mergedByName.values()))
      } catch (error) {
        console.error('❌ Erreur inattendue lors du chargement des locataires:', error)
        setTenants(loadTenantsFromStorage())
      }
    }

    load()
  }, [])

  const tenantOptions: TenantOption[] = tenants
    .map((tenant) => ({
      id: tenant.id,
      fullName: buildFullName(tenant)
    }))
    .filter((option) => option.fullName.trim().length > 0)

  const addTenantIfNotExists = (fullName: string) => {
    const cleanedName = fullName.trim()
    if (!cleanedName) return

    const alreadyExists = tenantOptions.some(
      (option) => option.fullName.toLowerCase() === cleanedName.toLowerCase()
    )

    if (alreadyExists) return

    const [firstName, ...rest] = cleanedName.split(' ')
    const lastName = rest.join(' ')

    const newTenant: TenantRecord = {
      id: `tenant-${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedTenants = [...tenants, newTenant]
    setTenants(updatedTenants)
    saveTenantsToStorage(updatedTenants)
  }

  return {
    tenants,
    tenantOptions,
    addTenantIfNotExists
  }
}


