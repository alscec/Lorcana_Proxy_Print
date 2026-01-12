# GitOps Guide

## Overview

This guide covers GitOps deployment using ArgoCD for the Lorcana Proxy Print application.

## Table of Contents

- [What is GitOps](#what-is-gitops)
- [Prerequisites](#prerequisites)
- [ArgoCD Installation](#argocd-installation)
- [Application Deployment](#application-deployment)
- [Managing Deployments](#managing-deployments)
- [Rollback Strategies](#rollback-strategies)
- [Best Practices](#best-practices)

## What is GitOps

GitOps is a way of implementing Continuous Deployment for cloud native applications. It focuses on using Git as a single source of truth for declarative infrastructure and applications.

### Key Principles

1. **Declarative**: System state is described declaratively
2. **Versioned**: Desired state is stored in Git
3. **Pulled Automatically**: Changes are automatically pulled and applied
4. **Continuously Reconciled**: Software agents ensure actual state matches desired state

### Benefits

- 🔄 **Automated Deployments**: Automatic synchronization from Git
- 📜 **Audit Trail**: Complete history in Git
- 🔙 **Easy Rollbacks**: Revert to any previous state
- 🔐 **Security**: Git as the single source of truth
- 👥 **Collaboration**: Standard Git workflows (PR, reviews)

## Prerequisites

- Kubernetes cluster (v1.27+)
- kubectl configured
- Git repository access
- ArgoCD CLI (optional)

## ArgoCD Installation

### 1. Install ArgoCD in the cluster

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
```

### 2. Access ArgoCD UI

```bash
# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at https://localhost:8080
```

### 3. Get admin password

```bash
# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

### 4. Login with ArgoCD CLI (Optional)

```bash
# Install ArgoCD CLI
brew install argocd  # macOS
# or download from https://github.com/argoproj/argo-cd/releases

# Login
argocd login localhost:8080 --username admin --password <password>

# Change password
argocd account update-password
```

## Application Deployment

### Method 1: Using kubectl

```bash
# Apply the ArgoCD application manifest
kubectl apply -f gitops/argocd-application.yaml

# Verify application is created
kubectl get application -n argocd
```

### Method 2: Using ArgoCD UI

1. Access ArgoCD UI at https://localhost:8080
2. Click "NEW APP"
3. Fill in the details:
   - **Application Name**: lorcana-proxy-print
   - **Project**: default
   - **Sync Policy**: Automatic
   - **Repository URL**: https://github.com/alscec/Lorcana_Proxy_Print.git
   - **Revision**: main
   - **Path**: k8s
   - **Cluster**: https://kubernetes.default.svc
   - **Namespace**: lorcana-proxy
4. Click "CREATE"

### Method 3: Using ArgoCD CLI

```bash
argocd app create lorcana-proxy-print \
  --repo https://github.com/alscec/Lorcana_Proxy_Print.git \
  --path k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace lorcana-proxy \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

## Managing Deployments

### Check Application Status

```bash
# Using kubectl
kubectl get application lorcana-proxy-print -n argocd

# Using ArgoCD CLI
argocd app get lorcana-proxy-print

# Watch sync status
argocd app wait lorcana-proxy-print
```

### Manual Sync

```bash
# Sync application
argocd app sync lorcana-proxy-print

# Sync with prune (delete resources not in Git)
argocd app sync lorcana-proxy-print --prune

# Hard refresh and sync
argocd app sync lorcana-proxy-print --force
```

### View Logs

```bash
# Application logs
argocd app logs lorcana-proxy-print

# Follow logs
argocd app logs lorcana-proxy-print --follow

# Specific pod logs
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy
```

### Application Details

```bash
# Get detailed app info
argocd app get lorcana-proxy-print

# View diff between Git and cluster
argocd app diff lorcana-proxy-print

# View app history
argocd app history lorcana-proxy-print
```

## Rollback Strategies

### 1. Git-Based Rollback (Recommended)

```bash
# Revert Git commit
git revert HEAD
git push origin main

# ArgoCD will automatically sync the rollback
```

### 2. ArgoCD History Rollback

```bash
# List deployment history
argocd app history lorcana-proxy-print

# Rollback to specific revision
argocd app rollback lorcana-proxy-print <REVISION_ID>
```

### 3. Manual Rollback

```bash
# Delete application (keeps resources)
argocd app delete lorcana-proxy-print --cascade=false

# Recreate with previous version
git checkout <previous-commit>
kubectl apply -f gitops/argocd-application.yaml
```

## Deployment Workflow

### 1. Development Flow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes to k8s manifests
vim k8s/deployment.yaml

# Commit changes
git add k8s/
git commit -m "feat: update deployment configuration"

# Push and create PR
git push origin feature/new-feature
gh pr create --base develop
```

### 2. Promotion Flow

```
feature/* → develop → main
   ↓          ↓         ↓
  Dev       Staging   Production
```

### 3. Automatic Deployment

When PR is merged to `main`:
1. GitHub Actions builds new Docker image
2. Image is pushed to registry with version tag
3. Update k8s/deployment.yaml with new image tag
4. Commit and push to main
5. ArgoCD detects change and syncs
6. New version is deployed automatically

### 4. Image Tag Update Automation

```bash
# Manual update
kubectl set image deployment/lorcana-proxy-print \
  lorcana-proxy-print=lorcana-proxy-print:v1.0.1 \
  -n lorcana-proxy --record

# Update in Git (preferred)
sed -i 's|lorcana-proxy-print:.*|lorcana-proxy-print:v1.0.1|' k8s/deployment.yaml
git add k8s/deployment.yaml
git commit -m "chore: update to v1.0.1"
git push origin main
```

## Multi-Environment Setup

### Directory Structure

```
k8s/
├── base/                 # Base manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/             # Development
│   │   └── kustomization.yaml
│   ├── staging/         # Staging
│   │   └── kustomization.yaml
│   └── production/      # Production
│       └── kustomization.yaml
```

### Create Applications per Environment

```bash
# Development
argocd app create lorcana-proxy-print-dev \
  --repo https://github.com/alscec/Lorcana_Proxy_Print.git \
  --path k8s/overlays/dev \
  --dest-namespace lorcana-proxy-dev

# Staging
argocd app create lorcana-proxy-print-staging \
  --repo https://github.com/alscec/Lorcana_Proxy_Print.git \
  --path k8s/overlays/staging \
  --dest-namespace lorcana-proxy-staging

# Production
argocd app create lorcana-proxy-print-prod \
  --repo https://github.com/alscec/Lorcana_Proxy_Print.git \
  --path k8s/overlays/production \
  --dest-namespace lorcana-proxy-prod
```

## Monitoring and Alerts

### Application Health

ArgoCD continuously monitors:
- Deployment status
- Pod health
- Resource sync status
- Git sync status

### Notifications

Configure notifications for:
- Sync failures
- Health degradation
- Out of sync alerts

Example notification configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [app-deployed]
  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} is now running version {{.app.status.sync.revision}}.
```

## Security Best Practices

1. **Repository Access**: Use deploy keys or SSH keys
2. **RBAC**: Configure ArgoCD RBAC for team access
3. **Secrets Management**: Use sealed-secrets or external secrets
4. **Image Security**: Scan images before deployment
5. **Policy Enforcement**: Use OPA/Gatekeeper for admission control

## Troubleshooting

### Application Out of Sync

```bash
# Check diff
argocd app diff lorcana-proxy-print

# Force sync
argocd app sync lorcana-proxy-print --force
```

### Sync Failures

```bash
# View sync errors
argocd app get lorcana-proxy-print

# Check events
kubectl get events -n lorcana-proxy --sort-by='.lastTimestamp'
```

### Application Stuck

```bash
# Delete and recreate
argocd app delete lorcana-proxy-print
kubectl apply -f gitops/argocd-application.yaml
```

## Best Practices

1. **Use Git Tags**: Tag releases for easy rollback
2. **Separate Repositories**: Consider separate repos for app code and manifests
3. **Environment Branches**: Use branches for different environments
4. **Automated Testing**: Test manifests before merging
5. **Documentation**: Document deployment process
6. **Monitoring**: Set up alerts for sync failures
7. **Secrets**: Never commit secrets to Git
8. **Reviews**: Require PR reviews for production changes

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://www.gitops.tech/)
- [Kustomize Documentation](https://kustomize.io/)

---

Last Updated: 2026-01-12
