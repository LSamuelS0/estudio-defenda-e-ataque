"""Tira o serrilhado das bordas de uma spritesheet (regra do projeto: nada serrilhado).

Para cada quadro: o alfa da borda e alisado (desfoque leve + curva suave), o que arredonda os "degraus"
de pixel sem borrar o miolo. Pixels que ganham um pouco de alfa recebem a cor do pixel opaco mais perto
(o contorno de tinta), entao nao aparece franja clara nem escura.

Uso:
  python suavizar_bordas.py medir  folha.png  largura_quadro altura_quadro colunas quadros
  python suavizar_bordas.py corrigir entrada.png saida.png largura_quadro altura_quadro colunas quadros
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def bordas_duras(alfa: np.ndarray) -> float:
    """Fracao da borda do desenho que e dura (pixel quase opaco encostado num transparente)."""
    vis = alfa > 8
    transp = ~vis
    viz = ndi.binary_dilation(transp, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]]))
    borda = vis & viz
    if borda.sum() == 0:
        return 0.0
    return float((borda & (alfa > 235)).sum() / borda.sum())


def suavizar_quadro(q: np.ndarray, sigma: float = 0.85) -> np.ndarray:
    q = q.astype(np.float32)
    a = q[..., 3] / 255.0
    if a.max() <= 0:
        return q.astype(np.uint8)
    # alfa alisado: desfoque leve e curva suave (smoothstep) -> contorno redondo, transicao de 1-2 px
    b = ndi.gaussian_filter(a, sigma)
    novo = np.clip((b - 0.18) / 0.64, 0.0, 1.0)
    novo = novo * novo * (3 - 2 * novo)
    # so mexe nos degraus duros: pixel quase opaco encostado num transparente (e 2 px em volta).
    # Sombras, brilhos e bordas que ja sao macias ficam exatamente como estavam.
    cruz = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    duro = (a > 0.9) & ndi.binary_dilation(a < 0.05, structure=cruz)
    zona = ndi.binary_dilation(duro, iterations=2) & ((a > 0.9) | (a < 0.05))
    a2 = np.where(zona, novo, a)
    # quem ganhou alfa recebe a cor do pixel visivel mais perto
    ganhou = (a2 > a + 0.02)
    if ganhou.any():
        _, (iy, ix) = ndi.distance_transform_edt(a < 0.5, return_indices=True)
        for c in range(3):
            canal = q[..., c]
            q[..., c] = np.where(ganhou, canal[iy, ix], canal)
    q[..., 3] = a2 * 255.0
    return np.clip(q, 0, 255).astype(np.uint8)


def quadros(img: np.ndarray, fw: int, fh: int, cols: int, n: int):
    for k in range(n):
        x, y = (k % cols) * fw, (k // cols) * fh
        yield k, x, y, img[y:y + fh, x:x + fw]


def medir(caminho, fw, fh, cols, n):
    img = np.array(Image.open(caminho).convert("RGBA"))
    vals = [bordas_duras(q[..., 3]) for _, _, _, q in quadros(img, fw, fh, cols, n)]
    return float(np.mean(vals))


def corrigir(entrada, saida, fw, fh, cols, n):
    img = np.array(Image.open(entrada).convert("RGBA"))
    out = img.copy()
    for _, x, y, q in quadros(img, fw, fh, cols, n):
        out[y:y + fh, x:x + fw] = suavizar_quadro(q)
    Image.fromarray(out, "RGBA").save(saida, optimize=True)


if __name__ == "__main__":
    a = sys.argv
    if a[1] == "medir":
        print("%.1f%%" % (100 * medir(a[2], *map(int, a[3:7]))))
    else:
        corrigir(a[2], a[3], *map(int, a[4:8]))
