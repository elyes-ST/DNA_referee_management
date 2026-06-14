# Dashboard de Gestion des Arbitres — Rôles & User Stories

## Rôles fonctionnels

- **Admin DNA** : Gère l'administration générale de la plateforme et la base de données de tous les types d'arbitres (A, B, C1, C2, Jeunes, Féminines, Régionaux), ainsi que les accès/permissions, les rapports et les statistiques.
- **Finance DNA** : Gère la partie financière au niveau national : validation et suivi des paiements des arbitres, en particulier A et B, avec visibilité sur tous les autres paiements (C1, C2, Jeunes, Féminines, Régionaux).
- **Désignation DNA** : Gère les désignations nationales, en particulier pour les arbitres A et B, et peut intervenir sur les désignations des autres ligues si nécessaire.
- **CAA (Commission d'Arbitrage Amateur)** : Commission responsable des arbitres amateurs C1 et C2. Elle gère leurs désignations, leurs paiements et la mise à jour de leur base de données.
- **CAJ (Commission d'Arbitrage Jeunes)** : Commission responsable des arbitres Jeunes. Elle gère leurs désignations, leurs paiements, leur base de données ainsi que l'affectation et le suivi des commissaires pour les compétitions jeunes.
- **CAF (Commission d'Arbitrage Féminine)** : Commission responsable des arbitres Féminines. Elle gère leurs désignations, leurs paiements, leur base de données ainsi que l'affectation et le suivi des commissaires pour les compétitions féminines.
- **CRA (Commission Régionale d'Arbitrage)** : Transmet à la DNA les informations relatives aux blessures ou excuses des arbitres.
- **CDE (Commission des Examens)** : Responsable d'organiser les examens (fédéraux ainsi que les 1ère, 2ème et 3ème séries), de vérifier et valider les candidatures des arbitres, d'évaluer leurs performances et d'assurer la mise à jour de leurs niveaux et promotions.
- **CDC (Commission des Commissaires)** : Responsable de la gestion de la base de données des commissaires, de leurs affectations aux matchs et de l'ajout de leurs rapports à la base de données.
- **Arbitre** : Consulte ses informations et statistiques, valide ou refuse une désignation, envoie ses excuses ou déclare une blessure au Président CRA, reçoit ses convocations et désignations.

---

## Epic 1 : Gestion des Désignations

> Assurer une désignation équitable et automatisée des arbitres pour chaque match, tout en tenant compte de la disponibilité et des critères de performance.

| User Story | Priorité |
|---|---|
| En tant que Désignation DNA, je veux désigner les arbitres A & B (2 centraux, 2 assistants, VAR/AVAR si applicable) et contrôler/valider les désignations des autres catégories | High |
| En tant que Désignation DNA, je veux que la désignation tienne compte de la disponibilité des arbitres, de leur ligue et des rapports des commissaires, afin de respecter l'équité. | High |
| En tant que CAA, je veux pouvoir gérer les désignations des arbitres C1 et C2 pour les matchs amateurs, afin de couvrir tous les matchs relevant de ma commission. | High |
| En tant que CAJ, je veux pouvoir gérer les désignations des arbitres Jeunes, afin d'organiser les rencontres de ma catégorie. | High |
| En tant que CAF, je veux pouvoir gérer les désignations des arbitres Féminines, afin d'assurer la couverture des compétitions féminines. | High |
| En tant que CRA, je veux pouvoir gérer les désignations des arbitres régionaux, afin de planifier les matchs au niveau régional. | High |

---

## Epic 2 : Gestion des Convocations

> Convoquer les arbitres à des événements (séminaires, réunions) et suivre leurs participations.

| User Story | Priorité |
|---|---|
| En tant qu'Admin DNA, je veux convoquer certains arbitres à des séminaires ou réunions, afin de gérer la formation continue. | High |
| En tant qu'Admin DNA, je veux enregistrer la note d'un arbitre suite à un séminaire, afin de suivre sa progression. | Medium |

---

## Epic 3 : Gestion des Matchs

> Automatiser la création et la gestion du calendrier des matchs pour simplifier la planification et offrir une vue claire du déroulement de la saison.

| User Story | Priorité |
|---|---|
| En tant qu'Admin DNA, je veux importer un document Excel contenant le planning de la saison, afin que le dashboard génère automatiquement la liste des matchs. | Medium |
| En tant qu'Utilisateur, je veux pouvoir visualiser les matchs qui m'intéressent regroupés par journée ou triés par date, afin d'avoir une vue claire et organisée du calendrier. | High |
| En tant qu'Admin DNA, je veux avoir la possibilité de modifier la date d'un match à tout moment, afin de refléter les changements éventuels dans le planning réel. | High |
| En tant que CAA, je veux importer un document Excel contenant le planning de la saison Amateur, afin que le dashboard génère automatiquement la liste des matchs. | High |
| En tant que CAA, je veux modifier la date d'un match Amateur à tout moment, afin de refléter les changements éventuels dans le planning réel. | High |
| En tant que CAJ, je veux importer un document Excel contenant le planning de la saison Jeunes, afin que le dashboard génère automatiquement la liste des matchs. | High |
| En tant que CAJ, je veux modifier la date d'un match Jeunes à tout moment, afin d'adapter le planning en cas de changement. | High |
| En tant que CAF, je veux importer un document Excel contenant le planning de la saison Féminine, afin que le dashboard génère automatiquement la liste des matchs. | High |
| En tant que CAF, je veux modifier la date d'un match Féminin à tout moment, afin de mettre à jour le planning en cas de modification. | High |
| En tant que CRA, je veux importer un document Excel contenant le planning de la saison régionale, afin que le dashboard génère automatiquement la liste des matchs. | High |
| En tant que CRA, je veux modifier la date d'un match régional à tout moment, afin que le planning reflète fidèlement les changements réels. | High |
| En tant que CRA, je veux pouvoir envoyer au DNA la feuille des matchs joués dans ma région, afin de permettre la mise à jour centralisée des résultats et du suivi de la saison. | High |

---

## Epic 4 : Gestion de la Base de Données

> Assurer une gestion centralisée et structurée de toutes les données relatives aux arbitres, inspecteurs et présidents CRA.

| User Story | Priorité |
|---|---|
| En tant qu'Admin DNA, je veux gérer (CRUD) la base de données des arbitres. | High |
| En tant qu'Admin DNA, je veux gérer (CRUD) la base de données des inspecteurs. | High |
| En tant qu'Admin DNA, je veux gérer (CRUD) la base de données des présidents CRA. | High |
| En tant que CAA, je veux gérer (CRUD) les fiches des arbitres C1 et C2, afin de tenir à jour la base de données de la ligue amateur. | High |
| En tant que CAJ, je veux gérer (CRUD) les fiches des arbitres Jeunes et de leurs commissaires, afin de gérer correctement les effectifs de ma commission. | High |
| En tant que CAF, je veux gérer (CRUD) les fiches des arbitres Féminines et de leurs commissaires, afin de suivre les arbitres de ma commission. | High |
| En tant que CRA, je veux gérer (CRUD) les données des arbitres régionaux, afin de maintenir une base de données fiable au niveau régional. | High |

---

## Epic 5 : Gestion des Rapports

> Centraliser la gestion des rapports d'excuses, de blessures et de performances des arbitres afin de garantir un suivi fiable et une meilleure prise de décision par la DNA.

| User Story | Priorité |
|---|---|
| En tant que CDC, je veux rédiger un rapport de performance après chaque match en tenant compte des rapports des commissaires, afin d'évaluer le travail des arbitres. | High |
| En tant que CRA, je veux transmettre à la DNA les informations reçues des arbitres (blessures, excuses), afin d'assurer un suivi administratif. | High |
| En tant qu'arbitre, je veux pouvoir informer directement la CRA si je suis blessé ou si je dois m'excuser d'arbitrer pendant une journée, afin de permettre une meilleure organisation des désignations. | High |
| En tant qu'Admin DNA, je veux pouvoir consulter les rapports de la CDC et les informations transmises par les CRA, afin d'avoir une vision complète avant de valider les désignations. | High |

---

## Epic 6 : Authentification

> Assurer une connexion sécurisée via un système basé sur JWT, avec récupération de mot de passe et gestion de sessions.

| User Story | Priorité |
|---|---|
| En tant qu'utilisateur, je veux me connecter avec mon email et mot de passe, afin d'accéder à mon espace personnel. | High |
| En tant qu'utilisateur, je veux réinitialiser mon mot de passe en cas d'oubli, afin de ne pas perdre l'accès à mon compte. | High |
| En tant qu'utilisateur, je veux rester connecté grâce à un token JWT, afin d'éviter les reconnexions fréquentes. | Medium |

---

## Epic 7 : Gestion des Utilisateurs & Permissions

> Centraliser la gestion des comptes utilisateurs et des rôles, tout en appliquant des permissions adaptées à chaque profil (Admin DNA, Finance DNA, Désignation DNA, CAA, CAJ, CAF, CRA, Inspecteur, Arbitre).

| User Story | Priorité |
|---|---|
| En tant qu'Admin DNA, je veux créer, modifier et supprimer des comptes utilisateurs, afin de gérer efficacement les accès. | High |
| En tant qu'Admin DNA, je veux attribuer des rôles (Admin DNA, Finance DNA, Désignation DNA, CAA, CAJ, CAF, CRA, Inspecteur, Arbitre), afin de contrôler les droits d'accès. | High |
| En tant qu'utilisateur, je veux accéder uniquement aux fonctionnalités liées à mon rôle, afin d'assurer la sécurité et la clarté de l'interface. | High |
| En tant qu'utilisateur, je veux pouvoir mettre à jour mes informations personnelles (nom, email, mot de passe), afin de garder mon profil à jour. | Medium |

---

## Epic 8 : Gestion des Paiements

> Suivre les matchs réalisés par chaque arbitre et générer un bilan validé par la Finance DNA pour procéder au paiement.

| User Story | Priorité |
|---|---|
| En tant qu'arbitre, je veux que mes matchs arbitrés soient automatiquement comptabilisés dans mon bilan, afin d'avoir une visibilité sur mes paiements. | Medium |
| En tant que Finance DNA, je veux consulter et valider les bilans de matchs réalisés par chaque arbitre, afin d'avoir une trace administrative des paiements. | Medium |
| En tant que CAA, je veux consulter et valider les bilans de matchs des arbitres C1 et C2, afin de préparer leurs paiements. | Medium |
| En tant que CAJ, je veux consulter et valider les bilans de matchs des arbitres Jeunes, afin de déclencher leurs paiements. | Medium |
| En tant que CAF, je veux consulter et valider les bilans de matchs des arbitres Féminines, afin de suivre leurs paiements. | Medium |
| En tant que Président CRA, je veux consulter et valider les bilans de matchs des arbitres régionaux, afin d'assurer le suivi des paiements au niveau régional. | Medium |

---

## Epic 9 : Communication (Notifications + WhatsApp)

> Mettre en place un système de communication centralisé permettant l'envoi de notifications en temps réel et de messages, afin d'informer l'ensemble des rôles fonctionnels (Admin DNA, Finance DNA, CAA, CAJ, CAF, CRA et Arbitres) des événements importants de la plateforme.

| User Story | Priorité |
|---|---|
| En tant qu'arbitre, je veux recevoir une notification et un message WhatsApp lors de ma désignation à un match, afin d'être informé et d'avoir une confirmation écrite. | High |
| En tant qu'arbitre, je veux recevoir une notification et un message WhatsApp de convocation à un séminaire ou une réunion, afin de ne pas manquer les événements de formation. | High |
| En tant qu'arbitre, je veux recevoir un rappel (notification/WhatsApp) quelques jours ou heures avant un match ou un séminaire, afin d'assurer ma disponibilité. | Medium |
| En tant que CRA, je veux être notifié lorsqu'un arbitre envoie une excuse ou déclare une blessure, afin de pouvoir informer la DNA et ajuster les désignations. | High |
| En tant qu'Admin DNA, je veux pouvoir envoyer des notifications et des messages WhatsApp groupés (par exemple, à tous les arbitres d'une ligue ou d'une région), afin de communiquer efficacement avec plusieurs utilisateurs en même temps. | High |
| En tant qu'Admin DNA, je veux être notifié dès qu'un rapport CRA est transmis, afin de pouvoir le consulter rapidement. | Medium |
| En tant qu'utilisateur, je veux pouvoir consulter un historique de mes notifications dans le dashboard, afin de retrouver facilement toutes les communications passées. | Medium |
| En tant que CAA, je veux qu'un bilan validé des arbitres C1 et C2 soit automatiquement envoyé par WhatsApp, afin de faciliter le suivi des paiements au niveau amateur. | Medium |
| En tant que Finance DNA, je veux qu'un bilan validé soit automatiquement envoyé par WhatsApp à l'arbitre concerné, afin de fluidifier la gestion des paiements. | Low |
| En tant que CAJ, je veux qu'un bilan validé des arbitres Jeunes soit automatiquement envoyé par WhatsApp, afin de simplifier le suivi financier des arbitres jeunes. | Medium |
| En tant que CAF, je veux qu'un bilan validé des arbitres Féminines soit automatiquement envoyé par WhatsApp, afin d'assurer une transmission claire et rapide des informations financières. | High |
| En tant que CRA, je veux qu'un bilan validé des arbitres régionaux soit automatiquement envoyé par WhatsApp, afin de garantir une gestion fluide et transparente des paiements dans la région. | High |

---

## Epic 10 : Gestion des Formations & Ressources Pédagogiques

> Permettre à la DNA de centraliser et diffuser des ressources de formation (vidéos d'analyse, vidéos personnelles). Les arbitres peuvent les consulter à tout moment, tandis que la DNA peut ajouter, modifier ou supprimer ces ressources.

| User Story | Priorité |
|---|---|
| En tant qu'arbitre, je veux visionner des vidéos d'analyse de situations clés, organisées par thème (fautes, hors-jeu, comportements à sanctionner, etc.), afin d'améliorer ma prise de décision. | Low |
| En tant qu'arbitre, je veux accéder à des vidéos personnelles, afin de renforcer mes compétences de manière adaptée. | Low |
| En tant qu'Admin DNA, je veux pouvoir ajouter, modifier et supprimer des ressources pédagogiques (vidéos) pour maintenir le contenu à jour. | Low |
| En tant qu'arbitre, je veux recevoir une notification (un message WhatsApp ou interne) quand une nouvelle ressource de formation est ajoutée. | Low |

---

## Epic 11 : Suivi et Statistiques

> Fournir des indicateurs et graphiques pour évaluer l'activité arbitrale globale et individuelle.

| User Story | Priorité |
|---|---|
| En tant qu'utilisateur, je veux voir une page d'accueil avec des statistiques globales (graphes, filtres par journée, mois, saison) afin d'avoir une vue claire sur l'activité arbitrale. | High |
| En tant qu'arbitre, je veux consulter mes informations personnelles et mes statistiques. | Medium |
| En tant qu'Admin DNA, je veux accéder aux informations et statistiques de tous les arbitres, afin d'assurer un suivi global et précis. | Medium |
| En tant que CAA, je veux accéder aux statistiques des arbitres C1 et C2, afin de suivre leur activité et leurs performances. | Medium |
| En tant que CAJ, je veux accéder aux statistiques des arbitres Jeunes, afin de suivre leur progression et leurs performances. | Medium |
| En tant que CAF, je veux accéder aux statistiques des arbitres Féminines, afin d'assurer un suivi précis de leur activité. | Medium |
| En tant que CRA, je veux accéder aux statistiques des arbitres régionaux, afin de superviser leur activité au niveau régional. | Medium |
| En tant qu'Utilisateur ayant accès aux statistiques d'un arbitre, je veux visualiser une fiche de sa performance avec un speed chart et comparaisons (moyenne, min, max, état initial). | Medium |
| En tant qu'Admin DNA, je veux accéder au classement complet des arbitres (chaque catégorie à part), afin d'avoir une vision globale de leurs performances et d'identifier les meilleurs éléments. | Medium |
