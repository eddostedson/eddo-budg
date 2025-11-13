// 📝 SERVICE DE JOURNAL D'ACTIVITÉ
import { ActivityLog } from './shared-data'

class ActivityLogService {
  private logs: ActivityLog[] = []
  private readonly STORAGE_KEY = 'eddo-budg-activity-logs'

  constructor() {
    this.loadLogs()
  }

  // Charger les logs depuis le localStorage
  private loadLogs(): void {
    try {
      // Vérifier si localStorage est disponible (côté client)
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          this.logs = JSON.parse(stored)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error)
      this.logs = []
    }
  }

  // Sauvegarder les logs dans le localStorage
  private saveLogs(): void {
    try {
      // Vérifier si localStorage est disponible (côté client)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs))
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des logs:', error)
    }
  }

  // Générer un ID unique
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtenir l'adresse IP (simulation)
  private getIpAddress(): string {
    return '127.0.0.1' // En production, utiliser une API pour obtenir la vraie IP
  }

  // Obtenir le User Agent
  private getUserAgent(): string {
    return navigator.userAgent
  }

  // Créer un log d'activité
  private createLog(
    action: 'create' | 'update' | 'delete',
    entityType: 'recette' | 'depense',
    entityId: string,
    entityName: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): ActivityLog {
    const timestamp = new Date().toISOString()
    
    let description = ''
    switch (action) {
      case 'create':
        description = `${entityType === 'recette' ? 'Recette' : 'Dépense'} "${entityName}" créée`
        break
      case 'update':
        description = `${entityType === 'recette' ? 'Recette' : 'Dépense'} "${entityName}" modifiée`
        break
      case 'delete':
        description = `${entityType === 'recette' ? 'Recette' : 'Dépense'} "${entityName}" supprimée`
        break
    }

    return {
      id: this.generateId(),
      timestamp,
      action,
      entityType,
      entityId,
      entityName,
      oldValues,
      newValues,
      description,
      ipAddress: this.getIpAddress(),
      userAgent: this.getUserAgent()
    }
  }

  // Logger la création d'une recette
  logRecetteCreate(recette: any): void {
    const log = this.createLog('create', 'recette', recette.id, recette.libelle, undefined, recette)
    this.logs.unshift(log) // Ajouter au début
    this.saveLogs()
    console.log('📝 Log recette créée:', log)
  }

  // Logger la modification d'une recette
  logRecetteUpdate(recetteId: string, oldRecette: any, newRecette: any): void {
    const log = this.createLog('update', 'recette', recetteId, newRecette.libelle, oldRecette, newRecette)
    this.logs.unshift(log)
    this.saveLogs()
    console.log('📝 Log recette modifiée:', log)
  }

  // Logger la suppression d'une recette
  logRecetteDelete(recette: any): void {
    const log = this.createLog('delete', 'recette', recette.id, recette.libelle, recette, undefined)
    this.logs.unshift(log)
    this.saveLogs()
    console.log('📝 Log recette supprimée:', log)
  }

  // Logger la création d'une dépense
  logDepenseCreate(depense: any): void {
    const log = this.createLog('create', 'depense', depense.id, depense.libelle, undefined, depense)
    this.logs.unshift(log)
    this.saveLogs()
    console.log('📝 Log dépense créée:', log)
  }

  // Logger la modification d'une dépense
  logDepenseUpdate(depenseId: string, oldDepense: any, newDepense: any): void {
    const log = this.createLog('update', 'depense', depenseId, newDepense.libelle, oldDepense, newDepense)
    this.logs.unshift(log)
    this.saveLogs()
    console.log('📝 Log dépense modifiée:', log)
  }

  // Logger la suppression d'une dépense
  logDepenseDelete(depense: any): void {
    const log = this.createLog('delete', 'depense', depense.id, depense.libelle, depense, undefined)
    this.logs.unshift(log)
    this.saveLogs()
    console.log('📝 Log dépense supprimée:', log)
  }

  // Obtenir tous les logs
  getAllLogs(): ActivityLog[] {
    return [...this.logs]
  }

  // Obtenir les logs par type d'entité
  getLogsByEntityType(entityType: 'recette' | 'depense'): ActivityLog[] {
    return this.logs.filter(log => log.entityType === entityType)
  }

  // Obtenir les logs par action
  getLogsByAction(action: 'create' | 'update' | 'delete'): ActivityLog[] {
    return this.logs.filter(log => log.action === action)
  }

  // Obtenir les logs par date
  getLogsByDateRange(startDate: string, endDate: string): ActivityLog[] {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return logDate >= start && logDate <= end
    })
  }

  // Obtenir les logs récents (dernières 24h)
  getRecentLogs(): ActivityLog[] {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return this.logs.filter(log => new Date(log.timestamp) > yesterday)
  }

  // Obtenir les statistiques des logs
  getLogStats(): {
    total: number
    byAction: Record<string, number>
    byEntityType: Record<string, number>
    today: number
    thisWeek: number
  } {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const byAction = this.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byEntityType = this.logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const todayCount = this.logs.filter(log => new Date(log.timestamp) >= today).length
    const thisWeekCount = this.logs.filter(log => new Date(log.timestamp) >= weekAgo).length

    return {
      total: this.logs.length,
      byAction,
      byEntityType,
      today: todayCount,
      thisWeek: thisWeekCount
    }
  }

  // Effacer tous les logs
  clearAllLogs(): void {
    this.logs = []
    this.saveLogs()
    console.log('📝 Tous les logs ont été effacés')
  }

  // Effacer les logs anciens (plus de 30 jours)
  clearOldLogs(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const initialCount = this.logs.length
    this.logs = this.logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo)
    this.saveLogs()
    
    const deletedCount = initialCount - this.logs.length
    console.log(`📝 ${deletedCount} logs anciens ont été effacés`)
  }

  // Exporter les logs en JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Importer les logs depuis JSON
  importLogs(jsonData: string): boolean {
    try {
      const importedLogs = JSON.parse(jsonData)
      if (Array.isArray(importedLogs)) {
        this.logs = [...this.logs, ...importedLogs]
        this.saveLogs()
        console.log(`📝 ${importedLogs.length} logs importés`)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur lors de l\'import des logs:', error)
      return false
    }
  }
}

// Instance singleton
export const activityLogService = new ActivityLogService()
export default activityLogService
