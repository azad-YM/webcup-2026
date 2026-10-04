# Citizen — mes données et récapitulatif des demandes (lot L16)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Mes données
<!-- navigation:end -->

Demandes Webcup : F55 (récupérer les informations personnelles que la ville possède sur soi, sous une forme claire et exploitable) et F56 (télécharger un récapitulatif lisible de ses demandes). **État : 🟡 livré, non testé, non vérifié dans un navigateur.**

## Mes données (F55)

Le citoyen ouvre « Mes données » ([site, `/espace/mes-donnees`](../../../../front/apps/site/doc/parcours-citoyen.md#mes-données-et-récapitulatif-f55-f56)), confirme son identité, consulte une page regroupée par rubriques et peut télécharger un fichier JSON.

| Cas d’usage | Route | Code |
|---|---|---|
| `ExportMyPersonalData` | `POST /api/citizen/me/personal-data` `{password}` ou `{challengeId, code}` | `Application/Command/ExportMyPersonalData` |

- **Confirmation d’identité** : mot de passe, ou code à 6 chiffres reçu par e-mail (demandé à IAM par `POST /api/iam/me/reconfirmation-codes`) pour qui se connecte par lien. Refus : `403 invalid_password`, `422 invalid_code` (`remainingAttempts`), `410 code_expired`, `429 too_many_attempts`, `422 missing`. Le refus est retourné (non levé) pour que l’essai de code manqué reste compté par IAM.
- **Orchestration** : Citizen rassemble ses propres données ; les données du compte de connexion viennent d’IAM par le port `Application/Ports/Provider/PersonalAccountDataProvider` (DTO `PersonalAccountData`, `AccountReconfirmation`), implémenté par `IAM/Infrastructure/Adapter/Citizen/IAMPersonalAccountDataProvider`. Aucune lecture des tables d’IAM. Aucun mot de passe, empreinte, jeton ni code dans l’export.
- **Journal** : chaque export est inscrit au journal des actions (`AuditTrail`, action `citizen.personal-data.exported`, acteur = le citoyen), dans la transaction.
- Réponse `Cache-Control: no-store`. Compte non citoyen : `404`.

### Format JSON (`nova-terra.donnees-personnelles`, version 1)

```json
{
  "format": "nova-terra.donnees-personnelles",
  "version": 1,
  "generatedAt": "2026-10-04T09:12:00+00:00",
  "controller": "Mairie de Nova Terra",
  "sections": [
    { "key": "compte", "title": "Compte de connexion", "explanation": "…", "data": { "email": "…", "name": "…", "status": "active", "emailVerificationEnabled": false } }
  ]
}
```

Chaque rubrique porte `key` (stable), `title`, `explanation` (phrase destinée au citoyen) et `data` :

| `key` | `data` | Source |
|---|---|---|
| `compte` | `{email, name, status, emailVerificationEnabled}` | IAM (port) |
| `profil` | vue `CitizenProfile` | Citizen |
| `preferences` | `{district, healthConsent}` | Citizen |
| `demandes` | liste de `ServiceRequestView` (numéro de suivi, état, étapes) | Citizen |
| `rendez-vous` | liste des vues de rendez-vous | Citizen |
| `notifications` | 500 plus récentes, `CitizenNotificationView` | Citizen |
| `participation` | `{concerns: ConcernView[], supports: [{reference, subject, supportedAt}]}` | Citizen |
| `appareils` | `[{label, firstSeenAt, lastUsedAt, trustedUntil}]` | IAM (port) |
| `connexions` | 50 plus récentes : `[{at, method, deviceLabel, secondFactor, ip}]` | IAM (port) |

Dates ISO 8601. Toute évolution incompatible change `version`.

## Récapitulatif des demandes (F56)

Aucun endpoint dédié : la page `/espace/demandes/recapitulatif` du site se construit sur `GET /api/citizen/requests` (numéros de suivi, état, dates, étapes et commentaires). Elle est imprimable (mise en page d’impression : sans en-tête ni pied de page, demandes non coupées) et propose un CSV UTF-8 avec BOM, séparateur `;`, en-têtes en français : Numéro de suivi, Type, Objet, Lieu, État, Envoyée le, Dernière mise à jour, Étapes. Les cellules commençant par `=`, `+`, `-`, `@` sont neutralisées (pas de formule).

## Limites

- Ni testé ni vérifié dans un navigateur.
- Pas d’export des pièces jointes (aucune n’existe aujourd’hui) ni des journaux tenus par les agents.
- Le récapitulatif PDF passe par « Enregistrer en PDF » de la fenêtre d’impression du navigateur.

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [IAM — connexion renforcée](../../IAM/doc/connexion-renforcee.md)
- [Parcours citoyen du site](../../../../front/apps/site/doc/parcours-citoyen.md)
<!-- backlinks:end -->
