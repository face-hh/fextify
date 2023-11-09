# Fextify
<img src='assets\example.png'>
A simple text editor written in Tauri, inspired by Obsidian.

<br>

This is a **prototype**, not a fully polished version.

# How to run?

## Windows
Run the `fextify.exe` included in the [releases/](./releases) folder.

## GNU/Linux
### Debian and/or Ubuntu
Install the `.deb` version of the package from the [releases/](./releases) folder.

### AppImage
For any other GNU/Linux distribution you can use the `.AppImage` version from the [releases/](./releases) folder.

# Manual compilation
For manual compilation run `npm run tauri build -- --target x86_64-pc-windows-msvc` on Windows, or `npm tauri build` on GNU/Linux.

NOTE: if you run into any compilation error you can always debug the error with `pnpm tauri build --verbose`.

# On first startup
Press `CTRL` + `P` to open the command pallet. It will give you a good idea of what's going on. Otherwise, explore!

# Known bugs
1. Changing the title of any file to a duplicate causes a panic & `config.json` to mess up. For the time being, avoid naming files the same. In case this happens, nuke `config.json` by emptying all arrays & restart the software.
