"""
Respiração parada (idle) em alta qualidade a partir dos recortes v2_<vista>.png.
- escala para 240 px de corpo com Lanczos em alfa pré-multiplicado (sem serrilhado nem halo);
- 30 quadros/3 s: sobe e desce mantendo o volume (squash & stretch) + balanço leve do peso (ação secundária);
- fase deslocada para nenhum quadro se repetir e o loop não ter emenda.
Saída: saida3/mago_parado_<vista>.png e mago_parado.json (quadro 240×330, pivô 120,316).
Depois: node app/cli/estudio.js conferir saida3/mago_parado_frente.png 240 330 30 personagem
"""
import numpy as np, json, os
from PIL import Image
W,H=240,330; PX,PY=120,316; ALT=240; N=30
def premult(im):
    a=np.array(im).astype(np.float32)/255; a[...,:3]*=a[...,3:4]; return a
def unpremult(a):
    o=a.copy(); al=o[...,3:4]; o[...,:3]=np.where(al>1e-4,o[...,:3]/np.maximum(al,1e-4),0); return (np.clip(o,0,1)*255+0.5).astype(np.uint8)
def redim(a,w,h):
    canais=[np.array(Image.fromarray(a[...,c]).resize((w,h),Image.LANCZOS)) for c in range(4)]
    return np.clip(np.dstack(canais),0,1)
def transformar(a,sx,sy,ox,oy,sh=0.0):
    # escala em torno do ponto (ox,oy) de 'a' (pré-multiplicado), saída do mesmo tamanho, reamostragem bicúbica
    canais=[]
    for c in range(4):
        im=Image.fromarray(a[...,c])
        canais.append(np.array(im.transform(im.size,Image.AFFINE,(1/sx,-sh/sy,ox-ox/sx+sh*oy/sy,0,1/sy,oy-oy/sy),resample=Image.BICUBIC)))
    return np.clip(np.dstack(canais),0,1)
os.makedirs('saida3',exist_ok=True)
meta={'quadros':N,'colunas':N,'largura_quadro':W,'altura_quadro':H,'pivo_px':[PX,PY],'escala_jogo':0.5,'direcoes':{},'fps':10,'duracao_s':3,'modelo':'mago','gerado_por':'Estúdio Defenda e Ataque · recorte de alta qualidade (Mago v3)'}
for d in ['frente','costas','esquerda','direita']:
    im=Image.open(f'v2_{d}.png'); a=premult(im)
    ys,xs=np.where(a[...,3]>0.05); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
    a=a[y0:y1+1,x0:x1+1]; h,w=a.shape[:2]
    # centro horizontal pelos pés (base), para o pivô ficar no apoio
    base=a[int(h*0.92):,:,3]>0.3; xb=np.where(base.any(0))[0]; cx=(xb.min()+xb.max())/2
    s=ALT/h; nw,nh=round(w*s),round(h*s); a=redim(a,nw,nh); cx*=s
    quadro=np.zeros((H,W,4),np.float32); ox=round(PX-cx); oy=PY-nh+1
    quadro[oy:oy+nh,ox:ox+nw]=a
    folha=np.zeros((H,W*N,4),np.uint8)
    for k in range(N):
        th=2*np.pi*(k+0.25)/N+np.pi/2
        sy=1+0.012*np.sin(th); sx=1/np.sqrt(sy)   # respira e mantém o volume (squash & stretch)
        sh=0.008*np.cos(th)                        # balanço leve do peso (ação secundária)
        q=transformar(quadro,sx,sy,PX,PY,sh)
        folha[:,k*W:(k+1)*W]=unpremult(q)
    Image.fromarray(folha).save(f'saida3/mago_parado_{d}.png',optimize=True)
    meta['direcoes'][d]={'arquivo':f'mago_parado_{d}.png'}
json.dump(meta,open('saida3/mago_parado.json','w'),indent=1,ensure_ascii=False)
ims=[Image.fromarray(np.array(Image.open(f'saida3/mago_parado_{d}.png'))[:, :W]) for d in ['frente','esquerda','costas','direita']]
prev=Image.new('RGBA',(W*4,H),(30,32,40,255))
for i,x in enumerate(ims): prev.alpha_composite(x,(i*W,0))
prev.crop((0,60,W*4,H)).resize((W*4*2,(H-60)*2),Image.LANCZOS).save('prev4.png')
