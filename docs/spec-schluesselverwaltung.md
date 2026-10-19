# Spec: Schlüsselverwaltung

> Status: **Phase 1, 2 und Verwahrung umgesetzt** · 19.10.2026 · Teil der bestehenden Applikation (Payload 3 + Next.js), keine separate App.

Die Applikation verwaltet heute Fahrzeuge: Objekt → Person → Historie. Schlüssel folgen demselben Muster, brechen aber an drei Punkten mit dem Fahrzeugmodell (→ Kap. 3). Diese Spec beschreibt das Datenmodell, die Regeln und die Bedienung für alle übrigen Schlüssel einer Einheit — Zimmer, Materiallager, Waffenlokal, Anlage, Büro, Badge.

---

## 1. Ziel

Eine Zentrale (Wache, Fourier, Quartiermeister, Zeugwart) gibt Schlüssel aus und nimmt sie zurück. Heute geschieht das mit Schlüsselbrett, Marke und Papierliste. Die App soll genau diesen Ablauf abbilden — nicht ersetzen, sondern nachführen:

1. **Ausgabe in zwei Schritten**: Person wählen, Schlüssel wählen, quittiert.
2. **Rücknahme in einem Schritt**: Nummer scannen oder tippen, zurücknehmen.
3. **Jederzeit beantwortbar**: Wer hat was? Was ist überfällig? Was fehlt am Brett?
4. **Übergabe und Austritt abgesichert**: kein Dienstende mit offenem Materiallager-Schlüssel.

Nicht-Ziel: elektronische Zutrittssteuerung. Die App verwaltet **Berechtigungsnachweise und deren Herausgabe**, sie öffnet keine Türen.

---

## 2. Recherche: Welche Schlüssel gibt es?

### 2.1 Quellenlage — ehrlich deklariert

Zur Schlüsselverwaltung der Schweizer Armee ist **öffentlich nichts Verbindliches verfügbar**. Die relevanten Reglemente, Betriebsreglemente der Waffenplätze und Weisungen der LBA sind nicht publiziert. Belegbar sind nur:

- die technische Schliessanlagen-Hierarchie (Zylinderhersteller),
- der gesetzliche Rahmen (ISG/ISV, Anlageschutzverordnung, PSPV),
- der Funktionsumfang kommerzieller Schlüsselverwaltungssoftware,
- die US-Praxis für Waffen- und Munitionsschlüssel (AR 190-11) als Analogie.

Die Gliederung in Kap. 2.2 bis 2.4 ist deshalb aus Truppenpraxis und diesen Quellen **abgeleitet, nicht zitiert**. Vor dem Einsatz bei einem Bedarfsträger muss ein Fachoffizier (Kdt, Fourier, Zeugwart) die Liste bestätigen. Das Datenmodell ist bewusst so gebaut, dass Korrekturen nur Stammdaten betreffen, nicht Code.

### 2.2 Schlüsselgruppen

| Gruppe | Typische Schlüssel | Risiko | Besonderheit |
|---|---|---|---|
| **Unterkunft** | Mannschafts- und Kaderzimmer, Theoriezimmer, Aufenthaltsraum, Dusche/WC, Putzraum, Spind/Schliessfach, Vorhängeschlösser | normal | Massenware, viele Exemplare, Tagesausgabe, hoher Durchsatz bei Einrücken/Entlassung |
| **Material / Logistik** | Materiallager, Magazin, Zeughaus, Korpsmaterialraum, Werkstatt, Ersatzteillager, Fahrzeughalle/Garage, Tankanlage, Container, Werkzeugschrank, Küche/Verpflegungsmagazin, Kühlraum | erhöht | Dauerausgabe an Funktionsträger; Rückgabe an Funktionswechsel gekoppelt |
| **Sicherheitsrelevant** | Waffenlokal/Waffenkammer, Munitionsmagazin, Sprengmittelmagazin, Panzerschrank für klassifizierte Dokumente, Krypto-/Fm-Material, Serverraum, Medikamentenschrank (Btm) | **hoch** | Vier-Augen-Prinzip, getrennte Aufbewahrung, lückenlose Quittung, teils Zahlenkombination zusätzlich zum Schlüssel |
| **Führung / Büro** | Kdo-Posten, Büro Kdt/S1–S4, Archiv, Kasse/Geldkassette, Postfach, **Schlüsselkasten selbst**, Fahrzeug-Schlüsselbrett | erhöht | Der Schlüssel zum Schlüsseldepot ist selbst ein zu verwaltender Schlüssel |
| **Anlage / Infrastruktur** | Haupttor, Barriere, Perimetertor, Technik-/Heizungs-/Elektroraum, Lift, Dachzugang, Nottür, Feuerwehr-Schlüsseldepot, Kampf- und Führungsinfrastruktur (Anlagen, Kavernen) | hoch | Schutzzone nach Anlageschutzverordnung; Zugang zu Schutzzone 2/3 ist sicherheitsempfindliche Tätigkeit und PSP-pflichtig |
| **Elektronisch** | Zutrittsbadge, Transponder, PIN/Code, Tresorkombination | je nach Objekt | Kein Metall, aber identischer Prozess: Ausgabe, Quittung, Sperrung, Rückgabe. Gleiche Collection, anderer `medium`-Wert |

