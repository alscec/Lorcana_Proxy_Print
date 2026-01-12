# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Lorcana Proxy Print seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please do not create a public GitHub issue for the vulnerability.

### 2. Report Privately

Send an email to the maintainer(s) with:
- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**: Regularly update npm packages
2. **Use Environment Variables**: Never commit secrets to the repository
3. **Enable HTTPS**: Always use TLS/SSL in production
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Input Validation**: Validate all user inputs

### For Contributors

1. **Code Review**: All PRs must be reviewed before merging
2. **Security Scanning**: Run security scans before committing
3. **Dependencies**: Use `npm audit` to check for vulnerabilities
4. **Secrets**: Use GitHub Secrets for sensitive data
5. **Least Privilege**: Follow principle of least privilege

## Security Measures in Place

### Application Security

- ✅ Non-root container execution
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Rate limiting considerations
- ✅ Dependency scanning (Dependabot)
- ✅ CodeQL analysis
- ✅ Security headers

### Infrastructure Security

- ✅ Container security scanning
- ✅ Kubernetes security policies
- ✅ Network policies
- ✅ Resource limits
- ✅ Health checks
- ✅ Secrets management

### CI/CD Security

- ✅ Automated security scans
- ✅ Dependency review
- ✅ SAST/DAST integration
- ✅ Container image scanning
- ✅ Branch protection rules

## Vulnerability Disclosure Policy

We follow responsible disclosure practices:

1. Reporter submits vulnerability privately
2. We confirm receipt within 48 hours
3. We investigate and develop a fix
4. We notify the reporter of progress
5. We release the fix
6. We publicly disclose the vulnerability (coordinated disclosure)
7. We credit the reporter (if desired)

## Security Tools Used

- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring
- **CodeQL**: Static code analysis
- **Dependabot**: Automated dependency updates
- **OPA**: Policy as Code enforcement
- **Docker Scan**: Container image scanning

## Compliance

This project aims to follow industry best practices including:

- OWASP Top 10
- CIS Docker Benchmark
- CIS Kubernetes Benchmark
- Node.js Security Best Practices

## Contact

For security concerns, please contact the repository maintainers.

---

Last Updated: 2026-01-12
