// Cache local pour réduire les appels réseau
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class LocalCache {
  private static cache: Map<string, CacheEntry<any>> = new Map()
  private static readonly DEFAULT_TTL = 30000 // 30 secondes

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    })
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = (Date.now() - entry.timestamp) > entry.expiresIn
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  static clear(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  static has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const isExpired = (Date.now() - entry.timestamp) > entry.expiresIn
    if (isExpired) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

export default LocalCache
