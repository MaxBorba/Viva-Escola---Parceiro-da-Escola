/**
 * Utilitário de compressão de imagens para Celular, Tablet e Notebook
 * Redimensiona e otimiza fotos capturadas pela câmera ou selecionadas da galeria,
 * evitando estouro de memória no navegador e garantindo laudos em PDF nítidos e rápidos.
 */

export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 1024,
  maxHeight = 768,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se já for uma string curta ou não-imagem
    if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:image')) {
      resolve(fileOrDataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calcula proporção mantendo aspecto original
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Desenha imagem redimensionada
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('[ImageCompressor] Falha ao comprimir via canvas, usando original:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onerror = (err) => {
      console.warn('[ImageCompressor] Erro ao carregar imagem para compressão:', err);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        reject(new Error('Falha ao processar arquivo de imagem'));
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Erro ao ler arquivo da câmera/galeria'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo selecionado'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
