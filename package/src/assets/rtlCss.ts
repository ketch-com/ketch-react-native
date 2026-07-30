/**
 * RTL layout overrides for the Ketch experiences (banner, modal, purposes
 * modal and preferences). The Ketch web UI is laid out with physical
 * left/right utility classes, so it does not mirror automatically on
 * right-to-left locales; these rules mirror it explicitly.
 *
 * All selectors are scoped under [dir='rtl'], so the stylesheet only takes
 * effect when the document root has dir="rtl" — injected together with that
 * attribute by injectDirIntoHtml when htmlDir="rtl" is passed to the
 * KetchServiceProvider.
 */
export const KETCH_RTL_CSS = `
[dir='rtl'] #ketch-banner,
[dir='rtl'] #ketch-modal,
[dir='rtl'] #ketch-purposes-modal,
[dir='rtl'] #ketch-preferences {
  direction: rtl;
  text-align: start;
}

[dir='rtl'] #ketch-banner [class*='ketch-text-left'],
[dir='rtl'] #ketch-modal [class*='ketch-text-left'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-text-left'],
[dir='rtl'] #ketch-preferences [class*='ketch-text-left'] {
  text-align: right !important;
}

[dir='rtl'] #ketch-banner :is(h1, h2, h3, p, span)[class*='ketch-text-left'],
[dir='rtl'] #ketch-modal :is(h1, h2, h3, p, span)[class*='ketch-text-left'],
[dir='rtl'] #ketch-purposes-modal :is(h1, h2, h3, p, span)[class*='ketch-text-left'],
[dir='rtl'] #ketch-preferences :is(h1, h2, h3, p, span)[class*='ketch-text-left'] {
  width: 100%;
}

[dir='rtl'] #ketch-banner [role='tab'][class*='ketch-text-left'],
[dir='rtl'] #ketch-modal [role='tab'][class*='ketch-text-left'],
[dir='rtl'] #ketch-purposes-modal [role='tab'][class*='ketch-text-left'],
[dir='rtl'] #ketch-preferences [role='tab'][class*='ketch-text-left'] {
  width: 100%;
}

[dir='rtl'] #ketch-banner [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-banner [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-modal [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-modal [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-purposes-modal [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-purposes-modal [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-preferences [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2),
[dir='rtl'] #ketch-preferences [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2) {
  width: 100%;
}

[dir='rtl'] #ketch-banner [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-banner [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-modal [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-modal [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-purposes-modal [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-purposes-modal [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-preferences [class*='ketch-items-start']:has(> div > h1, > div > h2, > h1, > h2) > div,
[dir='rtl'] #ketch-preferences [class*='ketch-items-center']:has(> div > h1, > div > h2, > h1, > h2) > div {
  width: 100%;
}

[dir='rtl'] #ketch-modal button[aria-label='Exit'],
[dir='rtl'] #ketch-purposes-modal button[aria-label='Exit'] {
  flex-direction: row-reverse !important;
}

[dir='rtl'] #ketch-banner [class*='ketch-ml-auto'],
[dir='rtl'] #ketch-modal [class*='ketch-ml-auto'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-ml-auto'],
[dir='rtl'] #ketch-preferences [class*='ketch-ml-auto'] {
  margin-left: unset !important;
  margin-right: auto !important;
}

[dir='rtl'] #ketch-banner [class*='ketch-mr-auto'],
[dir='rtl'] #ketch-modal [class*='ketch-mr-auto'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-mr-auto'],
[dir='rtl'] #ketch-preferences [class*='ketch-mr-auto'] {
  margin-right: unset !important;
  margin-left: auto !important;
}

[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'],
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'],
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] {
  direction: ltr !important;
  flex-direction: row-reverse !important;
  padding-inline-start: 0.75rem;
}

/* Descendant (not child) combinator for the switch label: newer lanyard builds
   wrap it in an extra div (row > div > label), older ones have row > label. */
[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'] label,
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'] label,
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'] label,
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] label {
  flex-shrink: 0;
  margin-inline-end: 0.75rem;
}

[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'] label > [class*='ketch-inline-flex'],
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'] label > [class*='ketch-inline-flex'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'] label > [class*='ketch-inline-flex'],
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] label > [class*='ketch-inline-flex'] {
  flex-direction: row-reverse !important;
}

[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'] > button,
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'] > button,
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'] > button,
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] > button {
  flex: 1 1 auto;
  min-width: 0;
}

[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'] > button > [class*='ketch-flex'],
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'] > button > [class*='ketch-flex'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'] > button > [class*='ketch-flex'],
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] > button > [class*='ketch-flex'] {
  flex-direction: row-reverse !important;
  justify-content: flex-end !important;
  width: 100%;
}

[dir='rtl'] #ketch-banner [class*='ketch-min-h-\\[57px\\]'] > button [class*='ketch-text-left'],
[dir='rtl'] #ketch-modal [class*='ketch-min-h-\\[57px\\]'] > button [class*='ketch-text-left'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-min-h-\\[57px\\]'] > button [class*='ketch-text-left'],
[dir='rtl'] #ketch-preferences [class*='ketch-min-h-\\[57px\\]'] > button [class*='ketch-text-left'] {
  text-align: right !important;
}

[dir='rtl'] #ketch-banner [class*='ketch-transition-transform'],
[dir='rtl'] #ketch-modal [class*='ketch-transition-transform'],
[dir='rtl'] #ketch-purposes-modal [class*='ketch-transition-transform'],
[dir='rtl'] #ketch-preferences [class*='ketch-transition-transform'] {
  transform: scaleX(-1) rotate(-90deg) !important;
}

[dir='rtl'] #ketch-preferences [role='tablist'] {
  width: 100%;
  align-items: stretch;
}

[dir='rtl'] #ketch-preferences [role='tab'] {
  display: flex !important;
  width: 100%;
  direction: ltr !important;
  justify-content: flex-end !important;
  text-align: right !important;
}

[dir='rtl'] #ketch-preferences button[aria-label='Exit'] {
  display: flex !important;
  width: 100%;
  direction: ltr !important;
  flex-direction: row-reverse !important;
  text-align: right !important;
}

[dir='rtl'] #ketch-preferences [class*='ketch-mr-auto'][class*='ketch-max-w-5xl'] {
  direction: ltr;
  margin-left: auto !important;
  margin-right: auto !important;
}

[dir='rtl'] #ketch-preferences [class*='ketch-mr-auto'][class*='ketch-max-w-5xl'] [class*='ketch-flex'] {
  justify-content: flex-end !important;
  direction: ltr;
}

[dir='rtl'] #ketch-modal [class*='ketch-justify-between']:not([class*='ketch-min-h-\\[57px\\]']),
[dir='rtl'] #ketch-modal [class*='ketch-items-center']:not([class*='ketch-min-h-\\[57px\\]']):not([class*='ketch-min-h-\\[57px\\]'] *),
[dir='rtl'] #ketch-purposes-modal [class*='ketch-justify-between']:not([class*='ketch-min-h-\\[57px\\]']),
[dir='rtl'] #ketch-purposes-modal [class*='ketch-items-center']:not([class*='ketch-min-h-\\[57px\\]']):not([class*='ketch-min-h-\\[57px\\]'] *) {
  direction: rtl;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'],
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] {
  direction: rtl;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'] [class*='ketch-flex-col'],
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] [class*='ketch-flex-col'] {
  align-items: flex-end !important;
  width: 100%;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'] [class*='ketch-justify-between']:has(img[alt='header-logo']),
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] [class*='ketch-justify-between']:has(img[alt='header-logo']) {
  align-self: stretch !important;
  justify-content: flex-end !important;
  width: 100% !important;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'] img[alt='header-logo'],
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] img[alt='header-logo'] {
  margin-inline-end: auto !important;
  margin-inline-start: 0 !important;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'] [class*='ketch-items-center']:has(#modal-title),
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] [class*='ketch-items-center']:has(#modal-title) {
  justify-content: flex-end !important;
  width: 100%;
}

[dir='rtl'] #ketch-modal [class*='k-modal-header-background-color'] #modal-title,
[dir='rtl'] #ketch-purposes-modal [class*='k-modal-header-background-color'] #modal-title {
  display: block;
  width: 100%;
  text-align: right !important;
}
`.trim();
