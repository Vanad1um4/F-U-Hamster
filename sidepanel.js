// let isScriptRunning = false;
const boostFractionDiv = document.getElementById('boostFraction');
const boostScrapedDiv = document.getElementById('boostScraped');
const boostParsedDiv = document.getElementById('boostParsed');
const priceScrapedDiv = document.getElementById('priceScraped');
const priceParsedDiv = document.getElementById('priceParsed');

document.getElementById('injectButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, allFrames: true },
      func: mainInjectable,
    });
  });
});

document.getElementById('startButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'startScript' });
  });
});

document.getElementById('tapNowButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'tapNow' });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'upgradeDigits':
      applyDigits(message.message?.upgradeDigits);
      break;

    case 'energy':
      console.log(message.message);
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

    boostFractionDiv.textContent = boostFraction;
    boostScrapedDiv.textContent = upgradeDigits.scrapedBoost;
    boostParsedDiv.textContent = parsedBoost;
    priceScrapedDiv.textContent = upgradeDigits.scrapedPrice;
    priceParsedDiv.textContent = scrapedPrice;
  } else {
    boostFractionDiv.textContent = 0;
    boostScrapedDiv.textContent = 0;
    boostParsedDiv.textContent = 0;
    priceScrapedDiv.textContent = 0;
    priceParsedDiv.textContent = 0;
  }
}

function parseDigits(str) {
  if (str) {
    const parsedStr = str.replace(/[, +]/g, '');
    return parsedStr.endsWith('K') ? parseFloat(parsedStr) * 1000 : parseFloat(parsedStr);
  }
  return null;
}

/// INJECTABLE /////////////////////////////////////////////////////////////////

function mainInjectable() {
  let timeoutId;
  let isTickRunning = false;
  let startTapping = false;
  const button = document.querySelector('.user-tap-button');
  const energyElem = document.querySelector('.user-tap-energy > p');

  if (energyElem) {
    sendEnergyReadings();
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startScript' && !isTickRunning) {
      timeoutId = setTimeout(tick, 1000);
      isTickRunning = true;
    }

    if (message.action === 'tapNow') {
      startTapping = true;
    }
  });

  function tick() {
    if (window.location.href.includes('hamsterkombatgame.io')) {
      const tappingSectionClasses = document.querySelector('nav.app-bar-nav').children[0].classList;
      if (tappingSectionClasses.contains('router-link-active') && startTapping) {
        startTapping = false;
        tap4times();
      }

      const upgradesSectionClasses = document.querySelector('nav.app-bar-nav').children[1].classList;
      if (upgradesSectionClasses.contains('router-link-active')) {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            tryReadUpgradesNumbers();
          }, i * 100);
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
    const currEnergy = Number(energyElem.textContent.split('/')[0]);

    if (currEnergy > 50) {
      button.dispatchEvent(new PointerEvent('pointerup'));
      button.dispatchEvent(new PointerEvent('pointerup'));
      button.dispatchEvent(new PointerEvent('pointerup'));
      button.dispatchEvent(new PointerEvent('pointerup'));

      setTimeout(tap4times, 1000 / (6 + Math.random())); // примерно 6-7 нажатий в секунду
    } else {
      startTapping = false;
      sendEnergyReadings();
    }
  }

  function sendEnergyReadings() {
    chrome.runtime.sendMessage({
      action: 'energy',
      message: {
        currEnergy: parseInt(energyElem.textContent.split('/')[0]),
        maxEnergy: parseInt(energyElem.textContent.split('/')[1]),
      },
    });
  }
}