### 2.3 Hierarchie der Schliessanlage

Die Stufe entscheidet über das Schadenausmass, nicht die Grösse des Schlüssels:

| Stufe | Kürzel | Öffnet | Verlustfolge |
|---|---|---|---|
| Einzelschlüssel | ES | eine Tür | Zylinder tauschen |
| Gruppenschlüssel | GS | eine Gruppe (z.B. Stockwerk) | Gruppe umbauen |
| Hauptschlüssel | HS | mehrere Gruppen | Teilumbau Anlage |
| Generalhauptschlüssel | GHS | gesamte Anlage | **Umbau der ganzen Schliessanlage** |

Konsequenz für die App: Verlust eines GHS ist kein Vorfall derselben Klasse wie ein verlorener Zimmerschlüssel. Die Impact-Anzeige (Kap. 7.5) nimmt das auf. Sicherheitshinweis aus der Branchenpraxis: Haupt- und Gruppenschlüssel werden **nicht** mit «GHS»/«GS» beschriftet — die App zeigt die Stufe, der physische Anhänger trägt nur eine neutrale Nummer.

### 2.4 Prozesse, die das Modell tragen müssen

1. **Quittung bei Ausgabe** — wer, was, wann, warum, bis wann. Bei Risiko hoch: zweite Unterschrift (Vier-Augen).
2. **Marke / Pfand** — am Brett hängt an Stelle des Schlüssels eine Marke mit Nummer. Die Marke ist nachzuführen, sonst stimmt Brett ≠ App.
3. **Tages- vs. Dauerausgabe** — Zimmerschlüssel kommt abends zurück; der Materiallager-Schlüssel bleibt beim Fourier bis Funktionswechsel. Zwei Fristenregime.
4. **Notschlüssel im versiegelten Kuvert** — Reserveschlüssel liegen versiegelt mit Siegelnummer. Nicht die Ausgabe ist das Ereignis, sondern **das Brechen des Siegels**. Muss mit Grund protokolliert werden.
5. **Schlüsselinventur / -rapport** — periodisch und bei Übergabe: jeden Schlüssel zählen, Differenzen festhalten.
6. **Wachübergabe** — bei Schichtwechsel werden offene Ausgaben gezählt und quittiert übergeben.
7. **Verlust** — Meldung, Sperrung des Exemplars, Entscheid Umbau, Kostenfolge.
8. **Dienstaustritt / Ende WK** — Rückgabekontrolle über alle Schlüssel einer Person. Der häufigste reale Fehler: Soldat fährt mit Schlüssel heim.

### 2.5 Verwahrungs- und Verschlussarten

Das Schlüsselbrett ist nur die sichtbarste Form. In einer Einheit kommen mehrere nebeneinander vor, mit unterschiedlichen Regeln:

| Art | Was es ist | Verschluss | Typische Stufe | Besonderheit |
|---|---|---|---|---|
| **Schlüsselbrett** | offene Tafel mit Haken, meist mit Markensystem | offen, nur Aufsicht | keine | schnell, nur für Risikoklasse «Normal» |
| **Schlüsselschrank** | abschliessbarer Stahlschrank mit nummerierten Haken | Schlüssel oder Code | EN 14450 S1/S2 | der Schlüssel zum Schrank ist selbst zu verwalten |
| **Schlüsseltresor** | Wertschutzschrank für Schlüssel | Doppelbart plus Zahlenschloss | EN 1143-1 Grad 0–5 | für Waffen-, Munitions- und Anlagenschlüssel |
| **Elektronisches Ausgabesystem** | Ausgabeautomat, jeder Schlüssel an einem Chip-Anhänger | Badge, PIN oder Biometrie | S2 und höher | gibt selbst frei und protokolliert automatisch — keine Quittung von Hand |
| **Objektdepot** | Depot an der Aussenwand für Dritte, etwa die Feuerwehr | Schliessung der Einsatzkräfte | Klasse 1–3 | Zugriff durch Dritte, Sabotagekontakt auf die Alarmanlage, meldepflichtig |
| **Siegelschrank** | Behälter für versiegelte Notschlüssel | Siegel | je nach Inhalt | nicht die Ausgabe, der Siegelbruch ist das Ereignis |
| **Panzerschrank** | Behälter für klassifizierte Dokumente, hält auch Schlüssel | Doppelbart plus Code | Grad 0 und höher | fällt zusätzlich unter den Informationsschutz |
| **Mobil** | Schlüsselbund am Mann | keiner | keine | faktisch Dauerausgabe, gehört trotzdem erfasst |
| **Elektronische Berechtigung** | Badge, Transponder, mechatronischer Schlüssel, Code | kein physischer Ort | — | bei Verlust wird gesperrt und ausprogrammiert statt umgebaut |

