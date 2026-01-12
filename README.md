# Lorcana Proxy Print

[![CI/CD Pipeline](https://github.com/alscec/Lorcana_Proxy_Print/actions/workflows/ci.yml/badge.svg)](https://github.com/alscec/Lorcana_Proxy_Print/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/alscec/Lorcana_Proxy_Print)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](Dockerfile)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-326CE5.svg)](k8s/)

Web app / Node.js server for printing proxies for TCG Lorcana.

## ✨ Features

- 📄 REST API for generating printable PDF sheets
- 🖥️ Static UI (optional) under `/public`
- 🔧 Environment-based configuration
- 🐳 Docker and Docker Compose support
- ☸️ Kubernetes manifests included
- 📊 Prometheus metrics endpoint
- 🔒 Security-first design with OPA policies
- 🚀 CI/CD with GitHub Actions
- 📈 SRE-ready with health checks and observability

## 🧱 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express
- **PDF Generation**: pdf-lib
- **Image Processing**: Sharp
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **GitOps**: ArgoCD
- **Security**: CodeQL, Snyk, OPA

## 🚀 Quick Start

### Local Development

```bash
# 1) Install dependencies
npm install

# 2) Configure environment (optional)
cp .env.example .env
# edit .env with your values

# 3) Run development server
npm run dev

# 4) Access the application
# Open http://localhost:3000
```

### Docker

```bash
# Build image
docker build -t lorcana-proxy-print .

# Run container
docker run -p 3000:3000 lorcana-proxy-print

# Or use Docker Compose
docker-compose up -d
```

### Kubernetes

```bash
# Deploy to cluster
kubectl apply -f k8s/

# Check status
kubectl get pods -n lorcana-proxy
```

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[CI/CD Pipeline](docs/CI-CD.md)** - CI/CD setup and configuration
- **[Security Policy](SECURITY.md)** - Security guidelines and reporting

## 🔐 DevSecOps Features

### CI/CD Pipeline
- ✅ Automated testing on multiple Node.js versions
- ✅ Security scanning (npm audit, Snyk, CodeQL)
- ✅ Docker image building and publishing
- ✅ Dependency review and updates (Dependabot)

### GitFlow Integration
- ✅ Branch protection rules
- ✅ PR templates for standardized reviews
- ✅ Issue templates (bug reports, feature requests)
- ✅ Automated dependency updates

### Infrastructure as Code
- ✅ Dockerfile with multi-stage builds
- ✅ Docker Compose for local development
- ✅ Kubernetes manifests (Deployment, Service, Ingress, HPA)
- ✅ Production-ready configurations

### Policy as Code
- ✅ OPA policies for Kubernetes security
- ✅ Dockerfile security policies
- ✅ Automated policy enforcement

### SRE & Observability
- ✅ Health check endpoints (`/health`, `/ready`)
- ✅ Prometheus metrics endpoint (`/metrics`)
- ✅ Structured logging to stdout/stderr
- ✅ Horizontal Pod Autoscaling
- ✅ Resource limits and requests

### GitOps
- ✅ ArgoCD application manifest
- ✅ Automated deployment from Git
- ✅ Self-healing deployments

## 📊 API Endpoints

### Application Endpoints

- `POST /generate` - Generate PDF proxy sheets
  - Body: `{ list: string, pageType?: 'A4'|'LETTER', cropMarks?: boolean }`
  - Returns: PDF file

### Health & Monitoring

- `GET /health` - Health check endpoint
- `GET /ready` - Readiness check endpoint
- `GET /metrics` - Prometheus metrics

## 🛠️ Development

### Prerequisites

- Node.js v18.x or v20.x
- npm v9.x or later

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with NODE_ENV=development
npm run lint       # Run linter (if configured)
npm test           # Run tests (if configured)
```

### Monitoring

```bash
# Start with monitoring stack
docker-compose --profile monitoring up -d

# Access services
# - Application: http://localhost:3000
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
```

## 🔒 Security

This project follows security best practices:

- Non-root container execution
- Security scanning in CI/CD
- Regular dependency updates
- Input validation and sanitization
- CORS configuration
- Security policies enforcement

See [SECURITY.md](SECURITY.md) for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure CI/CD passes
- Use conventional commits

## 📋 Project Structure

```
.
├── .github/
│   ├── workflows/           # GitHub Actions workflows
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml       # Dependency updates config
├── docs/                    # Documentation
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── CI-CD.md             # CI/CD guide
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
├── gitops/                  # GitOps configurations
│   └── argocd-application.yaml
├── monitoring/              # Monitoring configurations
│   ├── prometheus.yml
│   └── grafana/
├── policies/                # Policy as Code (OPA)
│   ├── kubernetes-security.rego
│   └── dockerfile-security.rego
├── public/                  # Static files
│   └── index.html
├── server.js                # Application server
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── SECURITY.md
└── README.md
```

## 🚢 Deployment

Multiple deployment options are available:

- **Local**: `npm start`
- **Docker**: `docker-compose up`
- **Kubernetes**: `kubectl apply -f k8s/`
- **GitOps**: ArgoCD automatic deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 📈 Monitoring

### Metrics

The application exposes Prometheus metrics at `/metrics`:

- `process_uptime_seconds` - Application uptime
- `process_resident_memory_bytes` - Memory usage
- `process_heap_bytes` - Heap memory usage
- `nodejs_version_info` - Node.js version

### Dashboards

Grafana dashboards are included for:
- Application performance
- Resource utilization
- Request metrics

## 🔄 GitFlow

This project follows GitFlow branching model:

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

## 📝 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 👥 Authors

- Original Author - [@alscec](https://github.com/alscec)

## 🙏 Acknowledgments

- Lorcast API for card data
- MTG Print style inspiration
- Open source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alscec/Lorcana_Proxy_Print/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alscec/Lorcana_Proxy_Print/discussions)
- **Security**: See [SECURITY.md](SECURITY.md)

---

Made with ❤️ for the Lorcana community
