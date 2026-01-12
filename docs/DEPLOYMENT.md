# Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [GitOps Deployment](#gitops-deployment)
- [Monitoring and Observability](#monitoring-and-observability)

## Prerequisites

### Required Tools

- **Node.js**: v18.x or v20.x
- **npm**: v9.x or later
- **Docker**: v20.x or later (for containerized deployments)
- **kubectl**: v1.27 or later (for Kubernetes deployments)
- **Helm**: v3.x (optional, for Helm deployments)

### Optional Tools

- **ArgoCD**: For GitOps deployments
- **Prometheus**: For metrics collection
- **Grafana**: For metrics visualization

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/alscec/Lorcana_Proxy_Print.git
cd Lorcana_Proxy_Print
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Create .env file (if needed)
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Docker Deployment

### Build Docker Image

```bash
docker build -t lorcana-proxy-print:latest .
```

### Run with Docker

```bash
docker run -d \
  --name lorcana-proxy-print \
  -p 3000:3000 \
  -e NODE_ENV=production \
  lorcana-proxy-print:latest
```

### Run with Docker Compose

```bash
# Start the application
docker-compose up -d

# Start with monitoring stack
docker-compose --profile monitoring up -d
```

### Access the Application

- **Application**: http://localhost:3000
- **Prometheus**: http://localhost:9090 (with monitoring profile)
- **Grafana**: http://localhost:3001 (with monitoring profile)
  - Default credentials: admin/admin

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.27+)
- kubectl configured
- Ingress controller (e.g., nginx-ingress)

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n lorcana-proxy
kubectl get svc -n lorcana-proxy
kubectl get ing -n lorcana-proxy
```

### Update Image

```bash
kubectl set image deployment/lorcana-proxy-print \
  lorcana-proxy-print=lorcana-proxy-print:v1.0.1 \
  -n lorcana-proxy
```

### Scale Deployment

```bash
# Manual scaling
kubectl scale deployment/lorcana-proxy-print --replicas=5 -n lorcana-proxy

# HPA will automatically scale based on CPU/Memory
```

### Check Logs

```bash
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy
```

## GitOps Deployment

### ArgoCD Setup

1. **Install ArgoCD**

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. **Deploy Application via ArgoCD**

```bash
kubectl apply -f gitops/argocd-application.yaml
```

3. **Access ArgoCD UI**

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access at https://localhost:8080

4. **Get Initial Password**

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Sync Application

```bash
# Manual sync
argocd app sync lorcana-proxy-print

# Auto-sync is enabled by default in the manifest
```

## Monitoring and Observability

### Health Checks

```bash
# Health check
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/ready

# Metrics
curl http://localhost:3000/metrics
```

### Prometheus Metrics

The application exposes Prometheus metrics at `/metrics`:

- `process_uptime_seconds`: Application uptime
- `process_resident_memory_bytes`: Memory usage
- `process_heap_bytes`: Heap memory usage
- `nodejs_version_info`: Node.js version

### Grafana Dashboards

1. Access Grafana at http://localhost:3001
2. Login with admin/admin
3. Prometheus datasource is pre-configured
4. Create custom dashboards or import community dashboards

### Logging

The application logs to stdout/stderr. In Kubernetes:

```bash
# View logs
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy

# View logs from all pods
kubectl logs -f -l app=lorcana-proxy-print -n lorcana-proxy
```

## Rollback

### Docker

```bash
# Stop current container
docker stop lorcana-proxy-print
docker rm lorcana-proxy-print

# Run previous version
docker run -d --name lorcana-proxy-print -p 3000:3000 lorcana-proxy-print:previous-tag
```

### Kubernetes

```bash
# Rollback to previous revision
kubectl rollout undo deployment/lorcana-proxy-print -n lorcana-proxy

# Rollback to specific revision
kubectl rollout undo deployment/lorcana-proxy-print --to-revision=2 -n lorcana-proxy

# Check rollout history
kubectl rollout history deployment/lorcana-proxy-print -n lorcana-proxy
```

## Troubleshooting

### Application Won't Start

1. Check logs: `kubectl logs deployment/lorcana-proxy-print -n lorcana-proxy`
2. Verify environment variables
3. Check resource limits
4. Verify image availability

### High Memory Usage

1. Check metrics at `/metrics`
2. Review resource limits in deployment.yaml
3. Consider horizontal scaling
4. Check for memory leaks

### Performance Issues

1. Enable HPA for auto-scaling
2. Review Prometheus metrics
3. Check database/API response times
4. Consider caching strategies

## Security Considerations

- Always use TLS/SSL in production
- Keep dependencies updated
- Use secrets management for sensitive data
- Follow the principle of least privilege
- Regular security scans
- Enable network policies in Kubernetes

## Production Checklist

- [ ] Environment variables configured
- [ ] TLS/SSL certificates installed
- [ ] Resource limits set appropriately
- [ ] Health checks configured
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Disaster recovery plan
- [ ] Security policies applied
- [ ] Performance testing completed

## Support

For issues and questions:
- GitHub Issues: https://github.com/alscec/Lorcana_Proxy_Print/issues
- Documentation: See `/docs` directory

---

Last Updated: 2026-01-12
