const priceFractionDiv = document.getElementById('priceFraction');

document.getElementById('startButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, allFrames: true },
      func: init,
    });
  });
});

// document.getElementById('stopButton').addEventListener('click', () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     chrome.tabs.sendMessage(tabs[0].id, { action: 'stopClicking' });
//   });
// });

document.getElementById('tapButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, allFrames: true },
      func: tapButton,
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'buttonClicked') {
  } else if (message.action === 'tick') {
    if (message.message.priceFraction) {
      priceFractionDiv.textContent = message.message.priceFraction;
    } else {
      priceFractionDiv.textContent = '-';
    }
  }
});

function tapButton() {
  if (window.location.href.includes('hamsterkombatgame.io')) {
    const button = document.querySelector('.user-tap-button');
    if (button) {
      button.dispatchEvent(new PointerEvent('pointerup'));
      // console.log('Button clicked');
      // chrome.runtime.sendMessage({
      //   action: 'buttonClicked',
      //   message: 'Button was successfully clicked!',
      // });
    } else {
      // console.log('Button not found');
      // chrome.runtime.sendMessage({
      //   action: 'buttonClicked',
      //   message: 'Button was not found.',
      // });
    }
  } else {
    // console.log('Not in the correct iframe');
  }
}

function init() {
  function tick() {
    if (window.location.href.includes('hamsterkombatgame.io')) {
      const price = document.querySelector('.bottom-sheet-scroll .upgrade-buy-info .price-value');
      const increment = document.querySelector('.bottom-sheet-scroll .upgrade-buy-stats .price-value');
      if (price && increment) {
        const priceNum = parseInt(price.textContent.replace(/[.,+]/g, ''));
        const incrementNum = parseInt(increment.textContent.replace(/[.,+]/g, ''));
        const priceFraction = String(Math.round((incrementNum / priceNum) * 10000) / 100) + '%';
        chrome.runtime.sendMessage({
          action: 'tick',
          message: { priceFraction: priceFraction },
        });
      } else {
        chrome.runtime.sendMessage({
          action: 'tick',
          message: { priceFraction: null },
        });
      }
    }
    setTimeout(tick, 100);
  }
  tick();
}
