# Halftone QR Studio

Put a black-and-white picture into a QR code. The generator runs locally in your browser and exports PNG and SVG.

This is an **independent implementation** inspired by [Jorge C. Lucero's Halftone QR](https://lucerojc.github.io/halftone-qr/). Its source code and sample image were not copied. The technique is also discussed in [Erik and Martin Demaine's QR prints](https://erikdemaine.org/prints/QR/) and Chu, Chang, Lee, and Mitra, *Halftone QR Codes* (ACM Transactions on Graphics, 2013).

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Run `npm test` for core checks and `npm run build` for a production build. The build is a static site in `dist/`.

## Current features

- Text or URL input, local image upload, drag and drop, and paste
- Contrast, brightness, zoom, inversion, and four dithering modes
- Four module layouts, four error correction levels, minimum version, reference mark protection, and picture aware QR mask selection
- Automatic larger code for photos, color selection, browser scan feedback, and PNG/SVG export

The scan check is a useful signal, not a guarantee. Check the final download with the camera and lighting conditions in which it will be used.

## Project layout

`src/qr.ts` wraps the QR encoder and identifies fixed QR patterns. `src/image.ts` samples and dithers pictures. `src/halftone.ts` combines picture cells and QR modules. `src/export.ts` makes canvas and SVG output. `src/main.ts` owns the UI.

## Credits and licenses

The application code and sample landscape are MIT licensed under [LICENSE](LICENSE). The QR encoder at `src/vendor/qrcodegen.ts` is Project Nayuki's [QR Code generator](https://github.com/nayuki/QR-Code-generator) at commit `bcfe1b018cec5f1f91b5705eca5bb4cdd34e9f8d`, licensed under MIT; its full notice is preserved in that file. QR reading uses [jsQR](https://github.com/cozmo/jsQR), licensed under Apache 2.0 and installed from npm. Neither Jorge C. Lucero nor Project Nayuki is affiliated with this project.
