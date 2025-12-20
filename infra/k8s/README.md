# Kubernetes Deployment Manifests

This directory contains all Kubernetes deployment manifests for the Vestify platform. These YAML files define the infrastructure components needed to run the application in a Kubernetes cluster.

## Role of This Folder

This folder serves as the **infrastructure-as-code** layer for the Vestify application. It contains:

- **Service Deployments**: Kubernetes deployments that define how application containers are created and managed
- **Services**: Internal networking configuration for service discovery within the cluster
- **Ingress**: External routing rules for exposing services to the internet
- **Secrets**: Configuration for sensitive environment variables (JWT keys, etc.)
- **Stateful Resources**: Database deployments with persistent storage

All manifests in this directory are automatically deployed by **Skaffold** during development, making this a single source of truth for the development environment infrastructure.

## Files Overview
- `api-gateway-depl.yaml` - API gateway deployment and service (Node.js API)
- `user-depl.yaml` - User service deployment and service (Node.js API)
- `user-mongo-depl.yaml` - MongoDB deployment and service for user data storage
- `client-depl.yaml` - Frontend Next.js client deployment (development mode)
- `ingress-srv.yaml` - NGINX Ingress configuration for routing external traffic
- `user-secrets.yaml` - Kubernetes secrets for user service (JWT_SECRET)
- `redis-depl.yaml` - Redis deployment

## Prerequisites

Before using Skaffold, ensure you have:

1. **Kubernetes cluster** running:
   - Minikube: `minikube start`
   - Docker Desktop: Enable Kubernetes in settings
   - Any other Kubernetes cluster accessible via `kubectl`

2. **kubectl** configured and connected to your cluster:
   ```bash
   kubectl cluster-info
   ```

3. **Skaffold** installed:
   ```bash
   # macOS
   brew install skaffold
   
   # Or download from https://skaffold.dev/docs/install/
   ```

4. **NGINX Ingress Controller** installed:

   **For Minikube:**
   ```bash
   minikube addons enable ingress
   ```

   **For Docker Desktop:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   ```

   **For other clusters:** Follow the [NGINX Ingress Controller installation guide](https://kubernetes.github.io/ingress-nginx/deploy/).

5. **Create Secrets** (one-time setup):
   ```bash
   # Update JWT_SECRET in user-secrets.yaml first, then:
   kubectl apply -f user-secrets.yaml
   ```

## Development with Skaffold

Skaffold is the **recommended way** to develop locally. It handles:
- Automatic Docker image building
- Deployment of all Kubernetes manifests
- File sync for hot reload (no rebuild needed for code changes)
- Port forwarding for local access
- Continuous watching and redeployment on changes

### Quick Start

From the **project root directory**:

```bash
skaffold dev
```

This single command will:
1. ✅ Build Docker images for `user-service` and `client`
2. ✅ Deploy all manifests from `./infra/k8s/*`
3. ✅ Set up file syncing for instant code changes
4. ✅ Forward ports automatically
5. ✅ Watch for changes and rebuild/redeploy as needed

### How Skaffold Works

Skaffold reads `skaffold.yaml` at the project root, which:
- **Builds** images using Docker CLI (local build, no push needed)
- **Deploys** all YAML files from `./infra/k8s/*`
- **Syncs** code changes directly to running containers:
  - `user-service`: Syncs `src/**/*` files to `/app/src` (hot reload via nodemon)
  - `client`: Syncs all files to `/app` (Next.js dev server hot reload)

### File Sync vs Rebuild

- **File Sync**: Code changes in `user-service/src/` and `frontend/` are automatically synced to containers without rebuilding images (fast, < 1 second)
- **Rebuild**: Only happens when:
  - `Dockerfile` changes
  - `package.json` or dependencies change
  - Initial build

### Accessing Services During Development

While `skaffold dev` is running, services are accessible via:

**Port Forwarding (Recommended):**
- **Frontend**: http://localhost:3000 (Next.js dev server with hot reload)
- **User API**: http://localhost:3001 (Express API)

**Via Ingress (if configured):**
- **Frontend**: http://vestify.com (or add to `/etc/hosts` for local testing)
- **User API**: http://vestify.com/api/users

### Stopping Skaffold

Press `Ctrl+C` to stop Skaffold. It will:
- Stop port forwarding
- Clean up deployments (optional, based on your config)
- Stop watching for changes

### Skaffold Commands

```bash
# Start development mode (watches for changes)
skaffold dev

