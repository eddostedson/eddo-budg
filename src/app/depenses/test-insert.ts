// Script de test pour mesurer exactement où se trouve la lenteur
// À exécuter dans la console du navigateur

export async function testInsertPerformance() {
  console.log('🔍 === TEST DE PERFORMANCE DÉTAILLÉ ===')
  
  // Test 1 : Authentification
  const authStart = performance.now()
  const { data: { user } } = await (window as any).supabase.auth.getUser()
  const authTime = performance.now() - authStart
  console.log(`1️⃣ Authentification: ${authTime.toFixed(0)}ms`)
  
  if (!user) {
    console.error('❌ Pas d\'utilisateur connecté')
    return
  }
  
  // Test 2 : Insertion simple
  const insertStart = performance.now()
  const { data, error } = await (window as any).supabase
    .from('depenses')
    .insert({
      user_id: user.id,
      libelle: 'TEST PERFORMANCE ' + Date.now(),
      montant: 1000,
      date: new Date().toISOString().split('T')[0],
      description: 'Test de performance'
    })
    .select()
    .single()
  
  const insertTime = performance.now() - insertStart
  console.log(`2️⃣ Insertion en base: ${insertTime.toFixed(0)}ms`)
  
  if (error) {
    console.error('❌ Erreur:', error)
  } else {
    console.log('✅ Insertion réussie:', data)
    
    // Supprimer le test
    await (window as any).supabase
      .from('depenses')
      .delete()
      .eq('id', data.id)
  }
  
  const totalTime = authTime + insertTime
  console.log(`🎯 TOTAL: ${totalTime.toFixed(0)}ms`)
  console.log('')
  console.log('📊 ANALYSE:')
  if (totalTime < 500) console.log('✅ EXCELLENT - Performance normale')
  else if (totalTime < 1000) console.log('⚠️ ACCEPTABLE - Peut être amélioré')
  else if (totalTime < 2000) console.log('🐌 LENT - Problème de performance')
  else console.log('🚨 TRÈS LENT - Problème majeur!')
  
  console.log('')
  console.log('🔍 CAUSE PROBABLE:')
  if (authTime > 500) console.log('- Authentification lente (cache ou réseau)')
  if (insertTime > 1000) console.log('- Base de données lente (triggers ou RLS)')
  
  return { authTime, insertTime, totalTime }
}
