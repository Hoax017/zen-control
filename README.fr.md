# Zen Control

**Gère ton Android TV / Google TV depuis ton navigateur** : toutes les applis (y compris système), pubs et traceurs,
télécommande en direct, réglages système, installation d'APK. **Chaque changement est noté et peut être annulé.**

🇬🇧 [Read in English](README.md)

![Applis](docs/apps.png)

## Ce que ça fait

| | |
|---|---|
| **Applis** | Toutes les applis installées avec leur vrai nom et leur icône, filtres (lançables, système, désactivées, pubs & traceurs…). Activer / désactiver / suspendre / forcer l'arrêt / ouvrir / désinstaller (tes propres applis uniquement), droits d'arrière-plan et de démarrage auto, autorisations. Actions groupées. |
| **Pubs & traceurs** | Un clic pour bloquer pubs et traceurs sur **toute la télé** avec un DNS filtrant (AdGuard, Mullvad…). Applis de pub et de pistage connues détectées et désactivables en un clic. Empêcher les applis de tourner en arrière-plan. |
| **Télécommande** | L'écran de la télé en direct et une télécommande complète (flèches, OK, retour, accueil, volume, lecture, marche/arrêt, saisie de texte). Marche aussi au clavier. |
| **Réglages** | Vitesse des animations, veille, économiseur d'écran, écran d'accueil, services d'accessibilité, infos de la télé, redémarrage, et un éditeur avancé de tous les réglages Android. |
| **Installer** | Glisse un `.apk` dans la page pour l'installer sur la télé. |
| **Journal** | Chaque changement, avec **Annuler** pour chacun ou **Tout annuler**. |

Rien n'est désinstallé dans ton dos : les applis système peuvent seulement être désactivées (réversible), et les
composants système essentiels sont verrouillés.

![Pubs & traceurs](docs/privacy.png)

## Démarrer

1. **Sur la télé** (une seule fois) : *Paramètres → Système → À propos* → clique 7 fois sur *Build de l'OS Android TV* →
   reviens dans *Système → Options pour les développeurs* → active **Débogage USB** (et **Débogage réseau** s'il existe).
2. **Installe-le** depuis la [dernière version](https://github.com/Hoax017/zen-control/releases/latest) :

   | Ton ordinateur | Fichier à télécharger | Installation |
   |---|---|---|
   | **Mac** (Apple ou Intel) | `ZenControl.dmg` | Ouvre-le et glisse **Zen Control** dans **Applications**. Lance-le ensuite depuis le Launchpad ou Spotlight. |
   | **Windows** | `zen-control-windows-x64.zip` | Dézippe, puis double-clic sur **`Zen Control.bat`** (si SmartScreen prévient : *Informations complémentaires → Exécuter quand même*). *Pas encore testé sur un vrai PC — retours bienvenus.* |
   | **Linux** | `zen-control-linux-x64.zip` (ou `-arm64`) | Dézippe, puis `./zen-control` |

   **Mac, premier lancement** : l'app n'est pas signée par Apple, macOS la bloque une fois. Ouvre
   *Réglages Système → Confidentialité et sécurité* et clique **Ouvrir quand même** (ou, dans le Terminal :
   `xattr -dr com.apple.quarantine "/Applications/Zen Control.app"`).
3. L'app n'a pas de fenêtre à elle : elle ouvre la page dans ton navigateur. Pour l'arrêter : bouton **Quitter Zen Control**
   en bas à gauche de la page, ou ferme simplement l'onglet — l'app s'arrête toute seule au bout de 10 minutes.
   Relancer l'app quand elle tourne déjà rouvre la page ; une nouvelle version remplace automatiquement l'ancienne.
4. Ton navigateur s'ouvre sur **http://localhost:8765**. Choisis ta télé, puis **accepte la fenêtre sur la télé**
   (*Autoriser le débogage USB ?* → coche *Toujours autoriser*).
5. Clique **Installer l'assistant** : une mini appli invisible qui permet d'afficher le nom et l'icône des applis.

La première fois, Zen Control propose de télécharger **adb** (l'outil officiel de Google) depuis dl.google.com.

### Depuis ton téléphone

Lance `zen-control --lan` (ou `node server.js --lan`) : un lien avec un code secret s'affiche, à ouvrir sur ton
téléphone (même Wi-Fi).

## Sécurité

- Le serveur n'écoute que sur ton ordinateur (`localhost`) et refuse les requêtes venant d'autres sites web ou
  d'autres noms d'hôte. Avec `--lan`, un code secret aléatoire est exigé.
- Les changements passent par les commandes officielles d'Android (`pm disable-user`, `appops`, `settings`…), jamais root.
- Le journal et une photo de l'état d'origine de la télé sont dans `~/.zen-control` (`%APPDATA%\zen-control` sous Windows) : ils survivent aux mises à jour.
- Les données de l'assistant ne sont lisibles que via adb (permission `DUMP`, réservée à adb et au système).

## Développeurs

Aucune dépendance. Node 18+ :

```bash
node server.js            # http://localhost:8765
node server.js --lan      # accessible depuis le téléphone, avec un lien secret
./helper/build.sh         # dist/zen-tvhelper.apk (Android SDK + JDK 11+)
./tools/build-exe.sh      # exécutables uniques Windows / Mac / Linux (nécessite bun)
```

Les versions sont compilées par GitHub Actions sur un tag `v*`. L'APK de l'assistant est signé avec les secrets
`ZEN_KEYSTORE_B64`, `ZEN_KEYSTORE_PASS`, `ZEN_KEY_ALIAS`, `ZEN_KEY_PASS`.

La liste des applis de pub et de pistage connues est dans `known-apps.json` : les pull requests sont bienvenues.

Projet frère : [Zen TV](https://github.com/Hoax017/zen-tv) (script d'allègement guidé + launcher Zen Home).

## Licence

[MIT](LICENSE). Projet indépendant, sans lien avec Google ni aucun fabricant de télé.
