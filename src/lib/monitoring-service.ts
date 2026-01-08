/**
 * 📊 SERVICE DE MONITORING ET PERFORMANCE
 * Basé sur les standards internationaux :
 * - Core Web Vitals (Google)
 * - RAIL Model (Response, Animation, Idle, Load)
 * - APM (Application Performance Monitoring)
 */

import { createClient } from './supabase/browser'

export interface PerformanceMetric {
  id?: string
  timestamp: string
  metric_type: 'web_vital' | 'api' | 'database' | 'user' | 'system'
  metric_name: string
  value: number
  unit: string
  status: 'good' | 'needs_improvement' | 'poor'
  metadata?: Record<string, any>
}

export class MonitoringService {
  private static supabase = createClient()
  
  /**
   * 🎯 Collecter les Core Web Vitals
   * Standards Google : LCP, FID, CLS, FCP, TTFB
   */
  static collectWebVitals(): Promise<PerformanceMetric[]> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve([])
        return
      }

      const metrics: PerformanceMetric[] = []
      const now = new Date().toISOString()

      try {
        const perfData = window.performance
        const navigation = perfData.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        if (navigation) {
          // LCP - Largest Contentful Paint (Standard: < 2.5s)
          const lcp = navigation.loadEventEnd - navigation.fetchStart
          metrics.push({
            timestamp: now,
            metric_type: 'web_vital',
            metric_name: 'LCP',
            value: lcp,
            unit: 'ms',
            status: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs_improvement' : 'poor',
            metadata: { 
              standard: '< 2500ms = Good',
              description: 'Largest Contentful Paint'
            }
          })

          // FID - First Input Delay (Standard: < 100ms)
          const fid = navigation.domInteractive - navigation.fetchStart
          metrics.push({
            timestamp: now,
            metric_type: 'web_vital',
            metric_name: 'FID',
            value: fid,
            unit: 'ms',
            status: fid < 100 ? 'good' : fid < 300 ? 'needs_improvement' : 'poor',
            metadata: { 
              standard: '< 100ms = Good',
              description: 'First Input Delay'
            }
          })

          // FCP - First Contentful Paint (Standard: < 1.8s)
          const fcp = navigation.domContentLoadedEventStart - navigation.fetchStart
          metrics.push({
            timestamp: now,
            metric_type: 'web_vital',
            metric_name: 'FCP',
            value: fcp,
            unit: 'ms',
            status: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs_improvement' : 'poor',
            metadata: { 
              standard: '< 1800ms = Good',
              description: 'First Contentful Paint'
            }
          })

          // TTFB - Time to First Byte (Standard: < 800ms)
          const ttfb = navigation.responseStart - navigation.fetchStart
          metrics.push({
            timestamp: now,
            metric_type: 'web_vital',
            metric_name: 'TTFB',
            value: ttfb,
            unit: 'ms',
            status: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs_improvement' : 'poor',
            metadata: { 
              standard: '< 800ms = Good',
              description: 'Time to First Byte'
            }
          })
        }

        // Mémoire utilisée
        if ((performance as any).memory) {
          const memory = (performance as any).memory
          const memoryUsed = memory.usedJSHeapSize / 1048576 // MB
          metrics.push({
            timestamp: now,
            metric_type: 'system',
            metric_name: 'Memory Usage',
            value: memoryUsed,
            unit: 'MB',
            status: memoryUsed < 50 ? 'good' : memoryUsed < 100 ? 'needs_improvement' : 'poor',
            metadata: { 
              total: (memory.totalJSHeapSize / 1048576).toFixed(2),
              limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2)
            }
          })
        }

      } catch (error) {
        console.error('Erreur collecte Web Vitals:', error)
      }

      resolve(metrics)
    })
  }

  /**
   * ⚡ Mesurer le temps de réponse d'une requête
   */
  static async measureQueryPerformance(
    queryName: string,
    queryFunction: () => Promise<any>
  ): Promise<{ result: any; metric: PerformanceMetric }> {
    const startTime = performance.now()
    let error = null

    try {
      const result = await queryFunction()
      const duration = performance.now() - startTime

      const metric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        metric_type: 'api',
        metric_name: queryName,
        value: duration,
        unit: 'ms',
        status: duration < 100 ? 'good' : duration < 1000 ? 'needs_improvement' : 'poor',
        metadata: { 
          success: true,
          standard: '< 100ms = Good, < 1000ms = Acceptable'
        }
      }

      // Enregistrer la métrique
      await this.logMetric(metric)

      return { result, metric }
    } catch (err) {
      error = err
      const duration = performance.now() - startTime

      const metric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        metric_type: 'api',
        metric_name: queryName,
        value: duration,
        unit: 'ms',
        status: 'poor',
        metadata: { 
          success: false,
          error: String(err)
        }
      }

      await this.logMetric(metric)

      throw error
    }
  }

  /**
   * 🗄️ Analyser les performances de la base de données
   */
  static async analyzeDatabasePerformance(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []
    const now = new Date().toISOString()

    try {
      // Test de latence base de données
      const { metric: latencyMetric } = await this.measureQueryPerformance(
        'Database Latency Test',
        async () => {
          const { data } = await this.supabase
            .from('comptes_bancaires')
            .select('id')
            .limit(1)
          return data
        }
      )

      metrics.push(latencyMetric)

      // Statistiques des tables
      const tables = ['recettes', 'depenses', 'comptes_bancaires', 'transactions_bancaires']
      
      for (const table of tables) {
        try {
          const { count } = await this.supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          metrics.push({
            timestamp: now,
            metric_type: 'database',
            metric_name: `Table Size: ${table}`,
            value: count || 0,
            unit: 'rows',
            status: (count || 0) < 10000 ? 'good' : (count || 0) < 100000 ? 'needs_improvement' : 'poor',
            metadata: { 
              table,
              estimatedSize: `${((count || 0) * 0.5 / 1024).toFixed(2)} MB`
            }
          })
        } catch (error) {
          console.error(`Erreur analyse table ${table}:`, error)
        }
      }
    } catch (error) {
      console.error('Erreur analyse DB:', error)
    }

    return metrics
  }

  /**
   * 📝 Enregistrer une métrique dans la base de données
   */
  static async logMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      await this.supabase
        .from('performance_metrics')
        .insert({
          user_id: user.id,
          timestamp: metric.timestamp,
          metric_type: metric.metric_type,
          metric_name: metric.metric_name,
          value: metric.value,
          unit: metric.unit,
          status: metric.status,
          metadata: metric.metadata
        })
    } catch (error) {
      // Ne pas faire échouer l'application si le logging échoue
      console.error('Erreur logging métrique:', error)
    }
  }

  /**
   * 📊 Récupérer l'historique des métriques
   */
  static async getMetricsHistory(
    metricType?: string,
    hours: number = 24
  ): Promise<PerformanceMetric[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const since = new Date()
      since.setHours(since.getHours() - hours)

      let query = this.supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false })

      if (metricType) {
        query = query.eq('metric_type', metricType)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur récupération historique:', error)
      return []
    }
  }

  /**
   * 🎯 Analyser les tendances de performance
   */
  static async analyzePerformanceTrends(hours: number = 24): Promise<{
    avgResponseTime: number
    errorRate: number
    slowQueries: number
    trend: 'improving' | 'stable' | 'degrading'
  }> {
    try {
      const metrics = await this.getMetricsHistory('api', hours)

      if (metrics.length === 0) {
        return {
          avgResponseTime: 0,
          errorRate: 0,
          slowQueries: 0,
          trend: 'stable'
        }
      }

      const avgResponseTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      const failedQueries = metrics.filter(m => m.status === 'poor').length
      const errorRate = (failedQueries / metrics.length) * 100
      const slowQueries = metrics.filter(m => m.value > 1000).length

      // Comparer première et deuxième moitié pour déterminer la tendance
      const midPoint = Math.floor(metrics.length / 2)
      const firstHalfAvg = metrics.slice(0, midPoint).reduce((sum, m) => sum + m.value, 0) / midPoint
      const secondHalfAvg = metrics.slice(midPoint).reduce((sum, m) => sum + m.value, 0) / (metrics.length - midPoint)

      let trend: 'improving' | 'stable' | 'degrading' = 'stable'
      const difference = Math.abs(firstHalfAvg - secondHalfAvg)
      
      if (difference > firstHalfAvg * 0.1) { // Plus de 10% de différence
        trend = secondHalfAvg < firstHalfAvg ? 'improving' : 'degrading'
      }

      return {
        avgResponseTime,
        errorRate,
        slowQueries,
        trend
      }
    } catch (error) {
      console.error('Erreur analyse tendances:', error)
      return {
        avgResponseTime: 0,
        errorRate: 0,
        slowQueries: 0,
        trend: 'stable'
      }
    }
  }

  /**
   * 🚨 Détecter les anomalies de performance
   */
  static async detectAnomalies(): Promise<Array<{
    severity: 'low' | 'medium' | 'high'
    message: string
    metric: PerformanceMetric
  }>> {
    const anomalies: Array<{
      severity: 'low' | 'medium' | 'high'
      message: string
      metric: PerformanceMetric
    }> = []

    try {
      const recentMetrics = await this.getMetricsHistory(undefined, 1)

      for (const metric of recentMetrics) {
        if (metric.status === 'poor') {
          let severity: 'low' | 'medium' | 'high' = 'low'
          let message = `${metric.metric_name} en dessous des standards`

          if (metric.metric_type === 'api' && metric.value > 5000) {
            severity = 'high'
            message = `CRITIQUE: ${metric.metric_name} très lent (${metric.value.toFixed(0)}ms)`
          } else if (metric.metric_type === 'web_vital' && metric.value > 4000) {
            severity = 'high'
            message = `CRITIQUE: ${metric.metric_name} très mauvais (${(metric.value / 1000).toFixed(1)}s)`
          } else if (metric.status === 'poor') {
            severity = 'medium'
            message = `ATTENTION: ${metric.metric_name} nécessite optimisation`
          }

          anomalies.push({ severity, message, metric })
        }
      }
    } catch (error) {
      console.error('Erreur détection anomalies:', error)
    }

    return anomalies
  }
}