Zwei Befunde prägen das Modell:

1. **Der Verwahrungsort ist das schwächste Glied.** Das Oberverwaltungsgericht Münster hat für Waffenschrankschlüssel entschieden, dass sie in einem Behältnis liegen müssen, das demselben Sicherheitsstandard genügt wie das, was der Schlüssel öffnet. Ein Tresorschlüssel im Schreibtisch macht den Tresor wertlos.
2. **Elektronische Berechtigungen kehren die Verlustrechnung um.** Beim mechanischen Schlüssel kostet der Verlust den Zylindertausch, bei der elektronischen Berechtigung nur einen Eintrag: sperren und aus den betroffenen Zylindern ausprogrammieren.

### 2.6 Rechtlicher Rahmen (einzuhaltende Anker, nicht erschöpfend)

- **ISG / ISV** (Informationssicherheitsgesetz und -verordnung, in Kraft seit 1.1.2024, ersetzen die Informationsschutzverordnung ISchV SR 510.411): Behandlung klassifizierter Informationen → betrifft Schlüssel zu Panzerschränken und Archiven.
- **Anlageschutzverordnung** (2.5.1990): Schutzzonen 1/2/3 militärischer Anlagen.
- **PSPV**: Zugang zu Schutzzone 2 oder 3 ist sicherheitsempfindlich und setzt eine Personensicherheitsprüfung voraus.

Daraus wird eine harte Produktfunktion (Kap. 7.1): Die App verweigert die Ausgabe eines schutzzonenpflichtigen Schlüssels an eine Person ohne gültige PSP.

---

## 3. Die drei Brüche gegenüber dem Fahrzeugmodell

Ein Schlüssel ist **kein** Fahrzeug mit anderem Label. Wer `Vehicles.ts` kopiert, baut drei Fehler ein:

| # | Fahrzeug | Schlüssel | Folge für das Modell |
|---|---|---|---|
| 1 | eindeutig (eine M-Nummer = ein Objekt) | existiert in **N Exemplaren** («Zimmer 204, Exemplar 2 von 3») | Trennung **Schliessung** (die Tür/der Zylinder) ↔ **Exemplar** (das Stück Metall). Zugewiesen wird das Exemplar. |
| 2 | wird einzeln zugewiesen | wird im **Bund** herausgegeben (ein Bund «Wache Nord» = 12 Schlüssel, eine Unterschrift) | Bund als eigene Entität, Zuweisung kaskadiert atomar auf alle Exemplare |
| 3 | flach (kein Fahrzeug «enthält» ein anderes) | **hierarchisch** (GHS deckt GS deckt ES) | Schliessanlage + Hierarchiestufe + Risikoklasse; Verlust wirkt über die Hierarchie |

Zusätzlich zwei Dinge, die Fahrzeuge nicht kennen: **Rückgabefrist** (Schlüssel sind fällig, Fahrzeuge nicht) und **Inventur** (Existenznachweis am Brett).

Übernommen wird dagegen bewusst: Zuweisungs-Hook mit automatischem Status, Historie, die den Löschen einer Person überlebt (`userName`-Snapshot), `UserCombobox`, Statusbadges, die Server-Action-Struktur.

---

## 4. Datenmodell

Sechs neue Collections. Namensschema `key-*`, Admin-Gruppe «Schlüssel».

### 4.1 `locking-systems` — Schliessanlage

```ts
{
  name: text (required)              // «Kaserne Ost», «Anlage A4711»
  location: text                     // Standort/Objekt
  manufacturer: text
  notes: textarea
}
```
Optional. Ohne Anlage funktioniert alles, nur die Umbau-Impact-Analyse ist dann unvollständig.

### 4.2 `key-categories` — Kategorie

Spiegelt `Categories` (name, icon, sortOrder) plus:
```ts
{
  defaultRisk: select<normal|erhoeht|hoch>   // Vorschlag für neue Schliessungen
}
```
Eigene Collection statt Erweiterung von `categories`, damit die Fahrzeug-Auswahl nicht mit Schlüsselkategorien verschmutzt wird. → offener Entscheid 9.1.

Seed: Unterkunft 🚪 · Material 📦 · Sicherheit 🔒 · Führung 📁 · Anlage 🏢 · Elektronisch 💳

