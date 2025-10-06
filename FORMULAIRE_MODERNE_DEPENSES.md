# 🎨 Formulaire Ultra-Moderne pour les Dépenses

Remplacez le modal actuel (lignes 500-602 dans `/src/app/depenses/page.tsx`) par ce code :

```tsx
      {/* Modal Ultra-Moderne */}
      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-red-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-white via-red-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-red-100 overflow-hidden transform transition-all animate-slideUp">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">💸</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {editingDepense ? '✏️ Modifier' : '✨ Nouvelle Dépense'}
                    </h2>
                    <p className="text-red-100 text-sm">Enregistrez vos sorties d&apos;argent</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps du formulaire */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Sélection de la recette - Card moderne */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">💰</span>
                  Recette Source
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedRecetteId}
                    onChange={(e) => setSelectedRecetteId(e.target.value)}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all appearance-none cursor-pointer font-medium text-gray-800 pr-12"
                    required
                  >
                    <option value="">-- Choisissez la source --</option>
                    {recettes.map(recette => (
                      <option key={recette.id} value={recette.id}>
                        {recette.libelle} • {formatCurrency(recette.soldeDisponible)} disponible
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-2xl">🔽</span>
                  </div>
                </div>
              </div>

              {/* Solde disponible - Affichage élégant */}
              {selectedRecette && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💎</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Solde Disponible</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(selectedRecette.soldeDisponible)}</p>
                      </div>
                    </div>
                    {formData.montant && parseFloat(formData.montant) > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-medium">Après dépense</p>
                        <p className={`text-xl font-bold ${
                          selectedRecette.soldeDisponible - parseFloat(formData.montant) >= 0 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(selectedRecette.soldeDisponible - parseFloat(formData.montant))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Montant et Date - Grid moderne */}
              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">💵</span>
                    Montant
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.montant}
                      onChange={(e) => setFormData(prev => ({...prev, montant: e.target.value}))}
                      className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-bold text-lg pr-20"
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      FCFA
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-xl">📅</span>
                    Date
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Libellé - Input stylisé */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">🏷️</span>
                  Libellé
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData(prev => ({...prev, libelle: e.target.value}))}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  placeholder="Ex: Facture d'électricité, Loyer, Transport..."
                  required
                />
              </div>

              {/* Description - Textarea moderne */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="text-xl">📝</span>
                  Description
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optionnel)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={4}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all resize-none"
                  placeholder="Ajoutez des détails supplémentaires..."
                />
              </div>

              {/* Boutons - Design moderne */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  ❌ Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {editingDepense ? '💾 Enregistrer' : '✨ Créer la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
```

## ✨ **Caractéristiques ultra-modernes :**

1. **Header dégradé** avec icône et animations
2. **Inputs avec dégradés** et focus rings élégants
3. **Affichage en temps réel** du solde après dépense
4. **Emojis** pour une meilleure UX
5. **Animations** au hover et au clic
6. **Design responsive** et professionnel
7. **Bouton de fermeture** animé

Copiez-collez ce code pour remplacer le modal actuel !





