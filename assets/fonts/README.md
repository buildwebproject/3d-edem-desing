Put your font files here (`.woff2` recommended).

This project is pre-wired for 3 font families:

1) `Mulish` (recommended for UI)
   - `assets/fonts/Mulish-Regular.woff2`
   - `assets/fonts/Mulish-SemiBold.woff2`

2) `Inter` (optional)
   - `assets/fonts/Inter-Regular.woff2`
   - `assets/fonts/Inter-SemiBold.woff2`

3) `Poppins` (optional)
   - `assets/fonts/Poppins-Regular.woff2`
   - `assets/fonts/Poppins-SemiBold.woff2`

4) `Ubuntu` (used for buttons in Figma)
   - `assets/fonts/Ubuntu-Regular.woff2`
   - `assets/fonts/Ubuntu-Bold.woff2`

After adding files, refresh the page. Use in CSS:

- `font-family: var(--font-base);`
- `font-family: var(--font-alt-1);`
- `font-family: var(--font-alt-2);`

Or utility classes:

- `.font-mulish`, `.font-inter`, `.font-poppins`, `.font-ubuntu`