### 4.3 `keys` — Schliessung (der Typ, nicht das Stück)

```ts
{
  label: text (required)             // «Zimmer 204», «Materiallager Nord»
  keyNumber: text (unique, index)    // Prägung/Nummer, z.B. «ZI-204»
  category: rel → key-categories (required)
  lockingSystem: rel → locking-systems
  hierarchy: select<ES|GS|HS|GHS>  default ES
  risk: select<normal|erhoeht|hoch> default aus Kategorie
  protectionZone: select<keine|zone1|zone2|zone3>  default keine
  requiresPsp: checkbox             // auto true bei zone2/zone3
  requiresFourEyes: checkbox        // auto true bei risk=hoch
  opensLocation: text               // Raum/Objekt (Phase 2: rel → locations)
  image: upload → media
  notes: textarea
  // virtuell: copiesTotal, copiesOut
}
```

### 4.4 `key-copies` — Exemplar (die zuweisbare Einheit)

```ts
{
  key: rel → keys (required)
  copyNumber: number (required)      // 1..n, unique je key
  medium: select<mechanisch|badge|transponder|code|vorhaengeschloss> default mechanisch
  status: select<...>                // siehe 4.7, readOnly (Hook-geführt)
  storageSlot: text                  // Haken/Position am Brett, «B-14»
  tagNumber: text                    // Marke/Pfand-Nummer
  bundle: rel → key-bundles
  seal: group { sealed: checkbox, sealNumber: text, sealedAt: date }

  // Aktuelle Ausgabe
  currentHolder: rel → users
  currentReason: text
  assignedAt: date (readOnly)
  dueAt: date                        // leer = Dauerausgabe
  issuedBy: rel → users (readOnly)
  secondSignature: rel → users       // Pflicht bei requiresFourEyes

  notes: textarea
}
```

Ein Exemplar in einem Bund wird **nicht** einzeln ausgegeben; Ausgabe läuft über den Bund.

### 4.5 `key-bundles` — Schlüsselbund

```ts
{
  label: text (required)             // «Bund Wache Nord»
  tagNumber: text
  copies: rel → key-copies (hasMany)
  currentHolder / currentReason / assignedAt / dueAt / issuedBy  // wie 4.4
  notes: textarea
}
```
Zuweisung des Bundes schreibt Holder und Frist in **alle** enthaltenen Exemplare und erzeugt **ein** Journal-Ereignis mit der Liste.

### 4.6 `key-events` — Journal (append-only)

Statt eingebetteter Historie wie bei Fahrzeugen eine eigene Collection — nötig für «alles von heute», Wachübergabe-Protokoll, Überfälligkeit und Audit-Export.

```ts
{
  type: select<ausgabe|ruecknahme|bund_ausgabe|bund_ruecknahme
             |siegel_gebrochen|verlust|sperrung|freigabe
             |inventur|uebergabe|status_wechsel>
  copy: rel → key-copies
  bundle: rel → key-bundles
  keyLabel: text                     // Snapshot
  person: rel → users
  personName: text                   // Snapshot, überlebt Löschung
  actor: rel → users                 // wer gebucht hat
  actorName: text
  reason: text
  dueAt: date
  at: date (required, index)
  meta: json                         // Siegelnummer, Differenzliste, Betroffene
}
```
Zugriff: create/read; update/delete gesperrt (`access.update: () => false`).

### 4.7 Statusmodell `key-copies.status`

| Wert | Bedeutung | zuweisbar |
|---|---|---|
| `am_brett` | im Depot/an der Zentrale | ja |
| `ausgegeben` | bei einer Person, mit Frist | nein |
| `dauerausgabe` | bei Funktionsträger, ohne Frist | nein |
| `versiegelt` | Notschlüssel, Siegel intakt | nein (erst Siegel brechen) |
| `gesperrt` | nach Verlust, bis Umbau/Entscheid | nein |
| `verloren` | nicht wiederbeschafft | nein |
| `defekt` | unbrauchbar | nein |

Analog zur Fahrzeuglogik: Status wird vom Hook geführt, nie von Hand gesetzt — ausser den manuellen Endzuständen `defekt`, `gesperrt`, `verloren`.

### 4.8 `key-incidents` — Vorfälle

```ts
{
  copy: rel → key-copies (required)
  type: select<verlust|diebstahl|defekt|nicht_zurueckgegeben|siegelbruch_ungeklaert>
  reportedBy: rel → users
  reportedAt: date
  description: textarea
  impact: textarea (readOnly)        // Hook: betroffene Türen/Anlage/Stufe
  measure: select<zylinder_tausch|gruppe_umbau|anlage_umbau|keine|offen>
  costNote: text
  status: select<offen|in_bearbeitung|erledigt>
}
```

