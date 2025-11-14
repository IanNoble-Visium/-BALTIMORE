# Kubernetes Deployment Manifests

This directory contains Kubernetes manifests for deploying the Baltimore Smart City Command Center.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- PostgreSQL database accessible from cluster
- Docker registry access
- NGINX Ingress Controller (for Ingress)
- cert-manager (optional, for TLS)

## Files

- `namespace.yaml`: Creates the namespace
- `configmap.yaml`: Non-sensitive configuration
- `secret.yaml.template`: Template for secrets (copy and fill in values)
- `deployment.yaml`: Application deployment
- `service.yaml`: Service for exposing the application
- `ingress.yaml`: Ingress for external access (optional)
- `migrate-job.yaml`: Database migration job
- `hpa.yaml`: Horizontal Pod Autoscaler (optional)

## Deployment Steps

### 1. Create Secret

Copy the template and fill in your values:

```bash
cp k8s/secret.yaml.template k8s/secret.yaml
# Edit k8s/secret.yaml with your actual values
```

Or create directly with kubectl:

```bash
kubectl create secret generic baltimore-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/db' \
  --from-literal=JWT_SECRET='your-secret' \
  --from-literal=OPENAI_API_KEY='sk-...' \
  --from-literal=VITE_MAPBOX_TOKEN='pk...' \
  -n baltimore-smart-city
```

### 2. Update Image Reference

Edit `deployment.yaml` and `migrate-job.yaml` to use your Docker registry:

```yaml
image: your-registry/baltimore-smart-city:latest
```

### 3. Deploy

```bash
# Apply in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Run database migration
kubectl apply -f k8s/migrate-job.yaml
```

### 4. Verify

```bash
# Check pods
kubectl get pods -n baltimore-smart-city

# Check services
kubectl get svc -n baltimore-smart-city

# Check ingress
kubectl get ingress -n baltimore-smart-city

# View logs
kubectl logs -f deployment/baltimore-smart-city -n baltimore-smart-city
```

## Scaling

The HPA will automatically scale based on CPU and memory usage. You can also manually scale:

```bash
kubectl scale deployment baltimore-smart-city --replicas=5 -n baltimore-smart-city
```

## Updating

To update the application:

1. Build and push new Docker image
2. Update image tag in deployment.yaml
3. Apply: `kubectl apply -f k8s/deployment.yaml`
4. Kubernetes will perform rolling update

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n baltimore-smart-city

# Check logs
kubectl logs <pod-name> -n baltimore-smart-city
```

### Database connection issues

Verify DATABASE_URL in secret and ensure PostgreSQL is accessible from cluster.

### Image pull errors

Ensure image registry credentials are configured:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<pass> \
  -n baltimore-smart-city
```

Then add to deployment.yaml:

```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

