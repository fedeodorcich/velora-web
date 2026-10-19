// Configuración de Karma/Jasmine para las pruebas unitarias.
// Usa Microsoft Edge (Chromium) en modo headless si no hay Chrome instalado.
// La ruta del binario se toma de la variable de entorno EDGE_BIN o CHROME_BIN.
const path = require('path');
const fs = require('fs');

function resolveEdgeBin() {
  const candidates = [
    process.env.EDGE_BIN,
    process.env.CHROME_BIN,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/microsoft-edge',
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  });
}

const edgeBin = resolveEdgeBin();
if (edgeBin) {
  // karma-chrome-launcher resuelve el binario desde CHROME_BIN.
  process.env.CHROME_BIN = edgeBin;
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/frontend'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['EdgeHeadless'],
    customLaunchers: {
      EdgeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
  });
};
