# scratch-debugger-gui

## This repository
This repository is a fork of [scratch-gui](https://github.com/LLK/scratch-gui). **Blink**, the scratch debugger described in the master's thesis [Blink: een educatieve software-debugger voor Scratch 3.0](https://lib.ugent.be/en/catalog/rug01:003059967?i=0&q=blink+scratch+debugger), is implemented in this repository and the [`scratch-debugger-vm`](https://github.ugent.be/scratch4d/scratch-debugger-vm) repository.


## Building & development

### Dependencies
- node.js v16.18.0 (lts Gallium)
- npm
- git

### judge-core
`scratch-debugger-gui` uses the [`scratch-judge`](https://github.ugent.be/scratch4d/scratch-judge) as local `npm` package.

Clone the `scratch-judge` repository in the same directory where you clone(d) `scratch-debugger-gui`.
```bash
git clone git@github.ugent.be:scratch4d/scratch-judge.git
```

Install its dependencies and build the `scratch-judge` package.
```bash
cd scratch-judge
npm install
npm run build
```

Every change in the `scratch-judge` package needs a rebuild with `npm run build` for the changes to take effect in `scratch-debugger-gui`.

### scratch-debugger-vm
`scratch-debugger-gui` uses a modified version of `scratch-vm`, [`scratch-debugger-vm`](https://github.ugent.be/scratch4d/scratch-debugger-vm).

Clone the repository.
```bash
git clone git@github.ugent.be:scratch4d/scratch-debugger-vm.git
```

Install and build the package:
```bash
cd scratch-debugger-vm
npm install
npm run build
```

Next link this local `npm` package. Run this command in the `scratch-debugger-vm`-folder:
```bash
npm link
```

### scratch-debugger-gui
Clone the `scratch-debugger-gui`-repository in the same folder as where the `scratch-judge` repository is.
You can add the `--depth=1` option because this repository contains a few big files.

```bash
git clone --depth=1 git@github.ugent.be:scratch4d/scratch-debugger-gui.git
```

Install and build the `scratch-debugger-gui` package.
```bash
cd scratch-debugger-gui
npm install
npm run build
```
The `npm install` command can give an error. As suggested, use `--legacy-peer-deps` to make it work.

Finally, execute the following command in the root of the repository.
This makes sure the local `scratch-vm` is being used,
instead of the one from the `npm` repositories.
```
npm link scratch-vm
```

### Running
The scratch GUI with debugger can be executed with the command below, in the `scratch-debugger-gui`-directory. It can be accessed on http://localhost:8601/ and changes to the code will immediately be visible.

```bash
npm start
```

## Deploying
Make sure that the build folder contains the most recent build (see [Building & development](#building--development)). Run this command to deploy to GitHub Pages:
```bash
npm run deploy
```

The project will be visible on: https://github.ugent.be/pages/scratch4d/scratch-debugger-gui/.

## Icons
All added icons are located in `src/debugger-icons`.

### Links
- [`icon--debug-mode.svg`](https://www.iconfinder.com/icons/3671718/bug_icon)
- [`icon--debugger.svg`](https://www.iconfinder.com/icons/3671718/bug_icon)
- [`icon--pause.svg`](https://www.svgrepo.com/svg/176023/music-pause-button-pair-of-lines)
- [`icon--resume.svg`](https://www.svgrepo.com/svg/204978/play)
- [`icon--step.svg`](https://www.iconfinder.com/icons/1564530/arrow_next_share_direction_icon)

### Changes
- `icon--debugger.svg`: Added color #4C97FF.

## Extra
See [README_ORIGINAL.md](README_ORIGINAL.md) for the original README of the `scratch-gui`-project.
