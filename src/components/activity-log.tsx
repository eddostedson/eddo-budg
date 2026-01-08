// 📝 COMPOSANT JOURNAL D'ACTIVITÉ
'use client'

import React, { useState, useEffect } from 'react'
import { ActivityLog } from '@/lib/shared-data'
import { activityLogService } from '@/lib/activity-log-service'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ActivityIcon, 
  PlusIcon, 
  EditIcon, 
  Trash2Icon, 
  FilterIcon, 
  DownloadIcon, 
  TrashIcon,
  CalendarIcon,
  TrendingUpIcon,
  FileTextIcon
} from 'lucide-react'

interface ActivityLogProps {
  className?: string
}

const ActivityLogComponent: React.FC<ActivityLogProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState({
    entityType: 'all' as 'all' | 'recette' | 'depense',
    action: 'all' as 'all' | 'create' | 'update' | 'delete',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  })
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Charger les logs au montage du composant
  useEffect(() => {
    loadLogs()
    loadStats()
  }, [])

  const loadLogs = () => {
    const allLogs = activityLogService.getAllLogs()
    setLogs(allLogs)
  }

  const loadStats = () => {
    const logStats = activityLogService.getLogStats()
    setStats(logStats)
  }

  const applyFilters = useCallback(() => {
    let filtered = [...logs]

    // Filtrer par type d'entité
    if (filters.entityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filters.entityType)
    }

    // Filtrer par action
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    // Filtrer par date
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate)
    }

    setFilteredLogs(filtered)
  }, [filters, logs])

  // Appliquer les filtres
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <PlusIcon className="h-4 w-4 text-green-600" />
      case 'update':
        return <EditIcon className="h-4 w-4 text-blue-600" />
      case 'delete':
        return <Trash2Icon className="h-4 w-4 text-red-600" />
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'recette':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'depense':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else if (diffInHours < 48) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const exportLogs = () => {
    const data = activityLogService.exportLogs()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `journal-activite-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearOldLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer les logs anciens (plus de 30 jours) ?')) {
      activityLogService.clearOldLogs()
      loadLogs()
      loadStats()
    }
  }

  const clearAllLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer TOUS les logs ? Cette action est irréversible.')) {
      activityLogService.clearAllLogs()
      loadLogs()
      loadStats()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-6 w-6 text-blue-600" />
            Journal d'Activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                <div className="text-sm text-gray-600">Aujourd'hui</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
                <div className="text-sm text-gray-600">Cette semaine</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.byAction.create || 0}
                </div>
                <div className="text-sm text-gray-600">Créations</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtres et actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Filtre par type d'entité */}
              <select
                value={filters.entityType}
                onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="recette">Recettes</option>
                <option value="depense">Dépenses</option>
              </select>

              {/* Filtre par action */}
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Toutes les actions</option>
                <option value="create">Créations</option>
                <option value="update">Modifications</option>
                <option value="delete">Suppressions</option>
              </select>

              {/* Filtre par date */}
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportLogs}>
                <DownloadIcon className="h-4 w-4 mr-1" />
                Exporter
              </Button>
              <Button size="sm" variant="outline" onClick={clearOldLogs}>
                <TrashIcon className="h-4 w-4 mr-1" />
                Nettoyer
              </Button>
              <Button size="sm" variant="destructive" onClick={clearAllLogs}>
                <Trash2Icon className="h-4 w-4 mr-1" />
                Tout effacer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {log.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <Badge className={getEntityTypeColor(log.entityType)}>
                        {log.entityType}
                      </Badge>
                    </div>
                  </div>

                  {/* Détails expandables */}
                  <AnimatePresence>
                    {showDetails === log.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700 mb-2">Informations</div>
                            <div className="space-y-1">
                              <div><span className="font-medium">ID:</span> {log.entityId}</div>
                              <div><span className="font-medium">Nom:</span> {log.entityName}</div>
                              <div><span className="font-medium">Timestamp:</span> {new Date(log.timestamp).toLocaleString('fr-FR')}</div>
                              <div><span className="font-medium">IP:</span> {log.ipAddress}</div>
                            </div>
                          </div>
                          
                          {(log.oldValues || log.newValues) && (
                            <div>
                              <div className="font-medium text-gray-700 mb-2">Changements</div>
                              {log.oldValues && (
                                <div className="mb-2">
                                  <div className="text-red-600 font-medium">Anciennes valeurs:</div>
                                  <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto max-h-32">
                                    {JSON.stringify(log.oldValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValues && (
                                <div>
                                  <div className="text-green-600 font-medium">Nouvelles valeurs:</div>
                                  <pre className="text-xs bg-green-50 p-2 rounded border overflow-auto max-h-32">
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                Aucune activité trouvée avec les filtres actuels
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ActivityLogComponent
