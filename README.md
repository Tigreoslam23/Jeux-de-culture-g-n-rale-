# Jeux de culture générale

Des jeux pour jouer en famille ou avec des amis. Le premier jeu proposé est **Tout pile !**.


## Les deux versions

- [Jouer à TOUT PILE classique](https://tigreoslam23.github.io/Jeux-de-culture-g-n-rale-/) — dates au jour, au mois ou à l’année.
- [Jouer à TOUT PILE MASTER](https://tigreoslam23.github.io/Jeux-de-culture-g-n-rale-/tout-pile-master.html) — années, indices plus / moins et univers de BD historique.

La version classique (`index.html`) est conservée sans modification.

## TOUT PILE MASTER — La bataille des années

256 événements de la version classique, les mêmes noms de joueurs à saisir (1 à 8), et 3, 5, 8 ou 12 manches. Les participants jouent à tour de rôle sur un même appareil. Les autres détournent le regard pendant chaque tour ; la réponse et le tableau des scores sont révélés après le passage de toute la troupe. Le jeu ne synchronise pas plusieurs appareils sur Discord.

L’événement arrive en dérapage (1,4 seconde), puis le chronomètre illustré démarre pour 20 secondes. Un pavé numérique permet de proposer une année : le marteau donne « C’est PLUS ! » si la réponse est plus tardive, « C’est MOINS ! » si elle est antérieure. Les briques gardent la trace des propositions, à droite pour PLUS et à gauche pour MOINS. Une réponse exacte termine immédiatement le tour avec une animation TOUT PILE.

### Score MASTER

- Points du chrono : `arrondi(10000 − 250 × secondes)`, avec les secondes entre 0 et 20. La valeur retenue est celle de la **dernière validation**, même si le joueur attend ensuite la fin du chrono.
- Chaque mauvaise proposition validée, y compris la première, produit une brique : **−200 points**. Une répétition consécutive de la même année n’est pas acceptée et ne coûte rien.
- Écart absolu entre la dernière année proposée et la bonne année. Pour un écart de 1 à 20 ans : `5000 − 250 × écart`. Au-delà : 0 point de proximité.
- Tout pile : **+5000 points**, à la place du bonus de proximité.
- Total : `max(0, chrono − briques + proximité + bonus tout pile)`. Sans proposition validée : 0.
- « Garder ma réponse » termine le tour avec la dernière proposition enregistrée. À l’expiration du chrono, cette dernière proposition est également conservée.

Exemples : tout pile à 4 secondes sans brique = **14000 points** ; à un an près à 4 secondes avec une brique = **13550 points**. Les années avant J.-C. sont négatives dans le calcul de l’écart ; aucune année zéro ne peut être saisie.

### Fichiers MASTER et personnalisation

Ouvrir `tout-pile-master.html` avec le dossier `master-assets/` à côté. Tout fonctionne sans serveur applicatif, ni bibliothèque distante. Sur GitHub Pages, les fichiers sont servis tels quels.

- `master-assets/rules.js` : calcul des points et validation des noms.
- `master-assets/game.js` : déroulement, durée des animations et interactions.
- `master-assets/master.css` : couleurs (variables `:root`), mise en page et animations.
- `master-assets/events.js` : copie intégrale des 256 événements et de leurs sources. Quelques titres donnant l’année sont reformulés uniquement pendant la question ; les données restent intactes.
- `master-assets/coin.webp` et `stopwatch.webp` : illustrations originales générées pour le jeu. Le marteau est un dessin SVG animé dans le HTML.

La réduction des animations du système est respectée. Le son est facultatif et désactivé par défaut. Souris, tactile ou clavier : chiffres, Entrée pour valider, Retour arrière pour corriger, Échap pour effacer, − / + pour changer d’ère.

Vérifications : `node tests/master.test.cjs` couvre le score, les 256 événements, les contrôles, les briques, les réponses au voisinage de l’échéance, les années avant J.-C., le mode de mouvement réduit et une partie complète à deux joueurs. Il s’agit de tests de logique avec simulation du DOM et du temps ; ils ne remplacent pas une validation visuelle dans un navigateur.

---

## Tout pile ! — Le jeu des dates de l’histoire de France

Jeu de culture générale en français : un événement historique est affiché et les joueurs choisissent une date avec la souris. Le plus proche marque des points, avec un bonus de vitesse pour le joueur le plus proche.

### Essayer le jeu

Ouvrir `index.html` dans un navigateur. Le fichier est autonome : aucune installation, connexion ou dépendance n’est nécessaire. Sur Discord, on peut partager l’écran et jouer à tour de rôle sur le même appareil.

Cette version est locale. Elle ne synchronise pas les réponses de plusieurs appareils et ne contient pas de bot Discord.

### Banque d’événements

256 questions, de 58 av. J.-C. à 2024 : 92 dates complètes, 9 dates connues au mois et 155 événements jouables à l’année. Les 200 entrées de la [chronologie transmise](sources.html) sont prises en compte : 54 figuraient déjà dans le jeu, 146 ont été ajoutées, ainsi que 31 questions supplémentaires pour distinguer des faits regroupés sur une même ligne.

Pour une année avant J.-C., cliquer sur « Avant J.-C. » dans le sélecteur, puis saisir quatre chiffres avec la souris : `0052` pour 52 av. J.-C. Les événements dont l’année est approximative sont indiqués « vers » et proposés uniquement en mode année.

Les données sont dans le tableau `EVENTS` au début du script de `index.html`. Chaque ligne contient un intitulé, une date `[année, mois, jour]` et une URL. Utiliser `null` pour un mois ou un jour non établi et une année négative pour une année avant J.-C. Le lien « chronologie fournie » renvoie à la transcription du document remis ; il indique la provenance, sans tenir lieu de vérification indépendante. D’autres cartes renvoient directement à des sources historiques institutionnelles. Pour ajouter un événement, fournir si possible une source qui confirme la précision annoncée.

### Règles

- Modes : année, année et mois, ou date complète.
- 3, 5, 8 ou 12 manches ; 15, 20 ou 30 secondes par réponse ; 1 à 8 joueurs à tour de rôle.
- Précision : `max(0, 7000 − écart en jours)`. Un tout pile vaut donc 7 000 points de précision, et un jour d’écart retire un point.
- Le joueur le plus proche reçoit aussi un bonus de vitesse allant jusqu’à 3 000 points, qui décroît pendant les dix premières secondes. En cas d’égalité de distance, le plus rapide le reçoit.
- En mode année, l’écart est mesuré entre les 1ers janvier. En mode mois, il est mesuré entre les premiers jours des mois.

### Publication avec GitHub Pages

Le dépôt est configuré pour publier la branche `main`, dossier racine `/`. Le jeu est accessible à l’adresse `https://tigreoslam23.github.io/Jeux-de-culture-g-n-rale-/` lorsque GitHub Pages a terminé le déploiement.
