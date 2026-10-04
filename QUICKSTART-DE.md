# CrewFund auf diesem Mac

Die Demo läuft bereits unter **http://127.0.0.1:5173**. Sie verwendet einen echten lokalen Solana-Testvalidator, ausschließlich Test-SOL und ein fiktives Testhotel. Es gibt bisher keine Devnet-Bereitstellung.

## Demo neu durchführen

1. Öffne die Vorschau und klappe unten **Demo setup & blockchain details** auf.
2. Wenn die vier Wallets nicht geladen sind: Klicke beim jeweiligen Namen auf die Dateiauswahl. Drücke im Finder **Cmd+Shift+G** und füge diesen Ordner ein:

   `/Users/krestenbork/Documents/Codex/2026-10-04/baue-mit-mir-crewfund-als-kleinen/outputs/crewfund/.secrets`

   Wähle passend **alex.json**, **sam.json**, **jordan.json**, **hotel.json**. Das sind vier verschiedene Test-Wallets. Niemals eigene Wallets mit echtem Geld importieren.
3. Klicke **Create 10-minute booking**. Die Frist beginnt auf der Blockchain.
4. Wähle unter **Acting as** nacheinander Alex, Sam und Jordan. Klicke jeweils **Deposit 0.01 Test SOL** und warte auf **Transaction confirmed**.
5. Wechsle zu **Hotel portal**. Klicke **Confirm booking & receive 0.03 Test SOL**. Die geladene Hotel-Wallet signiert, nicht die Gruppe.
6. **CONFIRMED** und die Localnet-Signatur zeigen die erfolgreiche Buchung. Das Hotel erhält 0.03 Test-SOL, abzüglich seiner separaten Transaktionsgebühr.

Für eine Rückzahlung: Neue Buchung erstellen, nur einen Anteil einzahlen, zehn Minuten verstreichen lassen und bei diesem Teilnehmer **Claim my refund** klicken. Die Tests verwenden kürzere Fristen und haben diesen Ablauf bereits geprüft.

## Wenn die Vorschau später nicht mehr läuft

Öffne Terminal und kopiere:

```sh
bash /Users/krestenbork/Documents/Codex/2026-10-04/baue-mit-mir-crewfund-als-kleinen/outputs/crewfund/scripts/workspace-start.sh
```

Lass dieses Terminal geöffnet. Für eine neue vorab angelegte Buchung in einem zweiten Terminal:

```sh
bash /Users/krestenbork/Documents/Codex/2026-10-04/baue-mit-mir-crewfund-als-kleinen/outputs/crewfund/scripts/workspace-setup.sh
```

## Devnet

Zwei kostenlose CLI-Airdrops wurden durch das Limit abgewiesen. Bitte fordere auf **https://faucet.solana.com** möglichst 2 **Devnet Test-SOL** für diese öffentliche Adresse an:

`6zeRiynm2SUqneF66UXrjzain7ntM6khBm4puW6mVyaa`

Eine eventuell erforderliche GitHub-Anmeldung machst du selbst. Keine echten SOL kaufen. Anschließend kann das getestete Programm auf Devnet bereitgestellt werden.

## Öffentliches Repository

Verwende das bereinigte **crewfund-source.zip** aus dem übergeordneten outputs-Ordner. Lade nicht den kompletten Arbeitsordner hoch: Er enthält unter `.secrets` die lokalen Testschlüssel. Das ZIP enthält keine Schlüssel, Zugangsdaten, `.env.local`, Abhängigkeiten oder Validator-Daten.

Das englische Pitchdeck liegt als **CrewFund-WHU-pitch.pptx** und **CrewFund-WHU-pitch.pdf** daneben. Die Abgabe erfolgt unter https://superteam.fun/earn/listing/build-at-whu, laut deiner Vorgabe spätestens am 4. Oktober 2026 um 23:59 Uhr Berliner Zeit. Dafür fehlen noch ein öffentliches GitHub-Repository, ein öffentlicher Pitchdeck-Link und deine Superteam-Anmeldung. Die Teilnahme am WHU Hackathon hast du bestätigt. Das erforderliche Folgen von SuperteamDE auf X ist noch nicht bestätigt.
