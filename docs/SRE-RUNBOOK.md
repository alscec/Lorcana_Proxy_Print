# SRE Runbook

## Overview

This runbook provides operational procedures for the Lorcana Proxy Print application.

## Table of Contents

- [Service Overview](#service-overview)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Common Issues](#common-issues)
- [Emergency Procedures](#emergency-procedures)
- [Incident Response](#incident-response)
- [Maintenance Procedures](#maintenance-procedures)

## Service Overview

### Architecture

```
User → Ingress → Service → Deployment → Pods
                                ↓
                           Health Checks
                                ↓
                          Prometheus Metrics
```

### Key Components

- **Application**: Node.js Express server
- **Port**: 3000
- **Health Endpoints**:
  - `/health` - Liveness probe
  - `/ready` - Readiness probe
  - `/metrics` - Prometheus metrics

### Service Level Objectives (SLO)

- **Availability**: 99.9% uptime
- **Response Time**: p95 < 500ms
- **Error Rate**: < 0.1%

## Monitoring and Alerts

### Key Metrics

#### Application Metrics

```promql
# Uptime
process_uptime_seconds

# Memory usage
process_resident_memory_bytes
process_heap_bytes

# Node.js version
nodejs_version_info
```

#### Kubernetes Metrics

```promql
# Pod status
kube_pod_status_phase{namespace="lorcana-proxy"}

# Container restarts
kube_pod_container_status_restarts_total{namespace="lorcana-proxy"}

# CPU usage
container_cpu_usage_seconds_total{namespace="lorcana-proxy"}

# Memory usage
container_memory_usage_bytes{namespace="lorcana-proxy"}
```

### Alert Rules

#### High Memory Usage

```yaml
alert: HighMemoryUsage
expr: process_resident_memory_bytes > 450000000
for: 5m
annotations:
  summary: "High memory usage detected"
  description: "Memory usage is above 450MB for 5 minutes"
```

#### Pod Not Ready

```yaml
alert: PodNotReady
expr: kube_pod_status_ready{namespace="lorcana-proxy"} == 0
for: 2m
annotations:
  summary: "Pod not ready"
  description: "Pod {{ $labels.pod }} is not ready"
```

#### High Error Rate

```yaml
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
for: 5m
annotations:
  summary: "High error rate detected"
  description: "Error rate is above 1% for 5 minutes"
```

### Dashboards

#### Grafana Dashboards

1. **Application Overview**
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Active connections

2. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network traffic

3. **Kubernetes Metrics**
   - Pod status
   - Node status
   - HPA metrics
   - Container restarts

## Common Issues

### 1. Pod Crashes / CrashLoopBackOff

#### Symptoms
```bash
kubectl get pods -n lorcana-proxy
# NAME                                   READY   STATUS             RESTARTS
# lorcana-proxy-print-xxx                0/1     CrashLoopBackOff   5
```

#### Diagnosis

```bash
# Check pod logs
kubectl logs lorcana-proxy-print-xxx -n lorcana-proxy

# Check previous logs if pod restarted
kubectl logs lorcana-proxy-print-xxx -n lorcana-proxy --previous

# Describe pod for events
kubectl describe pod lorcana-proxy-print-xxx -n lorcana-proxy
```

#### Common Causes

1. **Out of Memory**
   - Solution: Increase memory limits
   ```bash
   kubectl set resources deployment/lorcana-proxy-print \
     --limits=memory=1Gi -n lorcana-proxy
   ```

2. **Missing Dependencies**
   - Solution: Rebuild image with correct dependencies

3. **Configuration Error**
   - Solution: Check environment variables and ConfigMaps

### 2. High Memory Usage

#### Symptoms
- Memory usage consistently above 80%
- OOMKilled events

#### Diagnosis

```bash
# Check current memory usage
kubectl top pods -n lorcana-proxy

# Check OOM events
kubectl get events -n lorcana-proxy | grep OOM
```

#### Resolution

1. **Increase Memory Limits**
   ```bash
   kubectl set resources deployment/lorcana-proxy-print \
     --limits=memory=1Gi -n lorcana-proxy
   ```

2. **Scale Horizontally**
   ```bash
   kubectl scale deployment/lorcana-proxy-print --replicas=5 -n lorcana-proxy
   ```

3. **Investigate Memory Leak**
   - Enable heap profiling
   - Analyze with Chrome DevTools
   - Review recent code changes

### 3. Service Unavailable / 503 Errors

#### Symptoms
- Users receiving 503 errors
- Health checks failing

#### Diagnosis

```bash
# Check pod status
kubectl get pods -n lorcana-proxy

# Check service endpoints
kubectl get endpoints lorcana-proxy-print -n lorcana-proxy

# Check ingress
kubectl describe ingress lorcana-proxy-print -n lorcana-proxy

# Test health endpoint
kubectl exec -it <pod-name> -n lorcana-proxy -- curl localhost:3000/health
```

#### Resolution

1. **No Healthy Pods**
   ```bash
   # Check why pods are unhealthy
   kubectl describe pods -n lorcana-proxy
   
   # Force restart
   kubectl rollout restart deployment/lorcana-proxy-print -n lorcana-proxy
   ```

2. **Ingress Issues**
   ```bash
   # Check ingress controller logs
   kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
   
   # Verify ingress rules
   kubectl get ingress -n lorcana-proxy -o yaml
   ```

### 4. Slow Response Times

#### Symptoms
- p95 response time > 500ms
- User complaints about slowness

#### Diagnosis

```bash
# Check pod CPU usage
kubectl top pods -n lorcana-proxy

# Check HPA status
kubectl get hpa -n lorcana-proxy

# Review application logs
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy | grep -i "slow\|timeout"
```

#### Resolution

1. **CPU Throttling**
   ```bash
   kubectl set resources deployment/lorcana-proxy-print \
     --limits=cpu=1000m -n lorcana-proxy
   ```

2. **Scale Out**
   ```bash
   kubectl scale deployment/lorcana-proxy-print --replicas=10 -n lorcana-proxy
   ```

3. **Optimize Code**
   - Review slow queries
   - Add caching
   - Optimize API calls

### 5. Failed Deployments

#### Symptoms
- Deployment stuck in progress
- New pods not coming up

#### Diagnosis

```bash
# Check deployment status
kubectl rollout status deployment/lorcana-proxy-print -n lorcana-proxy

# Check events
kubectl get events -n lorcana-proxy --sort-by='.lastTimestamp'

# Check ReplicaSet
kubectl get rs -n lorcana-proxy
```

#### Resolution

1. **Rollback**
   ```bash
   kubectl rollout undo deployment/lorcana-proxy-print -n lorcana-proxy
   ```

2. **Image Pull Errors**
   ```bash
   # Verify image exists
   docker pull <image-name>
   
   # Check image pull secrets
   kubectl get secrets -n lorcana-proxy
   ```

## Emergency Procedures

### Emergency Rollback

```bash
# 1. Immediate rollback to previous version
kubectl rollout undo deployment/lorcana-proxy-print -n lorcana-proxy

# 2. Verify rollback
kubectl rollout status deployment/lorcana-proxy-print -n lorcana-proxy

# 3. Check pod status
kubectl get pods -n lorcana-proxy

# 4. Test service
curl http://<service-url>/health
```

### Emergency Scale Down

```bash
# Scale down to minimum
kubectl scale deployment/lorcana-proxy-print --replicas=1 -n lorcana-proxy

# Disable HPA temporarily
kubectl delete hpa lorcana-proxy-print-hpa -n lorcana-proxy
```

### Emergency Scale Up

```bash
# Quick scale up
kubectl scale deployment/lorcana-proxy-print --replicas=10 -n lorcana-proxy

# Monitor
watch kubectl get pods -n lorcana-proxy
```

### Service Maintenance Mode

```bash
# 1. Scale to 0 (downtime)
kubectl scale deployment/lorcana-proxy-print --replicas=0 -n lorcana-proxy

# 2. Or update ingress to show maintenance page
kubectl annotate ingress lorcana-proxy-print \
  nginx.ingress.kubernetes.io/custom-http-errors="503" -n lorcana-proxy
```

## Incident Response

### Severity Levels

- **SEV1**: Service completely down, data loss risk
- **SEV2**: Major functionality impaired
- **SEV3**: Minor issues, workaround available
- **SEV4**: Cosmetic issues

### SEV1 Response (Service Down)

1. **Immediate Actions** (0-5 min)
   ```bash
   # Check overall status
   kubectl get pods,svc,ingress -n lorcana-proxy
   
   # Check recent events
   kubectl get events -n lorcana-proxy --sort-by='.lastTimestamp' | tail -20
   
   # Try emergency rollback if recent deployment
   kubectl rollout undo deployment/lorcana-proxy-print -n lorcana-proxy
   ```

2. **Investigation** (5-15 min)
   ```bash
   # Collect logs
   kubectl logs deployment/lorcana-proxy-print -n lorcana-proxy --tail=1000 > incident.log
   
   # Check metrics
   # Access Grafana dashboard
   
   # Check infrastructure
   kubectl get nodes
   kubectl top nodes
   ```

3. **Communication** (Ongoing)
   - Update status page
   - Notify stakeholders
   - Document actions

4. **Resolution** (15+ min)
   - Apply fix
   - Verify service recovery
   - Post-incident review

### Incident Documentation

For each incident, document:
- Timeline of events
- Actions taken
- Root cause
- Resolution
- Preventive measures

## Maintenance Procedures

### Planned Maintenance

1. **Pre-Maintenance**
   ```bash
   # Notify users
   # Schedule during low traffic
   # Prepare rollback plan
   ```

2. **During Maintenance**
   ```bash
   # Enable maintenance mode if needed
   # Apply changes
   # Monitor closely
   ```

3. **Post-Maintenance**
   ```bash
   # Verify service health
   # Check metrics
   # Confirm with stakeholders
   ```

### Deployment Best Practices

1. **Use Blue-Green Deployments**
   ```bash
   # Deploy new version alongside old
   # Switch traffic gradually
   # Keep old version for quick rollback
   ```

2. **Canary Releases**
   ```bash
   # Route 10% traffic to new version
   # Monitor metrics
   # Gradually increase to 100%
   ```

### Backup and Recovery

```bash
# Backup configurations
kubectl get all -n lorcana-proxy -o yaml > backup.yaml

# Backup persistent data (if any)
# kubectl exec -n lorcana-proxy <pod> -- tar czf - /data > backup.tar.gz
```

### Certificate Renewal

```bash
# Check certificate expiry
kubectl get certificate -n lorcana-proxy

# Force renewal
kubectl delete certificate lorcana-proxy-tls -n lorcana-proxy
# cert-manager will recreate automatically
```

## Runbook Maintenance

### Regular Updates

- Review quarterly
- Update after incidents
- Add new procedures as needed
- Remove outdated information

### Testing

- Test procedures in staging
- Validate emergency procedures
- Update runbook with findings

## Contacts

### On-Call Rotation
- Primary: [On-call schedule]
- Secondary: [Backup contact]
- Escalation: [Management contact]

### External Services
- DNS Provider: [Contact]
- Cloud Provider: [Support link]
- Security Team: [Contact]

## References

- [Deployment Guide](DEPLOYMENT.md)
- [GitOps Guide](GITOPS.md)
- [Security Policy](../SECURITY.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

---

Last Updated: 2026-01-12
