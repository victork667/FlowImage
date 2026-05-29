# Deploy no Orange Pi

## Ambiente validado

- Orange Pi 4 Pro A733
- Ubuntu Jammy 22.04 aarch64
- Python 3.10
- Backend em `/opt/flowimage/backend`
- Serviço `systemd`: `flowimage-backend`

## Dependências

Use `backend/requirements-orangepi.txt`.

No Orange Pi com Python 3.10 ARM64, `mediapipe==0.10.20` não possui wheel disponível. A versão validada é `mediapipe==0.10.18`.

## Comandos úteis

```bash
sudo systemctl status flowimage-backend
sudo systemctl restart flowimage-backend
sudo journalctl -u flowimage-backend -f
curl http://localhost:8000/health
```

## Tunnel temporário

O Orange Pi foi validado com `cloudflared` usando quick tunnel:

```bash
sudo systemctl status flowimage-tunnel
sudo systemctl restart flowimage-tunnel
sudo journalctl -u flowimage-tunnel -f
```

O quick tunnel gera URL `trycloudflare.com` sem conta e sem garantia de estabilidade. Se o serviço reiniciar, a URL muda e o frontend precisa ser publicado novamente com `VITE_API_BASE_URL` atualizado.

Para descobrir a URL atual:

```bash
sudo journalctl -u flowimage-tunnel --no-pager | grep -o 'https://[^ ]*trycloudflare.com' | tail -1
```

Para produção, criar um tunnel nomeado com hostname em domínio próprio na Cloudflare.

## Atualizar código

```bash
cd /opt/flowimage
sudo git fetch origin main
sudo git reset --hard origin/main
sudo chown -R orangepi:orangepi /opt/flowimage
cd backend
. .venv/bin/activate
pip install -r requirements-orangepi.txt
sudo systemctl restart flowimage-backend
```
