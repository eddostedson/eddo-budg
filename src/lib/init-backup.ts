// Script d'initialisation du système de sauvegarde
import { backupService } from './backup-service'

export async function initializeBackupSystem() {
  try {
    console.log('🛡️ Initialisation du système de sauvegarde...')
    
    // Démarrer le service de sauvegarde automatique (30 minutes)
    await backupService.startAutoBackup(30)
    
    console.log('✅ Système de sauvegarde initialisé avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du système de sauvegarde:', error)
    return false
  }
}

// Fonction pour arrêter le système
export function stopBackupSystem() {
  backupService.stopAutoBackup()
  console.log('⏹️ Système de sauvegarde arrêté')
}















