// content_scripts/ocr_selector.js

(function() {
  if (window.hasMatchaOCRRun) return;
  window.hasMatchaOCRRun = true;

  console.log("Matcha OCR Scanner initialized.");

  window.startMatchaOCR = function(onDetected) {
    // Create full screen overlay canvas for region selection
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483645;
      cursor: crosshair;
    `;

    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
      border: 2px dashed #A7D08C;
      background: rgba(167, 208, 140, 0.15);
      position: absolute;
      display: none;
      pointer-events: none;
    `;
    overlay.appendChild(selectionBox);
    document.body.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let isSelecting = false;

    overlay.addEventListener('mousedown', (e) => {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.style.display = 'block';
    });

    overlay.addEventListener('mousemove', (e) => {
      if (!isSelecting) return;
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(startX - currentX);
      const height = Math.abs(startY - currentY);
      
      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
    });

    overlay.addEventListener('mouseup', async (e) => {
      if (!isSelecting) return;
      isSelecting = false;
      
      const endX = e.clientX;
      const endY = e.clientY;
      
      const cropX = Math.min(startX, endX);
      const cropY = Math.min(startY, endY);
      const cropW = Math.abs(startX - endX);
      const cropH = Math.abs(startY - endY);
      
      // Clean up overlay immediately
      document.body.removeChild(overlay);

      if (cropW < 10 || cropH < 10) return; // Selection too small

      // Ask background script to capture screen
      chrome.runtime.sendMessage({ action: "capture_screen" }, (dataUrl) => {
        if (!dataUrl) {
          console.error("Capture visible tab failed.");
          return;
        }

        // Load image, crop, and send to backend
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // Device pixel ratio correction
          const dpr = window.devicePixelRatio || 1;
          const canvas = document.createElement('canvas');
          canvas.width = cropW;
          canvas.height = cropH;
          const ctx = canvas.getContext('2d');
          
          // Draw cropped portion
          ctx.drawImage(
            img, 
            cropX * dpr, 
            cropY * dpr, 
            cropW * dpr, 
            cropH * dpr, 
            0, 
            0, 
            cropW, 
            cropH
          );

          canvas.toBlob((blob) => {
            if (blob) {
              performOCRDetect(blob, onDetected);
            }
          }, 'image/jpeg');
        };
      });
    });
  };

  async function performOCRDetect(blob, callback) {
    const formData = new FormData();
    formData.append('file', blob, 'ocr_screenshot.jpg');

    try {
      const response = await fetch('https://ieltsoasis.site/api/vocabulary/detect', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.items && result.items.length > 0) {
          callback(result.items[0]); // Return the first detected word card
        } else {
          alert("Không nhận diện được từ vựng nào trong vùng quét. Thử lại nhé! 🍵");
        }
      }
    } catch (err) {
      console.error("OCR scan api call failed: ", err);
    }
  }
})();