# Run once (no watch mode)
skaffold run

# Clean up all deployments
skaffold delete

# Build images only (no deploy)
skaffold build

# Deploy manifests only (no build)
skaffold deploy
```

## Manual Deployment (Alternative)

If you prefer not to use Skaffold, you can deploy manually:

1. **MongoDB:**
   ```bash
   kubectl apply -f user-mongo-depl.yaml
   kubectl wait --for=condition=available --timeout=120s deployment/user-mongo-depl
   ```

2. **User Service:**
   ```bash
   # Build image manually first
   docker build -t user-service:latest ./user-service
   kubectl apply -f user-depl.yaml
   ```

3. **Client:**
   ```bash
   # Build image manually first
   docker build -t client:latest ./frontend
   kubectl apply -f client-depl.yaml
   ```

4. **Ingress:**
   ```bash
   kubectl apply -f ingress-srv.yaml
   ```

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods
kubectl get pods -w  # Watch mode
```

### View Logs
```bash
# User service
kubectl logs deployment/user-depl -f

# Client
kubectl logs deployment/client-depl -f

# MongoDB
kubectl logs deployment/user-mongo-depl -f
```

### Debug Pod Issues
```bash
# Describe deployment
kubectl describe deployment/user-depl

# Describe pod (replace POD_NAME)
kubectl describe pod POD_NAME

# Shell into pod
kubectl exec -it deployment/user-depl -- sh
```

### Check Services
```bash
kubectl get services
kubectl describe service/user-srv
kubectl describe ingress/ingress-service
```

### Delete All Resources
```bash
# Delete all resources in this directory
kubectl delete -f .

# Or let Skaffold handle cleanup
skaffold delete
```

### Common Issues

**Port already in use:**
- Stop other services using ports 3000/3001
- Or change port forwarding in Skaffold config

**Image pull errors:**
- Ensure `imagePullPolicy: Never` in deployments (for local builds)
- Check that images are built: `docker images`

**Ingress not working:**
- Verify NGINX Ingress Controller is running: `kubectl get pods -n ingress-nginx`
- Check ingress status: `kubectl describe ingress/ingress-service`

## Environment Configuration

### User Service
- `NODE_ENV`: development
- `PORT`: 3001
- `MONGODB_URI`: mongodb://user-mongo-srv:27017/users
- `JWT_SECRET`: From Kubernetes secret
- `JWT_EXPIRES_IN`: 7d
- `CORS_ORIGIN`: http://vestify.com

### Client (Development)
- `NODE_ENV`: development (implicit via Dockerfile)
- `PORT`: 3000
- `NEXT_PUBLIC_API_URL`: https://vestify.com
- `NEXT_DISABLE_CACHE`: true (for faster dev builds)
- Runs Next.js dev server with hot module replacement

### MongoDB
- `MONGO_INITDB_DATABASE`: users
- Port: 27017 (internal cluster access only)

## Notes

- **Development Focus**: These manifests are optimized for local development. For production:
  - Use persistent volumes for MongoDB
  - Implement proper secrets management
  - Add resource limits and requests
  - Enable health checks and liveness probes
  - Use production-ready image tags
  
- **File Sync**: Skaffold's file sync enables instant code updates without image rebuilds, making development much faster.

- **Local Development**: The setup assumes local Kubernetes (Docker Desktop, Minikube). For cloud deployments, update image pull policies and registry configurations.