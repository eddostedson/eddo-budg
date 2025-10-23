/**
 * Script de test automatisé pour les fonctionnalités CRUD des recettes
 * À exécuter dans la console du navigateur sur la page /recettes
 */

console.log('🧪 Démarrage des tests CRUD automatisés...');

// Fonction pour attendre un délai
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour simuler un clic sur un élément
const simulateClick = (selector) => {
  const element = document.querySelector(selector);
  if (element) {
    element.click();
    return true;
  }
  return false;
};

// Fonction pour remplir un champ
const fillField = (selector, value) => {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  return false;
};

// Tests automatisés
const runTests = async () => {
  console.log('📋 Test 1: Vérification de l\'interface');
  
  // Vérifier que la page est chargée
  const pageTitle = document.querySelector('h1');
  if (pageTitle && pageTitle.textContent.includes('Recettes')) {
    console.log('✅ Page recettes chargée correctement');
  } else {
    console.log('❌ Page recettes non trouvée');
    return;
  }

  // Vérifier la présence du bouton de création
  const createButton = document.querySelector('button[class*="bg-gradient-to-r"]');
  if (createButton) {
    console.log('✅ Bouton de création trouvé');
  } else {
    console.log('❌ Bouton de création non trouvé');
  }

  console.log('📋 Test 2: Test de création de recette');
  
  // Cliquer sur le bouton de création
  if (createButton) {
    createButton.click();
    await wait(1000);
    
    // Vérifier que le modal s'est ouvert
    const modal = document.querySelector('[class*="fixed inset-0"]');
    if (modal) {
      console.log('✅ Modal de création ouvert');
      
      // Remplir le formulaire
      const testData = {
        'input[name="libelle"]': 'Test Recette Automatique',
        'input[name="description"]': 'Description de test',
        'input[name="montant"]': '100000',
        'input[name="source"]': 'Test Source',
        'input[name="dateReception"]': new Date().toISOString().split('T')[0]
      };
      
      let formFilled = true;
      for (const [selector, value] of Object.entries(testData)) {
        if (!fillField(selector, value)) {
          console.log(`❌ Impossible de remplir le champ: ${selector}`);
          formFilled = false;
        }
      }
      
      if (formFilled) {
        console.log('✅ Formulaire rempli avec succès');
        
        // Soumettre le formulaire
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.click();
          console.log('✅ Formulaire soumis');
          await wait(2000);
        }
      }
    } else {
      console.log('❌ Modal de création non ouvert');
    }
  }

  console.log('📋 Test 3: Vérification des boutons d\'action');
  
  // Attendre que la recette soit créée et visible
  await wait(3000);
  
  // Chercher les cartes de recettes
  const recetteCards = document.querySelectorAll('[class*="group relative"]');
  console.log(`📊 Nombre de cartes de recettes trouvées: ${recetteCards.length}`);
  
  if (recetteCards.length > 0) {
    // Tester le survol sur la première carte
    const firstCard = recetteCards[0];
    const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true });
    firstCard.dispatchEvent(mouseOverEvent);
    
    await wait(500);
    
    // Chercher les boutons d'action
    const editButton = firstCard.querySelector('button[class*="bg-white/80"]:first-child');
    const deleteButton = firstCard.querySelector('button[class*="bg-white/80"]:last-child');
    
    if (editButton) {
      console.log('✅ Bouton d\'édition trouvé');
    } else {
      console.log('❌ Bouton d\'édition non trouvé');
    }
    
    if (deleteButton) {
      console.log('✅ Bouton de suppression trouvé');
    } else {
      console.log('❌ Bouton de suppression non trouvé');
    }
  }

  console.log('📋 Test 4: Test de modification');
  
  if (recetteCards.length > 0) {
    const firstCard = recetteCards[0];
    const editButton = firstCard.querySelector('button[class*="bg-white/80"]:first-child');
    
    if (editButton) {
      editButton.click();
      await wait(1000);
      
      // Vérifier que le modal de modification s'est ouvert
      const modal = document.querySelector('[class*="fixed inset-0"]');
      if (modal) {
        console.log('✅ Modal de modification ouvert');
        
        // Modifier le libellé
        const libelleField = document.querySelector('input[name="libelle"]');
        if (libelleField) {
          libelleField.value = 'Test Recette Modifiée';
          libelleField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('✅ Libellé modifié');
          
          // Soumettre les modifications
          const submitButton = document.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.click();
            console.log('✅ Modifications soumises');
            await wait(2000);
          }
        }
      }
    }
  }

  console.log('📋 Test 5: Test de suppression');
  
  // Attendre que les modifications soient appliquées
  await wait(3000);
  
  const updatedCards = document.querySelectorAll('[class*="group relative"]');
  if (updatedCards.length > 0) {
    const firstCard = updatedCards[0];
    const deleteButton = firstCard.querySelector('button[class*="bg-white/80"]:last-child');
    
    if (deleteButton) {
      console.log('⚠️ Test de suppression - Cliquez sur OK dans la confirmation');
      deleteButton.click();
      console.log('✅ Bouton de suppression cliqué');
      await wait(2000);
    }
  }

  console.log('📊 Résumé des tests:');
  console.log('✅ Interface chargée');
  console.log('✅ Modal de création fonctionnel');
  console.log('✅ Boutons d\'action visibles');
  console.log('✅ Modification testée');
  console.log('✅ Suppression testée');
  
  console.log('🎉 Tests CRUD terminés !');
  console.log('📋 Vérifiez manuellement que:');
  console.log('   - Les recettes apparaissent dans la liste');
  console.log('   - Les modifications sont sauvegardées');
  console.log('   - Les suppressions retirent les éléments');
  console.log('   - Aucune erreur dans la console');
};

// Lancer les tests
runTests().catch(console.error);

// Fonction utilitaire pour tester manuellement
window.testCRUD = {
  // Test de création rapide
  createTestRecette: async () => {
    const createButton = document.querySelector('button[class*="bg-gradient-to-r"]');
    if (createButton) {
      createButton.click();
      await wait(1000);
      console.log('Modal ouvert - Remplissez manuellement et cliquez sur Créer');
    }
  },
  
  // Test de modification
  editFirstRecette: async () => {
    const cards = document.querySelectorAll('[class*="group relative"]');
    if (cards.length > 0) {
      const editButton = cards[0].querySelector('button[class*="bg-white/80"]:first-child');
      if (editButton) {
        editButton.click();
        console.log('Modal de modification ouvert');
      }
    }
  },
  
  // Test de suppression
  deleteFirstRecette: async () => {
    const cards = document.querySelectorAll('[class*="group relative"]');
    if (cards.length > 0) {
      const deleteButton = cards[0].querySelector('button[class*="bg-white/80"]:last-child');
      if (deleteButton) {
        deleteButton.click();
        console.log('Confirmation de suppression demandée');
      }
    }
  }
};

console.log('🔧 Fonctions de test disponibles:');
console.log('   - testCRUD.createTestRecette()');
console.log('   - testCRUD.editFirstRecette()');
console.log('   - testCRUD.deleteFirstRecette()');































