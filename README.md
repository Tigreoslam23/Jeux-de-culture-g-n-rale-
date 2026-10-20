# Jeux de culture générale

Des jeux pour jouer en famille ou avec des amis. Le premier jeu proposé est **Tout pile !**.


## Les deux versions

- [Jouer à TOUT PILE classique](https://tigreoslam23.github.io/Jeux-de-culture-g-n-rale-/) — dates au jour, au mois ou à l’année.
- [Jouer à TOUT PILE CHRONO](https://tigreoslam23.github.io/Jeux-de-culture-g-n-rale-/tout-pile-master.html) — années, indices plus / moins et univers de BD historique.

La version classique (`index.html`) est conservée sans modification.

## TOUT PILE CHRONO — La bataille des années

Le menu propose deux modes : **Solo**, pour un défi personnel avec un nom facultatif, et **À plusieurs**, pour 2 à 8 joueurs avec l’encart des noms conservé. Les noms saisis restent en place quand on change de mode. Les deux modes utilisent les 256 événements de la version classique et permettent 3, 5, 8 ou 12 manches. En mode À plusieurs, les participants jouent à tour de rôle sur un même appareil. Les autres détournent le regard pendant chaque tour ; la réponse et le tableau des scores sont révélés après le passage de toute la troupe. Le jeu ne synchronise pas plusieurs appareils sur Discord.

L’événement arrive en dérapage (1,4 seconde), puis le chronomètre démarre pour 65 secondes : 5 secondes sans perte et 60 secondes de baisse régulière. Le pavé numérique, les indices PLUS / MOINS, les sons, le solo et le multijoueur sont conservés. Une seule brique datée reste visible de chaque côté ; la suivante écrase la précédente. Chaque côté possède son compteur de pénalités.

### Score CHRONO

- Chrono : `max(2000, 20000 − 300 × max(0, secondes actives − 5))`. La valeur retenue est celle de la dernière validation.
- Chaque mauvaise proposition validée coûte **500 points**. Une répétition consécutive de la même année est refusée sans pénalité.
- Premier essai à **100 ans ou moins : 3 s de pause**, à **20 ans ou moins : 4 s**, à **5 ans ou moins : 5 s**. Une seule fois par seuil et par tour ; les bonus se cumulent (12 s si le premier essai est à 5 ans ou moins). Le joueur peut continuer à saisir pendant la pause ; ni le chrono ni ses points ne diminuent. Les animations d’impact utilisent ce même temps.
- Écart de 1 à 10 ans : `5000 − 500 × écart`. Au-delà : aucun bonus de proximité.
- Année exacte : **+6000 points**, à la place du bonus de proximité ; fin immédiate du tour.
- Total : `max(0, chrono − pénalités + proximité + bonus exact)`. Le plancher de 2000 concerne uniquement le chrono ; les pénalités peuvent amener le total à zéro. Sans validation : zéro.

L’URL historique `tout-pile-master.html` reste valable. La version classique `index.html` est inchangée, ainsi que les 256 événements, leurs sources et les illustrations.

### Fichiers CHRONO et personnalisation

Ouvrir `tout-pile-master.html` avec le dossier `master-assets/` à côté. Tout fonctionne sans serveur applicatif, ni bibliothèque distante. Sur GitHub Pages, les fichiers sont servis tels quels.

- `master-assets/rules.js` : calcul des points et validation des noms.
- `master-assets/game.js` : déroulement, durée des animations et interactions.
- `master-assets/master.css` : couleurs (variables `:root`), mise en page et animations.
- `master-assets/events.js` : copie intégrale des 256 événements et de leurs sources. Quelques titres donnant l’année sont reformulés uniquement pendant la question ; les données restent intactes.
- `master-assets/coin.webp` et `stopwatch.webp` : illustrations originales générées pour le jeu. Le marteau est un dessin SVG animé dans le HTML.

La réduction des animations du système est respectée. Le son est activé par défaut après le clic du joueur : fanfare de trompettes synthétisées pendant l’arrivée de l’événement, et « PAF ! » percussif avec le marteau. Le bouton Son permet de le couper à tout moment. Souris, tactile ou clavier : chiffres, Entrée pour valider, Retour arrière pour corriger, Échap pour effacer, − / + pour changer d’ère.

Vérifications : `node tests/master.test.cjs` couvre le score, les 256 événements, les contrôles, les briques, les réponses au voisinage de l’échéance, les années avant J.-C., le mode de mouvement réduit et des parties complètes en solo et à deux joueurs, avec le changement de mode. Il s’agit de tests de logique avec simulation du DOM et du temps ; ils ne remplacent pas une validation visuelle dans un navigateur.

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
