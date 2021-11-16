# scratch-debugger-gui

## Benodigdheden
- Node.js (Ik gebruik versie 16.13.0, aangezien versie 17.0.0 te recent was voor de GUI.)
- npm
- Git

## Installatie & build

### judge-core
De `scratch-debugger-gui` maakt gebruik van de [`judge-core`-package](https://github.ugent.be/scratch4d/judge-core) als
lokale npm package. Installeer deze dus allereerst, als volgt.

Clone de `judge-core`-repository in dezelfde folder waar je ook de `scratch-debugger-gui` repository zal clonen.
Voeg best het `--depth=1` argument to aan het `git clone` commando aangezien de repository enkel grote bestanden bevat.

**HTTPS**
```bash
https://github.ugent.be/scratch4d/judge-core.git
```

**SSH**
```bash
git@github.ugent.be:scratch4d/judge-core.git
```

Installeer en build vervolgens de `judge-core` package.
```bash
cd judge-core
npm install
npm run build
```

Bij elke wijzing van code in deze repository, zal telkens opnieuw het `npm run build` commando uitgevoerd moeten worden.

### scratch-debugger-gui
Clone dan de `scratch-debugger-gui`-repository in dezelfde folder waar je de `judge-core`-repository hebt gecloned.

**HTTPS**
```bash
https://github.ugent.be/scratch4d/scratch-debugger-gui.git
```

**SSH**
```bash
git@github.ugent.be:scratch4d/scratch-debugger-gui.git
```

Installeer en build vervolgens de `scratch-gui` package.
```bash
cd scratch-debugger-gui
npm install
npm run build
```

## Uitvoeren
De GUI uitvoeren kan door het volgende commando uitvoeren in de `scratch-debugger-gui` directory. Wijzigingen die gemaakt
worden aan de code in `scratch-debugger-gui` zullen automatisch zichtbaar zijn in de GUI wanneer de webserver draait.

```bash
npm start
```

De GUI zal draaien op http://localhost:8601/

## Troubleshooting

### Ignoring optional dependencies

When running `npm install`, you can get warnings about optional dependencies:

```
npm WARN optional Skipping failed optional dependency /chokidar/fsevents:
npm WARN notsup Not compatible with your operating system or architecture: fsevents@1.2.7
```

You can suppress them by adding the `no-optional` switch:

```
npm install --no-optional
```

Further reading: [Stack Overflow](https://stackoverflow.com/questions/36725181/not-compatible-with-your-operating-system-or-architecture-fsevents1-0-11)

### Resolving dependencies

When installing for the first time, you can get warnings that need to be resolved:

```
npm WARN eslint-config-scratch@5.0.0 requires a peer of babel-eslint@^8.0.1 but none was installed.
npm WARN eslint-config-scratch@5.0.0 requires a peer of eslint@^4.0 but none was installed.
npm WARN scratch-paint@0.2.0-prerelease.20190318170811 requires a peer of react-intl-redux@^0.7 but none was installed.
npm WARN scratch-paint@0.2.0-prerelease.20190318170811 requires a peer of react-responsive@^4 but none was installed.
```

You can check which versions are available:

```
npm view react-intl-redux@0.* version
```

You will need to install the required version:

```
npm install  --no-optional --save-dev react-intl-redux@^0.7
```

The dependency itself might have more missing dependencies, which will show up like this:

```
user@machine:~/sources/scratch/scratch-gui (491-translatable-library-objects)$ npm install  --no-optional --save-dev react-intl-redux@^0.7
scratch-gui@0.1.0 /media/cuideigin/Linux/sources/scratch/scratch-gui
├── react-intl-redux@0.7.0
└── UNMET PEER DEPENDENCY react-responsive@5.0.0
```

You will need to install those as well:

```
npm install  --no-optional --save-dev react-responsive@^5.0.0
```

Further reading: [Stack Overflow](https://stackoverflow.com/questions/46602286/npm-requires-a-peer-of-but-all-peers-are-in-package-json-and-node-modules)

### Installation errors

If you run into npm install errors, try these steps:
1. run `npm cache clean --force`
2. Delete the node_modules directory
3. Delete package-lock.json
4. run `npm install` again
