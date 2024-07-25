let currEnergy = 0;
let maxEnergy = 1000;
let autoTappingEnabled = false;
let isTappingNow = false;
let selectedEnergyThreshold = 200;

const timerDisplayElem = document.getElementById('timerToTap');

const bankDisplayElem = document.getElementById('bankDisplay');

const boostFractionElem = document.getElementById('boostFraction');
const boostScrapedElem = document.getElementById('boostScraped');
const boostParsedElem = document.getElementById('boostParsed');
const priceScrapedElem = document.getElementById('priceScraped');
const priceParsedElem = document.getElementById('priceParsed');

const injectButtonElem = document.getElementById('injectButton');
const tapNowButtonElem = document.getElementById('tapNowButton');
const autoTapButtonElem = document.getElementById('autoTapButton');

tapNowButtonElem.disabled = true;
autoTapButtonElem.disabled = true;

injectButtonElem.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, allFrames: true },
      func: mainInjectable,
    });
  });
  injectButtonElem.disabled = true;
  tapNowButtonElem.disabled = false;
  autoTapButtonElem.disabled = false;
});

tapNowButtonElem.addEventListener('click', () => {
  sendStartTappingMessage();
});

autoTapButtonElem.addEventListener('click', () => {
  if (autoTappingEnabled) {
    autoTappingEnabled = false;
    autoTapButtonElem.textContent = 'Turn on autotap';
  } else {
    autoTappingEnabled = true;
    autoTapButtonElem.textContent = 'Turn off autotap';
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'bankValue':
      bankDisplayElem.textContent = message.message.bankValue.replaceAll(',', ' ');
      break;

    case 'upgradeDigits':
      applyDigits(message.message?.upgradeDigits);
      break;

    case 'energyReadings':
      tappingDecider(message.message?.energyReadings);
      break;

    case 'tapStopped':
      restartTapping();
      break;

    default:
      break;
  }
});

function applyDigits(upgradeDigits) {
  const parsedBoost = parseDigits(upgradeDigits?.scrapedBoost);
  const scrapedPrice = parseDigits(upgradeDigits?.scrapedPrice);
  if (parsedBoost && scrapedPrice) {
    const boostFraction = String(Math.round((parsedBoost / scrapedPrice) * 10000) / 100) + '%';

    boostFractionElem.textContent = boostFraction;
    boostScrapedElem.textContent = upgradeDigits.scrapedBoost;
    boostParsedElem.textContent = parsedBoost;
    priceScrapedElem.textContent = upgradeDigits.scrapedPrice;
    priceParsedElem.textContent = scrapedPrice;
  } else {
    boostFractionElem.textContent = 0;
    boostScrapedElem.textContent = 0;
    boostParsedElem.textContent = 0;
    priceScrapedElem.textContent = 0;
    priceParsedElem.textContent = 0;
  }
}

function parseDigits(str) {
  if (str) {
    const parsedStr = str.replace(/[,+]/g, '');
    return parsedStr.endsWith('K') ? parseFloat(parsedStr) * 1000 : parseFloat(parsedStr);
  }
  return null;
}

function tappingDecider(energyReadings) {
  if (energyReadings) {
    currEnergy = energyReadings.currEnergy;
    maxEnergy = energyReadings.maxEnergy;

    if (autoTappingEnabled && currEnergy >= selectedEnergyThreshold && !isTappingNow) {
      isTappingNow = true;
      sendStartTappingMessage();
    }
  }

  formatRemainingTime();
}

function sendStartTappingMessage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'tapNow' });
  });
}

function formatRemainingTime() {
  if (!autoTappingEnabled) {
    timerDisplayElem.textContent = 'Autotapping inactive';
  } else if (isTappingNow) {
    timerDisplayElem.textContent = 'Tapping is in progress...';
  } else {
    const remainingEnergy = selectedEnergyThreshold - currEnergy;
    const remainingTimeMin = Math.floor(remainingEnergy / 3 / 60);
    const remainingTimeSec = Math.floor(remainingEnergy / 3 - remainingTimeMin * 60);
    const time = `${remainingTimeMin}:${remainingTimeSec.toString().padStart(2, '0')}`;
    timerDisplayElem.textContent = `About ${time} until ${selectedEnergyThreshold}`;
  }
}

