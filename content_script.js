// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('lolkek01 request.action:', request.action);
//   if (request.action === 'tapButton') {
//     tapButton();
//   }
//   sendResponse({ status: 'done' });
// });

// function tapButton() {
//   const iframe = document.querySelector("iframe[src*='hamsterkombatgame.io']");
//   console.log('lolkek02 iframe:', iframe);
//   console.log('lolkek05 Boolean(iframe):', Boolean(iframe));
//   const isIframe = Boolean(iframe);
//   if (isIframe) {
//     console.log('lolkek06');
//     try {
//       console.log('lolkek07');
//       const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
//       console.log('lolkek03 iframeDocument:', iframeDocument);
//       const button = iframeDocument.querySelector('.user-tap-button');
//       console.log('lolkek04 button:', button);
//       if (button) {
//         button.dispatchEvent(new PointerEvent('pointerup'));
//       }
//     } catch (error) {
//       console.error('Error accessing iframe content:', error);
//     }
//   }
// }

// window.isClicking = false;
// window.reachedZeroEnergy = false;

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "startClicking") {
//     startClicking();
//   } else if (request.action === "stopClicking") {
//     stopClicking();
//   }
//   sendResponse({ status: "done" });
// });

// function startClicking() {
//   window.isClicking = true;
//   const button = document.querySelector(".user-tap-button");

//   function tick() {
//     if (!window.isClicking) return;

//     try {
//       const energy = document.querySelector(".user-tap-energy > p");
//       if (energy) {
//         const energyStr = energy.innerText;
//         const currEnergy = Number(energyStr.split('/')[0]);
//         const maxEnergy = Number(energyStr.split('/')[1]);

//         if (!window.reachedZeroEnergy) {
//           button.dispatchEvent(new PointerEvent('pointerup'));
//           button.dispatchEvent(new PointerEvent('pointerup'));
//           button.dispatchEvent(new PointerEvent('pointerup'));
//           button.dispatchEvent(new PointerEvent('pointerup'));
//         }

//         if (currEnergy <= 10) {
//           window.reachedZeroEnergy = true;
//         }

//         if (currEnergy >= maxEnergy - 10) {
//           window.reachedZeroEnergy = false;
//         }
//       }
//     } catch (e) {
//       console.log(e);
//     }

//     setTimeout(tick, 1000 / (6 + Math.random())); // примерно 143-167 миллисекунд
//   }

//   tick();
// }

// function stopClicking() {
//   window.isClicking = false;
// }
