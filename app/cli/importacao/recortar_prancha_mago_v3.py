"""
Recorte de alta qualidade de uma prancha de referência (Mago v3, corpo base).
Regra de importação de texturas (skills/animacao-2d-pincel/SKILL.md, "Qualidade de textura na importação"):
  - fundo de papel removido com alfa suave e cor descontaminada (sem franja clara);
  - linhas guia da prancha apagadas por dentro do corpo; contorno escuro fechado onde a linha cortou o traço;
  - sombra do chão e marcas soltas removidas; só a figura principal fica;
  - vista esquerda = vista direita espelhada (mesmo rosto, mesmo cabelo, olhando para o lado oposto).
Uso (na raiz do repositório): python3 app/cli/importacao/recortar_prancha_mago_v3.py  → gera v2_<vista>.png na pasta atual.
Para outra prancha: ajuste GUIAS (linhas tracejadas) e caixas (recorte de cada vista).
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd
fonte=np.array(Image.open('docs/referencias/mago_v3/01_guia_referencia_corpo_nu.png').convert('RGB')).astype(float)
GUIAS=sorted({g+d for g in [58,59,129,190,227,228,274,333,334] for d in (-1,0,1)})
caixas={'frente':(88,48,222,346),'costas':(372,48,500,346),'direita':(518,48,622,346)}
def mascara(a):
    h,w,_=a.shape
    borda=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]); bg=np.median(borda,axis=0)
    mx=a.max(2); mn=a.min(2); sat=(mx-mn)/np.maximum(mx,1); lum=a.mean(2); rg=a[...,0]-a[...,1]
    dist=np.sqrt(((a-bg)**2).sum(2)/3)
    cand=(dist<30)|((sat<0.16)&(lum>120))
    lab,n=nd.label(cand); tocam=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fundo=np.isin(lab,list(tocam))
    fig=nd.binary_fill_holes(~fundo)
    papel=fig&~fundo&(rg<20)&(lum>140)&(sat<0.2); lp,npap=nd.label(papel)
    for k in range(1,npap+1):
        m=lp==k
        if m.sum()>30: fig&=~m
    yy=np.arange(h)[:,None]*np.ones((1,w)); base=np.where(fig.any(1))[0].max()
    faixa=yy>base-h*0.1; livre=faixa&(lum>95)&~((rg>38)&(sat>0.25))
    lv,_=nd.label(livre); fora=nd.binary_dilation(~fig)
    for k in set(np.unique(lv[fora&livre]))-{0}: fig&=~(lv==k)
    fig=nd.binary_opening(fig,structure=np.ones((3,1)))
    lf,nf=nd.label(fig); tam=nd.sum(fig,lf,range(1,nf+1)); fig=lf==(np.argmax(tam)+1)
    bur,nb=nd.label(~fig)
    for k in range(1,nb+1):
        m=bur==k
        if m.sum()<30 and not (m[0].any() or m[-1].any() or m[:,0].any() or m[:,-1].any()): fig|=m
    return fig,bg,dist
for nome,(x0,y0,x1,y1) in caixas.items():
    a=fonte[y0:y1,x0:x1].copy(); h,w,_=a.shape
    fig,bg,dist=mascara(a)
    # 1) apaga as linhas guia que atravessam o corpo (interpola entre a linha de cima e a de baixo)
    for g in sorted(set(GUIAS)):
        y=g-y0
        if not (2<=y<h-2): continue
        ya,yb=y-1,y+1
        while ya-1>=0 and (ya+y0) in GUIAS: ya-=1
        while yb+1<h and (yb+y0) in GUIAS: yb+=1
        cima,baixo=a[ya-1] if ya-1>=0 else a[ya],a[yb+1] if yb+1<h else a[yb]
        for yy in range(ya+1 if (ya+y0) not in GUIAS else ya, yb if (yb+y0) not in GUIAS else yb+1):
            t=(yy-(ya-1))/max(1,(yb+1)-(ya-1)); interp=cima*(1-t)+baixo*t
            dif=np.abs(a[yy]-interp).mean(1); vizinhos=np.abs(cima-baixo).mean(1)
            troca=fig[yy]&(dif>10)&(vizinhos<40)
            a[yy][troca]=interp[troca]
    # 2) alfa suave na faixa da borda + cor sem franja de papel
    dist=np.sqrt(((a-bg)**2).sum(2)/3)
    dentro=nd.binary_erosion(fig,iterations=1); faixa=nd.binary_dilation(fig,iterations=1)&~dentro
    alpha=dentro.astype(float)
    al=np.clip((dist-14)/48,0,1); alpha[faixa]=al[faixa]
    alpha=np.where(faixa&~fig,np.minimum(alpha,0.55),alpha)
    cor=a.copy(); aa=np.maximum(alpha,1e-3)[...,None]
    limpa=bg+(a-bg)/aa; cor[faixa]=np.clip(limpa[faixa],0,255)
    # escurece levemente a franja para casar com o contorno escuro do desenho
    cor[faixa]=cor[faixa]*0.85
    # falhas claras no contorno (onde a linha guia cortou o traço): viram cor do contorno vizinho
    lum=cor.mean(2); vis=alpha>0.05
    minimo=nd.minimum_filter(np.where(vis,lum,255),size=3)
    perto_fora=nd.binary_dilation(alpha<0.05,iterations=2)
    falha=vis&perto_fora&(lum>minimo+70)&(minimo<110)
    for c in range(3):
        cc=cor[...,c]; viz=nd.minimum_filter(np.where(vis,cc,255),size=3); cc[falha]=viz[falha]
    alpha[falha]=np.maximum(alpha[falha],0.85)
    # todo o desenho tem contorno escuro: pixel claro encostado no transparente recebe a cor do contorno
    vis=alpha>0.3; fora4=nd.binary_dilation(alpha<0.5,structure=np.array([[0,1,0],[1,1,1],[0,1,0]]))
    escuros=vis&(cor.mean(2)<70); tom=np.median(cor[escuros],axis=0) if escuros.any() else np.array([40,32,32])
    claro=(alpha>0.5)&fora4&(cor.mean(2)>140)
    cor[claro]=tom; alpha[claro]=np.maximum(alpha[claro],0.9)
    rgba=np.dstack([cor,alpha*255]).round().astype(np.uint8); rgba[alpha<0.02]=0
    Image.fromarray(rgba).save(f'v2_{nome}.png')
# esquerda = direita espelhada: mesmo rosto, mesmo cabelo, olhando para o lado oposto
Image.open('v2_direita.png').transpose(Image.FLIP_LEFT_RIGHT).save('v2_esquerda.png')
ims=[Image.open(f'v2_{n}.png') for n in ['frente','esquerda','costas','direita']]
W=sum(i.width for i in ims)+30; H=max(i.height for i in ims)
for fundo,nomep in [((30,32,40,255),'prev2.png'),((235,232,225,255),'prev2claro.png')]:
    prev=Image.new('RGBA',(W,H),fundo); x=0
    for i in ims: prev.alpha_composite(i,(x,0)); x+=i.width+10
    prev.resize((W*3,H*3),Image.LANCZOS).save(nomep)