function restartTapping() {
  selectedEnergyThreshold = normalDistribution(20, maxEnergy);
  isTappingNow = false;
}

function normalDistribution(min, max) {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = (num + 3) / 6;
  num = min + num * (max - min);
  return Math.min(Math.max(Math.round(num), min), max);
}

/// INJECTABLE /////////////////////////////////////////////////////////////////

function mainInjectable() {
  let timeoutId;
  let signalToStartTapping = false;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'tapNow') {
      signalToStartTapping = true;
    }
  });

  function tick() {
    if (window.location.href.includes('hamsterkombatgame.io')) {
      const energyElem = document.querySelector('.user-tap-energy > p');
      if (energyElem) {
        const currEnergy = parseInt(energyElem.textContent.split('/')[0]);
        const maxEnergy = parseInt(energyElem.textContent.split('/')[1]);
        sendEnergyReadings(currEnergy, maxEnergy);
      }

      const bankElem = document.querySelector('.user-balance-large-inner > p');
      if (bankElem) {
        sendBankReadings(bankElem.textContent);
      }

      const tappingSectionClasses = document.querySelector('nav.app-bar-nav').children[0].classList;
      if (tappingSectionClasses.contains('router-link-active') && signalToStartTapping) {
        signalToStartTapping = false;
        tap4times();
      }

      const upgradesSectionClasses = document.querySelector('nav.app-bar-nav').children[1].classList;
      if (upgradesSectionClasses.contains('router-link-active')) {
        for (let i = 0; i < 10; i++) {
          setTimeout(tryReadUpgradesNumbers, i * 100);
        }
      }
    }

    timeoutId = setTimeout(tick, 1000);
  }

  function tryReadUpgradesNumbers() {
    const priceElem = document.querySelector('.bottom-sheet-scroll .upgrade-buy-info .price-value');
    const boostElem = document.querySelector('.bottom-sheet-scroll .upgrade-buy-stats .price-value');
    if (priceElem && boostElem) {
      chrome.runtime.sendMessage({
        action: 'upgradeDigits',
        message: { upgradeDigits: { scrapedPrice: priceElem.textContent, scrapedBoost: boostElem.textContent } },
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'upgradeDigits',
        message: { upgradeDigits: null },
      });
    }
  }

  function tap4times() {
    const energyElem = document.querySelector('.user-tap-energy > p');
    const currEnergy = parseInt(energyElem.textContent.split('/')[0]);
    const maxEnergy = parseInt(energyElem.textContent.split('/')[1]);

    const buttonElem = document.querySelector('.user-tap-button');

    if (currEnergy && currEnergy > 10 && buttonElem) {
      buttonElem.dispatchEvent(new PointerEvent('pointerup'));
      buttonElem.dispatchEvent(new PointerEvent('pointerup'));
      buttonElem.dispatchEvent(new PointerEvent('pointerup'));
      buttonElem.dispatchEvent(new PointerEvent('pointerup'));

      setTimeout(tap4times, 1000 / (6 + Math.random())); // примерно 6-7 нажатий в секунду
    } else {
      sendTapStoppedMessage();
    }
  }

  function sendEnergyReadings(currEnergy, maxEnergy) {
    chrome.runtime.sendMessage({
      action: 'energyReadings',
      message: {
        energyReadings: {
          currEnergy: currEnergy,
          maxEnergy: maxEnergy,
        },
      },
    });
  }

  function sendBankReadings(scrapedValue) {
    chrome.runtime.sendMessage({
      action: 'bankValue',
      message: {
        bankValue: scrapedValue,
      },
    });
  }

  function sendTapStoppedMessage() {
    chrome.runtime.sendMessage({
      action: 'tapStopped',
    });
  }

  timeoutId = setTimeout(tick, 1000);
}
