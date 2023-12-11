# Fextify

<img src='assets\example.png'>
A simple text editor written in Tauri, inspired by Obsidian.

<br>

This is a **prototype**, not a fully polished version.

# How to run?

## Windows

Run the `fextify_[version]_x64_en-US.msi` msi installer or run the `fextify_[version]_x64-setup.exe` installer included in the [releases section](https://github.com/face-hh/fextify/releases).

## GNU/Linux

### Debian and/or Ubuntu

Install the `.deb` version of the package from the [releases section](https://github.com/face-hh/fextify/releases).

### AppImage and raw linux

For any other GNU/Linux distribution you can use the `.AppImage` or run the `raw linux` version from the [the releases section/](https://github.com/face-hh/fextify/releases).

Note: You might need to make them executable by running `chmod +x fextify.AppImage` or `chmod +x fextify-linux`.

# Manual compilation

For manual compilation run `npm run tauri build -- --target x86_64-pc-windows-msvc` on Windows, or `npm tauri build` on GNU/Linux.

NOTE: if you run into any compilation error you can always debug the error with `pnpm tauri build --verbose`.

# On first startup

1. Run the `fextify.exe` included in this folder. (or run `npm run tauri build -- --target x86_64-pc-windows-msvc` to compile)
2. Press `CTRL` + `P` to open the command pallet. It will give you a good idea of what's going on. Otherwise, explore!

# Themes

![image](https://github.com/face-hh/fextify/assets/69168154/18754f26-206d-4152-87df-f7d865ac1e20)

### Premade

You can press `CTRL` + `ALT` + `S` to open the Theme Selector.

### Creating

You can duplicate the `src/themes/default.css` and modify its colors. We recommend you import the theme automatically on restart by adding `<link rel="stylesheet" href="themes/my_theme.css" />` in `src/index.html` and use `npm run tauri dev` to have the application reset on save.

### Publishing

You can open a pull request to add your theme in `/src/themes`. We will add it if it's good.

Alternatively, you can join our [Discord server](https://discord.gg/8Wh4PtnmnJ) and post it on the `fextify-themes` forum!

# Known bugs

1. Changing the title of any file to a duplicate causes a panic & `config.json` to mess up. For the time being, avoid naming files the same. In case this happens, nuke `config.json` by emptying all arrays & restart the software.
