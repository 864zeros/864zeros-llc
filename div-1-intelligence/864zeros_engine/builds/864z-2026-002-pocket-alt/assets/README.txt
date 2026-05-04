ASSETS DIRECTORY - ReadVault Extension
======================================

Required icon files for Chrome Extension:
- icon16.png  (16x16)
- icon32.png  (32x32)
- icon48.png  (48x48)
- icon128.png (128x128)

An SVG source file (icon.svg) is provided.

To generate PNG icons from the SVG:

Option 1: Use online converter
- Visit https://cloudconvert.com/svg-to-png
- Upload icon.svg
- Export at 16, 32, 48, 128 sizes

Option 2: Use ImageMagick (command line)
```
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

Option 3: Use Inkscape
```
inkscape icon.svg -w 16 -h 16 -o icon16.png
inkscape icon.svg -w 32 -h 32 -o icon32.png
inkscape icon.svg -w 48 -h 48 -o icon48.png
inkscape icon.svg -w 128 -h 128 -o icon128.png
```

---
864zeros Build Kit
