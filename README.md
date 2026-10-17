# Jeux de culture générale

Des jeux pour jouer en famille ou avec des amis. Le premier jeu proposé est **Tout pile !**.

## Tout pile ! — Le jeu des dates de l’histoire de France

Jeu de culture générale en français : un événement historique est affiché et les joueurs choisissent une date avec la souris. Le plus proche marque des points, avec un bonus de vitesse pour le joueur le plus proche.

### Essayer le jeu

Ouvrir `index.html` dans un navigateur. Le fichier est autonome : aucune installation, connexion ou dépendance n’est nécessaire. Sur Discord, on peut partager l’écran et jouer à tour de rôle sur le même appareil.

Cette version est locale. Elle ne synchronise pas les réponses de plusieurs appareils et ne contient pas de bot Discord.

### Banque d’événements

79 événements de 212 à 2000, chacun avec un lien vers sa source historique. Il y a 70 dates complètes, 4 dates connues au mois et 5 événements renseignés à l’année. Le jeu affiche le nombre utilisable selon le mode choisi.

Les données sont dans le tableau `EVENTS` au début du script de `index.html`. Chaque ligne contient un intitulé, une date `[année, mois, jour]` et une URL de source. Utiliser `null` pour un mois ou un jour non établi. Pour ajouter un événement, insérer une nouvelle entrée dans ce tableau avec un libellé sans ambiguïté et une source qui confirme la précision annoncée.

### Règles

- Modes : année, année et mois, ou date complète.
- 3, 5, 8 ou 12 manches ; 15, 20 ou 30 secondes par réponse ; 1 à 8 joueurs à tour de rôle.
- Précision : `max(0, 7000 − écart en jours)`. Un tout pile vaut donc 7 000 points de précision, et un jour d’écart retire un point.
- Le joueur le plus proche reçoit aussi un bonus de vitesse allant jusqu’à 3 000 points, qui décroît pendant les dix premières secondes. En cas d’égalité de distance, le plus rapide le reçoit.
- En mode année, l’écart est mesuré entre les 1ers janvier. En mode mois, il est mesuré entre les premiers jours des mois.

### Publication facultative avec GitHub Pages

Dans les réglages du dépôt, activer **Pages** avec la branche `main` et le dossier racine `/`. Le jeu sera alors accessible à l’adresse de Pages du dépôt. L’activation de Pages est une opération distincte du dépôt des fichiers.