### 4.9 `key-inventories` — Inventur / Schlüsselrapport

```ts
{
  date, performedBy: rel → users, scope: rel → key-categories (hasMany)
  expectedCount / foundCount: number (readOnly)
  differences: array { copy, expectedStatus, foundStatus, note }
  status: select<laufend|abgeschlossen>
  signedOffBy: rel → users
}
```

### 4.10 `key-depots` — Verwahrung

```ts
{
  name: text (required, unique)
  type: select<brett|schrank|tresor|ausgabesystem|objektdepot
             |siegelschrank|panzerschrank|mobil|elektronisch>
  lockType: select<offen|schluessel|zahlenschloss|schluessel_und_code
                 |doppelverschluss|badge|biometrie|siegel>
  securityLevel: select<keine|s1|s2|grad0|grad1|grad2>   // EN 14450 / EN 1143-1
  location: text
  custodian: rel → users
  capacity: number                   // Haken oder Fächer, leer = unbegrenzt
  systemReference: text              // Gerätenummer bei Automat/Objektdepot
  selfService: checkbox              // Automat gibt frei und protokolliert
  externalAccess: checkbox           // Zugriff durch Dritte, z.B. Feuerwehr
  tamperMonitored: checkbox
  codeChangedAt: date
  codeIntervalDays: number
  notes: textarea
}
```

`key-copies` erhält `depot` (Relation) neben dem bestehenden `storageSlot`, das nun den Platz *innerhalb* der Verwahrung bezeichnet. `keys` erhält `requiresSeparateStorage`, bei Risikoklasse «Hoch» automatisch gesetzt.

### 4.11 Erweiterung `users`

```ts
{
  pspLevel: select<keine|psp|psp_erweitert|psp_mit_befragung> default keine
  pspValidUntil: date
  serviceEnd: date                   // Dienstende / Ende WK
  function: text                     // «Fourier», «Zeugwart» — für Dauerausgaben
}
```

---

## 5. Geschäftsregeln (Hooks)

`beforeChange` auf `key-copies`, Struktur analog `Vehicles.ts`:

1. **Zuweisung** → `status = ausgegeben` (bzw. `dauerausgabe` wenn `dueAt` leer), `assignedAt = now`, `issuedBy = req.user`, Journal-Ereignis `ausgabe`.
2. **Freigabe** (`currentHolder = null`) → `status = am_brett`, Felder leeren, Journal `ruecknahme`.
3. **Nicht zuweisbar**: `gesperrt | verloren | defekt | versiegelt` → Fehler mit Klartext («Exemplar ist nach Verlustmeldung gesperrt»).
4. **PSP-Gate**: `key.requiresPsp === true` und (`pspLevel === keine` oder `pspValidUntil < heute`) → Ausgabe verweigert, mit Nennung der fehlenden Stufe.
5. **Vier-Augen**: `key.requiresFourEyes === true` und `secondSignature` leer → Ausgabe verweigert.
6. **Dienstende**: `dueAt > users.serviceEnd` → Frist wird auf das Dienstende gekürzt, Hinweis im UI.
7. **Siegel**: `seal.sealed: true → false` erzwingt Grundangabe und schreibt `siegel_gebrochen`.
8. **Bund**: Zuweisung/Rücknahme auf `key-bundles` kaskadiert über `afterChange` auf alle `copies`, mit `context.fromBundle = true`, damit nicht n Einzelereignisse entstehen.
9. **Verlust**: Anlegen eines `key-incidents` mit `type: verlust|diebstahl` setzt das Exemplar auf `gesperrt` und füllt `impact` aus Hierarchiestufe + Anlage.
10. **Schwächstes Glied**: Ein Exemplar kann nur einer Verwahrung zugeordnet werden, deren Sicherheitsstufe mindestens der Exposition des Schlüssels entspricht — Schutzzone 2/3 → Grad 0, Risiko «Hoch» → S2, «Erhöht» → S1. Elektronische Berechtigungen sind ausgenommen, ihr Schutz liegt im System.
11. **Doppelverschluss**: Jede Ausgabe aus einer Verwahrung mit Doppelverschluss verlangt eine Zweitunterschrift, auch wenn der Schlüssel selbst nur «Erhöht» ist.
12. **Getrennte Verwahrung**: Ein Schlüssel mit `requiresSeparateStorage` kann keinem Bund zugeordnet werden.
13. **Verlust einer elektronischen Berechtigung** erzeugt die Massnahme «Berechtigung sperren» statt eines Zylindertauschs.
14. **Historie überlebt Löschung**: `personName`/`keyLabel`/`actorName` werden beim Schreiben als Snapshot mitgegeben — gleiches Muster wie `usageHistory.userName`.

---

## 6. Bedienung

