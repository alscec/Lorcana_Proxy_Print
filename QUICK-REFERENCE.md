# Quick Reference Card

## 🚀 Quick Start Commands

### Local Development
```bash
npm install           # Install dependencies
npm run dev          # Start development server
```

### Docker
```bash
docker-compose up -d                    # Start all services
docker-compose --profile monitoring up  # Start with monitoring
docker-compose down                     # Stop all services
```

### Kubernetes
```bash
kubectl apply -f k8s/                   # Deploy application
kubectl get pods -n lorcana-proxy       # Check status
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy  # View logs
```

### GitOps (ArgoCD)
```bash
kubectl apply -f gitops/argocd-application.yaml  # Deploy via ArgoCD
argocd app sync lorcana-proxy-print             # Manual sync
argocd app get lorcana-proxy-print              # Check status
```

## 🔍 Health Checks

```bash
curl http://localhost:3000/health    # Health check
curl http://localhost:3000/ready     # Readiness check
curl http://localhost:3000/metrics   # Prometheus metrics
```

## 📊 Monitoring

- **Application**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## 🔐 Security

### Scan for Vulnerabilities
```bash
npm audit                    # Check dependencies
docker scan <image>          # Scan Docker image
```

### Policy Validation
```bash
opa test policies/          # Test OPA policies
hadolint Dockerfile         # Lint Dockerfile
kube-linter lint k8s/       # Lint Kubernetes manifests
```

## 🛠️ Development

### Git Workflow
```bash
# Start new feature
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push -u origin feature/my-feature
gh pr create --base develop
```

### Testing
```bash
npm test                    # Run tests
npm run lint               # Run linter
```

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Kubernetes
kubectl rollout undo deployment/lorcana-proxy-print -n lorcana-proxy

# GitOps
git revert HEAD && git push origin main
```

### Scale Application
```bash
# Scale up
kubectl scale deployment/lorcana-proxy-print --replicas=10 -n lorcana-proxy

# Scale down
kubectl scale deployment/lorcana-proxy-print --replicas=1 -n lorcana-proxy
```

### Check Logs
```bash
# All pods
kubectl logs -f -l app=lorcana-proxy-print -n lorcana-proxy

# Specific pod
kubectl logs -f <pod-name> -n lorcana-proxy

# Docker
docker logs -f lorcana-proxy-print
```

## 📁 Project Structure

```
.
├── .github/              # GitHub workflows and templates
├── docs/                 # Documentation
├── gitops/              # GitOps configurations
├── k8s/                 # Kubernetes manifests
├── monitoring/          # Monitoring configurations
├── policies/            # OPA policies
├── public/              # Static files
├── server.js            # Application server
├── Dockerfile           # Container definition
└── docker-compose.yml   # Local development stack
```

## 📚 Documentation

- **README.md** - Project overview and quick start
- **SECURITY.md** - Security policy and reporting
- **CONTRIBUTING.md** - Contribution guidelines
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/CI-CD.md** - CI/CD pipeline documentation
- **docs/GITOPS.md** - GitOps guide
- **docs/SRE-RUNBOOK.md** - SRE procedures
- **docs/IMPLEMENTATION-SUMMARY.md** - Implementation details

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
NODE_ENV=production
```

### GitHub Secrets (Required for CI/CD)
- `CODECOV_TOKEN` - Code coverage
- `SNYK_TOKEN` - Security scanning
- `DOCKER_USERNAME` - Docker Hub
- `DOCKER_PASSWORD` - Docker Hub

## 🎯 Common Tasks

### Update Dependencies
```bash
npm update               # Update packages
npm audit fix           # Fix vulnerabilities
```

### Build Docker Image
```bash
docker build -t lorcana-proxy-print:latest .
docker run -p 3000:3000 lorcana-proxy-print:latest
```

### Deploy to Kubernetes
```bash
# Apply changes
kubectl apply -f k8s/

# Check rollout status
kubectl rollout status deployment/lorcana-proxy-print -n lorcana-proxy

# Verify deployment
kubectl get all -n lorcana-proxy
```

## 🆘 Getting Help

- **Issues**: https://github.com/alscec/Lorcana_Proxy_Print/issues
- **Discussions**: https://github.com/alscec/Lorcana_Proxy_Print/discussions
- **Security**: See SECURITY.md

## 📈 Metrics

### Available Metrics
- `nodejs_version_info` - Node.js version
- `process_uptime_seconds` - Application uptime
- `process_resident_memory_bytes` - Memory usage
- `process_heap_bytes` - Heap usage

### Query Examples (Prometheus)
```promql
# Memory usage
process_resident_memory_bytes

# Uptime
process_uptime_seconds

# Memory growth rate
rate(process_resident_memory_bytes[5m])
```

---

**Version**: 1.0  
**Last Updated**: 2026-01-12
