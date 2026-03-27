# Rodando no Android com Termux

## Instalação do Termux

> **Importante:** Instale o Termux pelo **F-Droid**, não pelo Google Play.
> A versão do Google Play está desatualizada e não funciona corretamente.
>
> Download: https://f-droid.org/packages/com.termux/

---

## Como copiar o projeto para o celular

Escolha uma das opções:

**Opção A — Git clone (mais fácil):**
```bash
# Dentro do Termux:
pkg install git
git clone <URL_DO_SEU_REPOSITORIO>
cd investimentos
```

**Opção B — USB / cabo:**
1. Conecte o celular ao PC via USB
2. Copie a pasta do projeto para o armazenamento interno
3. No Termux, acesse com:
```bash
cd /sdcard/investimentos   # ou o caminho onde copiou
```

---

## Setup inicial (rode apenas uma vez)

```bash
bash termux/setup.sh
```

Isso vai:
- Instalar Node.js e MariaDB
- Criar o banco de dados
- Instalar as dependências
- Buildar o frontend

---

## Iniciar o sistema

```bash
bash termux/start.sh
```

Depois abra o navegador do celular em:
```
http://localhost:3001
```

Login: **admin** / **123456**

---

## Parar o servidor

Pressione `Ctrl+C` no Termux.

## Observações

- O Termux precisa estar aberto em segundo plano enquanto usa o sistema
- Se o celular reiniciar, rode `bash termux/start.sh` novamente
- O banco de dados fica salvo mesmo após reiniciar
