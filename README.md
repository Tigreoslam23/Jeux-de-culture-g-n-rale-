# Jeux de culture générale

Des jeux pour jouer en famille ou avec des amis. Le premier jeu proposé est **Tout pile !**.

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
