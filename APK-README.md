# Gerar o APK do Vende Fácil Pro

O Lovable roda em ambiente serverless e não consegue compilar arquivos
`.apk` diretamente. Para gerar o APK usamos **GitHub Actions** — é grátis,
automático, e o APK fica disponível para download público.

## Passo 1 — Conectar o Lovable ao GitHub

1. No topo do editor Lovable, clique em **GitHub → Connect to GitHub**.
2. Autorize a Lovable e escolha um nome para o repositório (ex.: `vende-facil-pro`).
3. Confirme. O código será enviado para o seu GitHub automaticamente.

## Passo 2 — Deixar o workflow rodar

Assim que o repositório for criado, o arquivo `.github/workflows/build-apk.yml`
já vai estar lá. Ele roda sozinho no primeiro push e:

- compila o APK Android;
- publica o arquivo em **Releases → `latest-apk`**;
- também deixa o APK em **Actions → último run → Artifacts**.

Para acompanhar: no seu repositório GitHub, aba **Actions**. O primeiro build
leva ~5 minutos.

## Passo 3 — Pegar o link público do APK

Depois que o Release `latest-apk` for criado, o link direto de download será:

```
https://github.com/SEU-USUARIO/SEU-REPO/releases/download/latest-apk/app-debug.apk
```

Copie esse link.

## Passo 4 — Colocar o link na página de vendas

Abra o arquivo `src/lib/apk-config.ts` e substitua `APK_DOWNLOAD_URL` pelo
link do passo 3. Salve — a página de vendas passa a oferecer o botão
"Baixar APK" apontando para o arquivo real.

## Como funciona o APK

O APK é uma "casca" nativa Android que carrega a versão publicada do app
(`https://app-vendas-produtores-e-afiliados.lovable.app`). Isso significa:

- **Toda atualização** que você fizer no Lovable aparece no APK sem precisar
  recompilar nada.
- Você só precisa gerar um APK novo se quiser mudar o **ícone**, o **nome**
  ou permissões nativas.

## Instalação no celular do comprador

O APK é "não assinado pela Play Store", então o Android pede autorização:

1. O comprador baixa o `.apk` pelo link.
2. Abre o arquivo e o Android pergunta se quer permitir instalação de
   "fontes desconhecidas" — basta autorizar.
3. Pronto, o ícone do Vende Fácil Pro aparece na tela.

Essa é a mesma experiência de qualquer app distribuído fora da Play Store.
