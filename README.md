# cluster-manager-frontend

Vite + React + TypeScript frontend for cluster-manager.

The frontend calls Backend APIs with relative `/api/...` paths. In development, Vite proxies `/api` to `http://localhost:8080`. In k3s, Ingress routes `/api` to the Backend Service and `/` to the Frontend Service.

The nginx container only serves static React assets. It does not proxy `/api`.

## Features

- `/me`
  - Shows the current user's connection guide.
  - Displays namespace, ServiceAccount, dev-container endpoint, token/setup command actions, and connection information returned by Backend APIs.
- `/admin/users`
  - Creates and manages user identity resources.
  - User creation is expected to provision user-side resources only: Namespace when applicable, ServiceAccount, and RBAC.
  - It does not create the dev-container workload.
- `/admin/pods`
  - Creates and manages a user's dev-container environment.
  - The Backend implementation uses Deployment + Service, while the UI labels this operational area as Pods/dev-container environments.
  - Lets admins select a base image from the Backend allow-list when creating an environment.
- Authentication-aware navigation
  - Signed-out users see a login entry point.
  - Signed-in users see `Me` and `Admin` navigation.

## Local Development

```powershell
yarn
yarn build
yarn dev
```

Backend is expected to run on `http://localhost:8080` during development.

## Checks

```powershell
yarn test
yarn lint
yarn build
```

Tests use Vitest + React Testing Library. Current coverage focuses on admin user/environment workflows, login/navigation states, API request behavior, base image selection, and port-forward command handling.

## Authentication

The frontend supports the same two authentication modes as the backend.

Simple mode keeps the MVP user selector and sends `X-User-Id` to the backend:

```powershell
$env:VITE_AUTH_MODE="simple"
yarn dev
```

Keycloak mode redirects the user to Keycloak, stores the returned OIDC access token in `sessionStorage`, and sends API requests with `Authorization: Bearer ...`:

```powershell
$env:VITE_AUTH_MODE="keycloak"
$env:VITE_KEYCLOAK_AUTH_SERVER_URL="https://keycloak.example.com/realms/dev"
$env:VITE_KEYCLOAK_CLIENT_ID="cluster-manager"
yarn dev
```

For local development, register this redirect URI in the Keycloak client:

```text
http://localhost:5173/
```

For k3s/Ingress, register the public frontend origin:

```text
http://cluster-manager.rp.local/
```

The backend should use matching settings such as `CLUSTER_MANAGER_AUTH_MODE=keycloak`, `QUARKUS_OIDC_AUTH_SERVER_URL`, and `QUARKUS_OIDC_CLIENT_ID`.

## Backend API Contract

The frontend assumes the Backend owns all Kubernetes operations. The frontend never talks to the Kubernetes API directly.

### Users

```text
GET /api/users
GET /api/users/{userId}
POST /api/users
DELETE /api/users/{userId}
POST /api/users/{userId}/reconcile
```

`POST /api/users` accepts:

```json
{
  "userId": "alice",
  "displayName": "Alice"
}
```

Expected behavior:

- Creates user-side resources only.
- Namespace mode: Namespace + ServiceAccount + RBAC.
- Container-only mode: ServiceAccount + RBAC.
- Does not create Deployment or Service.
- `displayName` may be stored by the Backend in annotations, but should be returned as `displayName`.

`GET /api/users` and `GET /api/users/{userId}` should return user-side resources even when the dev-container environment has not been created yet. In that case:

```json
{
  "userId": "alice",
  "displayName": "Alice",
  "namespace": "alice",
  "serviceAccount": "alice-sa",
  "deployment": null,
  "service": null,
  "devcontainerEndpoint": null,
  "status": "USER_READY"
}
```

Status values currently expected by the UI:

- `READY`: user resources and environment resources are present.
- `USER_READY`: user resources are present, environment is not created.
- `PARTIAL`: only some expected resources exist.
- `MISSING`: user is missing or detail endpoint returns 404.
- `DELETING`: deletion is in progress.

### Environments

```text
GET /api/environment-base-images
POST /api/users/{userId}/environment
DELETE /api/users/{userId}/environment
GET /api/users/{userId}/port-forward-command
```

`GET /api/environment-base-images` returns the allowed base image catalog:

```json
[
  {
    "id": "ubuntu-dev",
    "label": "Ubuntu",
    "description": "Basic Ubuntu development environment",
    "default": true
  },
  {
    "id": "node-dev",
    "label": "Node.js 22",
    "description": "Node.js development tools"
  }
]
```

The Backend may include `image` in this response when configured to expose it:

```json
{
  "id": "node-dev",
  "label": "Node.js 22",
  "image": "ghcr.io/example/dev-node:22"
}
```

`POST /api/users/{userId}/environment` sends the selected catalog id, not the real container image:

```json
{
  "baseImage": "node-dev"
}
```

Expected behavior:

- Backend validates `baseImage` against its allow-list.
- Unknown ids return 400.
- If `baseImage` is omitted, Backend uses its configured default image.
- Backend resolves the id to the real image and creates Deployment + Service.
- The Deployment should use the user's ServiceAccount.

Environment detail responses may include:

```json
{
  "userId": "alice",
  "namespace": "alice",
  "serviceAccount": "alice-sa",
  "deployment": "devcontainer-alice",
  "service": "devcontainer-alice",
  "baseImage": "node-dev",
  "image": "ghcr.io/example/dev-node:22",
  "devcontainerEndpoint": {
    "nodePort": 30222,
    "sshHost": "cluster.example.local",
    "sshCommand": "ssh ..."
  },
  "status": "READY"
}
```

`DELETE /api/users/{userId}/environment` deletes Service + Deployment but leaves user-side resources in place.

`GET /api/users/{userId}/port-forward-command` is used by the Pods admin page when an environment exists. Namespace mode can return a port-forward command. Container-only mode can return connection guide data through `devcontainerEndpoint`.

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

## Build And Load Into Raspberry Pi / k3s

Build the image locally, save it as a tar archive, copy it to the k3s node, and import it into k3s containerd.

On the machine where Docker is available:

```powershell
docker build -f container/Dockerfile -t cluster-manager-frontend:0.1.0 .
docker save cluster-manager-frontend:0.1.0 -o cluster-manager-frontend_0.1.0.tar
```

Copy the archive to the Raspberry Pi / k3s node:

```powershell
scp .\cluster-manager-frontend_0.1.0.tar <user>@<pi-host>:/tmp/
```

On the k3s node:

```bash
sudo k3s ctr images import /tmp/cluster-manager-frontend_0.1.0.tar
sudo k3s ctr images ls | grep cluster-manager-frontend
```

The frontend manifest uses this local image name:

```yaml
image: cluster-manager-frontend:0.1.0
imagePullPolicy: IfNotPresent
```

`IfNotPresent` lets k3s use the imported local image without pulling from an external registry.

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
- Simple auth mode stores only `userId` in sessionStorage.
- Keycloak auth mode stores the OIDC access token in sessionStorage for the current browser tab/session and sends it only to Backend API requests.
