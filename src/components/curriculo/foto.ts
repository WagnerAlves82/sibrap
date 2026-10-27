// Reduz a foto do currículo no próprio navegador antes de qualquer envio:
// recorta em 3x4 (centralizada, um pouco acima do meio, onde costuma estar o rosto)
// e salva em JPEG de até ~150 KB. Uma foto de 4 MB do celular vira ~60 a 120 KB.

const LARGURA = 480;
const ALTURA = 640;
const MAX_BYTES = 150 * 1024;

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("formato"));
    };
    img.src = url;
  });
}

export async function reduzirFoto(arquivo: File): Promise<string> {
  if (arquivo.size > 25 * 1024 * 1024) throw new Error("Foto muito grande. Escolha uma de até 25 MB.");
  let img: HTMLImageElement;
  try {
    img = await carregar(arquivo);
  } catch {
    throw new Error("Não deu para abrir essa foto. Tente uma em JPG ou PNG (no iPhone, tire um print da foto e use o print).");
  }

  // recorte 3x4
  const proporcao = LARGURA / ALTURA;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (sw / sh > proporcao) sw = sh * proporcao;
  else sh = sw / proporcao;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = Math.max(0, (img.naturalHeight - sh) * 0.3);

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a foto.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, LARGURA, ALTURA);

  for (const qualidade of [0.85, 0.75, 0.65, 0.55]) {
    const dataUrl = canvas.toDataURL("image/jpeg", qualidade);
    if (dataUrl.length * 0.75 <= MAX_BYTES) return dataUrl;
  }
  return canvas.toDataURL("image/jpeg", 0.5);
}
