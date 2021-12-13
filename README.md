# scratch-debugger-gui

## Benodigdheden
- Node.js (Ik gebruik versie 16.13.0, aangezien alle versies vanaf 17.0.0 te recent zijn)
- npm
- Git

## Installatie & build

### judge-core
De `scratch-debugger-gui` maakt gebruik van de [`judge-core`](https://github.ugent.be/scratch4d/judge-core) als lokale
npm-package. Installeer deze dus allereerst:

Clone de `judge-core`-repository in dezelfde folder waar je ook de `scratch-debugger-gui`-repository zal clonen.
```bash
git clone git@github.ugent.be:scratch4d/judge-core.git
```

Installeer en build vervolgens de `judge-core` package.
```bash
cd judge-core
npm install
npm run build
```

Bij elke wijziging die je maakt in de code van de `judge-core` moet telkens opnieuw het commando `npm run build`
uitgevoerd worden alvorens deze wijziging ook zichtbaar zal worden voor de `scratch-debugger-gui`.

### scratch-debugger-vm
De `scratch-debugger-gui` maakt ook gebruik van een aangepaste versie van de [`scratch-vm`](https://github.ugent.be/scratch4d/scratch-debugger-vm).
Deze moet dus ook geinstalleerd worden. De directory waarin deze geinstalleerd wordt mag in dit geval vrij gekozen
worden:

```bash
git clone git@github.ugent.be:scratch4d/scratch-debugger-vm.git
```

Installeer en build deze package vervolgens:
```bash
cd scratch-debugger-vm
npm install
npm run build
```

Link vervolgens deze lokale npm package. Dit kan door allereerst het volgende commando uit te voeren in de root
directory van het `scratch-debugger-vm`-project:
```bash
npm link
```

Wanneer tot slot het `scratch-debugger-gui`-project volledig geinstalleerd is (zie volgende sectie), voer het volgende
commando in de root directory hiervan. Dit zal ervoor zorgen dat de lokale `scratch-vm` wordt gebruikt, in tegenstelling
tot diegene die zich in de npm repository bevindt.

### scratch-debugger-gui
Clone vervolgens de `scratch-debugger-gui`-repository in dezelfde folder waar je de `judge-core`-repository hebt
gecloned. Voeg best het argument `--depth=1` toe aan het commando `git clone` aangezien deze repository enkele grote
bestanden bevat.

```bash
git clone --depth=1 git@github.ugent.be:scratch4d/scratch-debugger-gui.git
```

Installeer en build vervolgens de `scratch-debugger-gui` package.
```bash
cd scratch-debugger-gui
npm install
npm run build
```

## Uitvoeren
De `scratch-debugger-gui` kan uitgevoerd worden door onderstaand commando uit te voeren in de root van de
`scratch-debugger-gui`-directory. Wijzigingen aan de code in `scratch-debugger-gui` zullen meteen zichtbaar zijn op de
webpagina wanneer de webserver draait.

```bash
npm start
```

Het project zal standaard draaien op http://localhost:8601/

## Deployen
Zorg er ten eerste voor dat de build-folder de meest recente build bevat (zie
[Installatie & build](#installatie--build)). Voer vervolgens het volgende commando uit om deze build naar GitHub Pages
te deployen:

```bash
npm run deploy
```

Het project zal zichtbaar zijn op: https://github.ugent.be/pages/scratch4d/scratch-debugger-gui/

## Overig
Zie [README_ORIGINAL.md](README_ORIGINAL.md) voor de originele README van het `scratch-gui`-project.