Leitgedanke: **Die App zeigt das Schlüsselbrett, das die Zentrale ohnehin vor sich hat.** Keine Formularlandschaft, sondern eine Tafel mit Kacheln und zwei Knöpfen.

### 6.1 Routen

| Route | Zweck |
|---|---|
| `/schluessel` | **Schlüsselbrett**: Kachelraster, eine Kachel je Exemplar/Bund. Grün = am Brett, rot = ausgegeben, gelb = überfällig, grau = gesperrt/verloren, blau = versiegelt. Filter: Kategorie, Status, Anlage. Suchfeld oben, Tastaturfokus beim Laden. |
| `/schluessel/ausgabe` | **Ausgabe**: Schritt 1 Person (`UserCombobox`), Schritt 2 Schlüssel (Mehrfachauswahl, Bünde als eine Zeile), Schritt 3 Frist + Grund + Quittung. Default-Frist «heute 18:00». |
| `/schluessel/ruecknahme` | **Rücknahme**: ein Feld. Nummer scannen oder tippen → Karte mit Inhaber und Ausgabedatum → «Zurücknehmen». Danach Fokus zurück ins Feld (Serienrücknahme beim Abendrapport). |
| `/schluessel/[id]` | Exemplar: Stammdaten, Stufe, Risiko, Schutzzone, aktueller Inhaber, Journal, Aktionen (Ausgeben, Zurücknehmen, Siegel brechen, Verlust melden, Sperren). |
| `/schluessel/abschluss` | **Tagesabschluss / Wachübergabe**: alles, was draussen ist, überfällige zuoberst, Zähler Soll/Ist, Knopf «Übergabe quittieren» → Journal `uebergabe`. |
| `/schluessel/depots` | **Verwahrung**: alle Aufbewahrungsorte mit Belegung, Verschlussart, Sicherheitsstufe, Verantwortlichem und fälligem Codewechsel. Detailseite zeigt den Bestand und was draussen ist. |
| `/schluessel/inventur` | **Inventur**: Liste durchgehen, je Zeile «vorhanden» antippen, am Ende Differenzbericht. |
| `/personen/[id]` | Erweiterung: Block «Schlüssel in Besitz» mit Fälligkeiten und Knopf «Alle zurücknehmen» (Austritt). |

### 6.2 Startseite

Vier Kacheln zusätzlich zum Fahrzeugblock: **Ausgegeben** · **Überfällig** (rot, wenn > 0) · **Gesperrt/Verloren** · **Nächste Inventur**. Jede Kachel verlinkt auf die gefilterte Liste.

### 6.3 Bedienprinzipien

- **Eine Navigationsebene je Domäne.** Kopfzeile: Fahrzeuge · Schlüssel · Personen. Innerhalb des Schlüsselbereichs eine Unternavigation über alle sieben Screens, mit Zähler auf «Abschluss» (überfällig) und «Vorfälle» (offen). Die aktive Stelle ist immer markiert.
- **Filter ohne Serverrunde.** Der Bestand liegt ohnehin vollständig auf der Seite, also filtern Suche, Status, Typ und Kategorie im Browser — jeder Tastendruck wirkt sofort. Die Trefferzahl steht auf dem Filter selbst, deshalb gibt es keine separate Zählerreihe mehr. Die Adresszeile wird mitgeführt, damit eine gefilterte Ansicht teilbar bleibt.
- **Suche über alles, was auf dem Anhänger oder im Kopf steht**: Nummer, Raum, Platz am Brett, Marke und Name des Inhabers.
- **Zwei Taps pro Vorgang.** Alles andere ist Default: Frist = Dienstschluss, Ausgeber = angemeldete Person, Grund optional.
- **Tastatur und Scanner zuerst.** Jede Liste hat ein Suchfeld mit Autofokus; ein Barcode-Scanner tippt nur Text und funktioniert damit ohne Zusatzcode.
- **Blockaden erklären, nicht nur verbieten.** «Nicht möglich: Wm Keller hat keine gültige PSP (Schutzzone 2 erforderlich, abgelaufen 30.06.2026).»
- **Papier bleibt möglich.** Jede Ausgabe lässt sich als Quittung mit Unterschriftszeile drucken.
- **Tablet-tauglich**: Kacheln ≥ 44 px Trefferfläche, einspaltig unter 640 px — passend zur bestehenden Offline-/Tablet-Arbeit.

---

## 7. Smarte Funktionen (das, was Excel nicht kann)

### 7.1 PSP-Gate
Schutzzonenpflichtige Schlüssel können nicht an Personen ohne gültige Personensicherheitsprüfung ausgegeben werden. Prüfung im Hook, nicht nur im UI. Das ist die Funktion, die kein handelsübliches Schlüsselprogramm hat, weil sie schweizspezifisch ist.

