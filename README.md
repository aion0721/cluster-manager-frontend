# cluster-manager-frontend

Vite + React + TypeScript frontend for cluster-manager.

The frontend calls Backend APIs with relative `/api/...` paths. In development, Vite proxies `/api` to `http://localhost:8080`. In k3s, Ingress routes `/api` to the Backend Service and `/` to the Frontend Service.

The nginx container only serves static React assets. It does not proxy `/api`.

## Local Development

```powershell
yarn
yarn build
yarn dev
```

Backend is expected to run on `http://localhost:8080` during development.

## Container Files

Container and k3s deployment files are kept under `container/` so the frontend app source stays separate:

```text
container/
  Dockerfile
  Dockerfile.dockerignore
  nginx.conf
  k8s/
    frontend.yaml
    ingress.yaml
```

Use the repository root as the Docker build context and point Docker at `container/Dockerfile`.

## Local Container Check

```powershell
docker build -f container/Dockerfile -t cluster-manager-frontend:0.1.0 .
docker run --rm -p 8081:80 cluster-manager-frontend:0.1.0
```

Open:

```text
http://localhost:8081
```

## Build And Push For Raspberry Pi / k3s

Example using Docker Desktop buildx for `linux/arm64` and GHCR:

```powershell
docker buildx build `
  --platform linux/arm64 `
  -f container/Dockerfile `
  -t ghcr.io/<your-user>/cluster-manager-frontend:0.1.0 `
  --push `
  .
```

Update `container/k8s/frontend.yaml` with the pushed image name before deploying.

## Deploy To k3s

Frontend and Backend are expected to run in the same namespace:

```text
cluster-manager-system
```

Backend Service expected by the Ingress:

```text
cluster-manager-backend:8080
```

Apply manifests:

```powershell
kubectl apply -f container/k8s/frontend.yaml
kubectl apply -f container/k8s/ingress.yaml
```

Check resources:

```powershell
kubectl -n cluster-manager-system get pods
kubectl -n cluster-manager-system get svc
kubectl -n cluster-manager-system get ingress
```

## Frontend-Only Port Forward Check

```powershell
kubectl -n cluster-manager-system port-forward svc/cluster-manager-frontend 8081:80
```

Open:

```text
http://localhost:8081
```

This checks the frontend static container only. `/api` routing is handled by Ingress in the k3s deployment.

## Ingress Check

Ingress host:

```text
cluster-manager.rp.local
```

Make sure `cluster-manager.rp.local` resolves to the Raspberry Pi / k3s node IP. Configure your local hosts file or local DNS as needed.

The Ingress routes:

- `/api` -> `cluster-manager-backend:8080`
- `/` -> `cluster-manager-frontend:80`

## Security Notes

- The frontend does not call the Kubernetes API Server directly.
- The frontend does not execute kubectl or OS commands.
- Backend API calls use relative `/api/...` paths.
- Tokens, kubectl setup commands, and bash/PowerShell command strings are not stored in localStorage/sessionStorage and are not embedded into the container image.
- The MVP stores only `userId` in sessionStorage.
