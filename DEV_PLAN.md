# Entwicklungsplan: "Narco Cards: The Gathering"

Ziel: Das bestehende HTML-Projekt (narco-cards-standalone.html) in diesem Repo vollständig fertigstellen — ein vollständiges, responsives, lokal speicherbares Kartenspiel mit Deckbau-, Shop- und Kampf-Modulen, fehlerfrei und spielbar.

Wichtig: Ich warte auf keine Präsentation, bis das Spiel 100% funktioniert (wenn die Implementierung abgeschlossen und getestet ist), wie du verlangt hast.

1) Annahmen / Standardentscheidungen (kann ich ändern, falls du Präferenzen nennst)
   - Das Spiel wird Singleplayer gegen eine einfache KI sein.
   - Spiel-Engine: reines JavaScript (kein externes Build-System), in eine oder mehrere Dateien im Repo integriert.
   - Assets: wenn keine Grafiken bereitgestellt werden, verwende ich SVG-Placeholder und CSS-Icons; Karten werden per data-Objekten definiert.
   - Persistenz: localStorage (Speichern/Laden des Spielerfortschritts und Decks).
   - Responsive UI: vorhandene 1024x1024 Stage wird beibehalten, Overlays für Collection/Deckbuilder/Shop/Kampf.
   - Tests: manuelle QA durch Browser, einfache JS-Fehlerbehandlung/Console-Logs und try/catch; ich werde automatisierte smoke-tests als HTML/JS-Snippets beifügen.

2) Funktionsumfang / Milestones
   - M1: Repo-Organisation & Grundgerüst
       - Extrahiere/erweitere narco-cards-standalone.html in strukturierte Dateien (index.html, style.css, game.js) oder behalte Einzel-Datei falls gewünscht.
       - Erstelle DEV_PLAN (diese Datei), CHANGELOG, und simple README.
   - M2: Datenmodell
       - Karten-Definitionen (id, name, rarity, power, defense, cost, description, tags).
       - Deck-/Collection-Strukturen, Shop-Inventory.
   - M3: UI-Komponenten
       - Collection-Grid, Deckbuilder, Shop-Overlay, Kampf-Screen, HUD, Toasts.
   - M4: Spiel-Logik
       - Ziehen/Handlimit, Mana/Energie-System, Spielrunden, Angriffs- und Verteidigungsauflösung.
       - Gegner-KI: einfache heuristische Entscheidungen (spielen stärkste Karte bis Mana aufgebraucht).
   - M5: Persistenz & Einstellungen
       - Save/Load, Zurücksetzen, Player-Name, Sound (optional).
   - M6: Tests & Bugfixing
       - Manuelle Durchläufe, Browser-Kompatibilität, Debug-Ausgaben entfernen.
   - M7: Release
       - Vollständige Version in repo, kurze Gebrauchsanleitung im README.

3) Entscheidungs-Punkte für dich (bitte kurz bestätigen oder angeben):
   - Möchtest du, dass ich die Spiel-Dateien in mehrere Dateien (index.html, js/, css/) aufteile oder alles in die vorhandene single-file beibehalte?
   - Hast du Grafiken, Sound-Dateien oder CI/CD-Präferenzen, die ich nutzen soll? Wenn nicht, erstelle ich Platzhalter-SVGs.
   - Branch-Strategie: direkt auf Default-Branch committen (Standard) oder in einem neuen Branch (z.B. `feature/full-game`)?

4) Nächste Schritte (sofort)
   - Wenn du zustimmst, erstelle ich ein kleines, nicht-produktives Projekt-Layout (README, DEV_PLAN done) und lege eine neue Branch `feature/full-game` an. Danach implementiere ich M1–M3 und mache dir kurze Status-Updates (commits im Repo). Ich präsentiere jedoch das fertige Spiel erst, wenn alles getestet und fehlerfrei ist.

Wenn du möchtest, beantworte bitte die drei Entscheidungs-Punkte oben kurz, ansonsten beginne ich mit den Standardannahmen und lege die Branch `feature/full-game` an und pushe die ersten Dateien.
