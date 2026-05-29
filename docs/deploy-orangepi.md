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