### 7.2 Fristen, die an den Dienst gekoppelt sind
Rückgabefrist defaultet auf Dienstschluss und wird nie über `serviceEnd` hinaus gesetzt. Beim Dienstaustritt eine Liste, ein Knopf.

### 7.3 Siegelverwaltung für Notschlüssel
Versiegelte Reserveschlüssel werden mit Siegelnummer geführt. Protokolliert wird das Brechen des Siegels mit Grund — der Vorgang, der in der Praxis tatsächlich rechenschaftspflichtig ist.

### 7.4 Bund als Einheit
Ein Bund wird in einem Vorgang ausgegeben, zurückgenommen und quittiert. Das Journal zeigt den Bund, die Exemplare bleiben einzeln auffindbar.

### 7.5 Verlust-Impact
Bei Verlustmeldung rechnet die App die Folge aus der Hierarchiestufe: ES → Zylindertausch; GS/HS → betroffene Gruppe(n) mit Türenliste; GHS → Hinweis «Umbau der Schliessanlage ‹Kaserne Ost› erforderlich» samt Anzahl betroffener Zylinder. Entscheid und Kostennotiz werden am Vorfall festgehalten.

### 7.6 Schwächstes-Glied-Prüfung
Die App verweigert, einen Schlüssel in einer zu schwachen Verwahrung abzulegen, und nennt beide Seiten der Rechnung: was der Schlüssel verlangt und was der Ort bietet. Das ist der Fehler, den die Praxis am häufigsten macht und den keine Liste von selbst aufdeckt.

### 7.7 QR-Anhänger
Druckbares Etikettenblatt: je Exemplar ein QR-Code mit der Exemplar-ID, neutral beschriftet (nur Nummer, nie «GHS»). Scan im Rücknahmefeld = fertig.

### 7.8 Marke/Pfand-Abgleich
Optionales Feld `tagNumber`. Ist es gesetzt, verlangt die Ausgabe die Marke und die Rücknahme gibt sie zurück — damit Brett und App nicht auseinanderlaufen.

---

## 8. Umfang und Phasen

**Phase 1 — Kern · umgesetzt am 19.10.2026**
Collections 4.1–4.7 und 4.10, Hooks 1–5 und 10, Schlüsselbrett, Ausgabe, Rücknahme, Exemplar-Detail, Dashboard-Kacheln, Seed-Daten (ca. 40 Schliessungen über alle sechs Kategorien, inkl. zwei Bünde und ein versiegelter Notschlüssel).
→ Das ist der demofähige Stand. Zusätzlich gebaut: Bund-Detailseite (nötig für die Rücknahme eines Bundes) und ein `keys`-Ziel im Reset-Tool.

**Verwahrung — umgesetzt am 19.10.2026**
`key-depots` mit neun Verwahrungsarten, Schwächstes-Glied-Prüfung, Doppelverschluss-Regel, getrennte Verwahrung, Codewechsel-Fälligkeit, Übersicht und Detailseite, Filter am Brett.

**Phase 2 — Betrieb · umgesetzt am 19.10.2026**
Tagesabschluss/Wachübergabe, Inventur, Vorfälle inkl. Impact (4.8, 4.9, Hooks 6–9), Personenblatt mit «Alle zurücknehmen», QR-Etiketten, Markenabgleich.
→ Zusätzlich gebaut: Vorfall-Übersicht unter `/schluessel/vorfaelle`. Der Siegelbruch verlangt neu auch auf Hook-Ebene eine Begründung, und die Rückgabefrist wird hart auf das Dienstende gekürzt.

**Phase 3 — Nachweis (ca. 2–3 Arbeitstage)**
Quittung als PDF mit Unterschriftszeile, Journal-Export (CSV) für Audit, `locations`-Collection mit Türenliste je Schliessung, Offline-Synchronisation gemeinsam mit der bestehenden Tablet-Arbeit.

---

## 9. Offene Entscheide

**9.1 Kategorien: eigene Collection oder `categories` erweitern?**
Eigene `key-categories` (Vorschlag): saubere Trennung, Fahrzeugauswahl bleibt unberührt, etwas Duplikation. Alternative: `categories` um `scope: vehicle|key` erweitern — weniger Code, aber jede Abfrage muss filtern und ein Fehler mischt die Domänen.

**9.2 Dauerausgabe: an Person oder an Funktion?**
Vorschlag Person mit Feld `function` als Hinweis. Variante «an Funktion» (Rolle hält den Schlüssel, Person wechselt) ist sauberer für Funktionswechsel, aber ein zweites Zuweisungsmodell neben dem Fahrzeugmuster.

**9.3 Abdeckung Badge/Code in Phase 1 oder später?**
Vorschlag: Feld `medium` von Anfang an vorhanden, aber Seed und Demo nur mit mechanischen Schlüsseln und Bünden — weniger Erklärbedarf in der Vorführung.

**9.4 Fachliche Validierung**
Die Liste in Kap. 2.2 braucht die Bestätigung eines Fachoffiziers, bevor sie als korrekt dargestellt wird. Bis dahin bleibt der Vorbehalt aus Kap. 2.1 in der Spec stehen.

---

## 10. Quellen

Öffentlich belegbar:

- Schliessanlagen-Hierarchie ES/GS/OGS/GHS und Schliessplan: [ASSA ABLOY, Schliessanlagenarten](https://dach.assaabloy.com/at/images/catalog/mediacockpit/IKON/orig/Schliessanlagenarten_DE.pdf) · [Baunetz Wissen, Schliessanlagen](https://www.baunetzwissen.de/beschlaege/fachwissen/zubehoer/schliessanlagen-150148) · [ABUS, Schliessanlagen-Arten](https://www.abus.com/ch_de/Gewerbe/Tuersicherheit/Tuerzylinder-Schliessanlagen/Schliessanlagen-Arten)
- Funktionsumfang Schlüsselverwaltungssoftware (Quittung, Rückgabefristen, Inventur, Verlustmanagement, Schliessplan): [SoftGuide, Schlüsselverwaltung](https://www.softguide.de/funktion/schluesselverwaltung) · [SoftGuide, Schlüssel- und Schloss-Management](https://www.softguide.de/funktion/schluessel-schloss-management)
- Informationsschutz / klassifizierte Informationen: [Informationsschutzverordnung ISchV, SR 510.411](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2007/414/20210101/de/pdf-a/fedlex-data-admin-ch-eli-cc-2007-414-20210101-de-pdf-a.pdf) (per 1.1.2024 durch ISG/ISV ersetzt)
- Schutzzonen und Personensicherheitsprüfung: [Verordnung über die Personensicherheitsprüfungen PSPV](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2011/155/20230901/de/pdf-a/fedlex-data-admin-ch-eli-cc-2011-155-20230901-de-pdf-a-2.pdf) (Zugang Schutzzone 2/3 militärischer Anlagen, Anlageschutzverordnung vom 2.5.1990)
- Sicherheitsklassen für Schlüsselschränke und -tresore (EN 14450 S1/S2, EN 1143-1 Grad 0–5, VdS/ECB-S): [RS Online, Tresor-Leitfaden](https://de.rs-online.com/web/content/discovery-portal/produktratgeber/tresor-leitfaden)
- Schlüsseldepots und ihre Klassen, Meldepflicht gegenüber dem Versicherer: [Baunetz Wissen, Schlüsseldepots](https://www.baunetzwissen.de/sicherheitstechnik/fachwissen/sicherheitsschraenke-depots/schluesseldepots-sd-164822) · [Merkblatt Feuerwehrschlüsseldepot, DIN 14675](https://www.unna.de/fileadmin/stadt/dokumente/internet/Rathaus/Feuerwehr/Infos_Downloads/Merkblatt_Feuerwehrschluesseldepot_DIN_14675.pdf)
- Elektronisches Ausgabesystem, Schlüssel am Chip-Anhänger mit eigener ID und automatischem Protokoll: [Traka, iFobs](https://www.traka.com/global/en/products/accessories/ifobs)
- Verlust einer elektronischen Berechtigung: sperren und ausprogrammieren statt Zylindertausch: [ASSA ABLOY Verso CLIQ](https://www.baulinks.de/webplugin/2005/1319.php4) · [CLIQ-Kurzanleitung RWTH Aachen](https://hci.rwth-aachen.de/keys)
- Schlüssel sind so sicher zu verwahren wie das, was sie öffnen (OVG Münster, Az. 20 A 2384/20): [beck-aktuell](https://www.beck-aktuell.de/heute-im-recht/rechtsprechung/jaeger-darf-waffenrechtliche-erlaubnis-trotz-falscher-schluesselaufbewahrung-behalten-2023-08-30)
- Getrennte Aufbewahrung von Waffenraum-Schlüsseln, Verbot am Schlüsselbund: [Vorschrift Sächsischer Justizvollzug](https://www.revosax.sachsen.de/vorschrift_gesamt/3467/35673.pdf) · Analogie US-Praxis: [Key control records, AR 190-11](https://www.archives.gov/records-mgmt/rcs/schedules/departments/department-of-defense/department-of-the-army/rg-au/daa-au-2012-0009_sf115.pdf)

Nicht öffentlich und daher nicht belegt: Reglemente und Weisungen der Schweizer Armee zur Schlüsselverwaltung, Betriebsreglemente der Waffenplätze. Kap. 2.2–2.4 sind insoweit abgeleitet (siehe 2.1 und 9.4).
