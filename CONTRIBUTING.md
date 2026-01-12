# Contributing to Lorcana Proxy Print

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) to report bugs.

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) to suggest features.

Include:
- Clear description of the feature
- Motivation and use case
- Proposed implementation (if any)
- Examples or mockups

### Pull Requests

1. **Fork the repository**
   ```bash
   gh repo fork alscec/Lorcana_Proxy_Print
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   ```bash
   gh pr create --base develop --head your-username:feature/your-feature-name
   ```

## 📋 Code Style

### JavaScript/Node.js

- Use semicolons
- 2 spaces for indentation
- Use `const` and `let`, avoid `var`
- Descriptive variable names
- Comment complex logic

### Example

```javascript
// Good
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Bad
var calc = function(i) {
  var s = 0;
  for(var x=0;x<i.length;x++) s += i[x].price;
  return s;
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- <test-file>
```

### Writing Tests

- Write tests for new features
- Maintain or improve code coverage
- Test edge cases and error conditions

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
feat(api): add endpoint for card search
fix(pdf): correct page layout calculations
docs(readme): update installation instructions
chore(deps): update dependencies
```

## 🔄 GitFlow Workflow

We use GitFlow for branch management:

### Branch Types

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes
- `release/*`: Release preparation

### Workflow

1. **Start Feature**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop Feature**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: implement feature"
   ```

3. **Create PR**
   ```bash
   git push origin feature/my-feature
   gh pr create --base develop
   ```

4. **After Approval**
   - PR is merged to `develop`
   - CI/CD runs tests and builds
   - Deploy to staging (automatic)

5. **Release to Production**
   ```bash
   # Create release branch
   git checkout -b release/v1.0.0 develop
   
   # Final testing
   # Update version numbers
   # Update changelog
   
   # Merge to main and develop
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   
   git checkout develop
   git merge release/v1.0.0
   git push origin develop
   ```

## 🔐 Security

- Never commit secrets or sensitive data
- Use environment variables for configuration
- Report security vulnerabilities privately (see [SECURITY.md](SECURITY.md))
- Run security scans before committing

## 📚 Documentation

### What to Document

- New features and APIs
- Configuration changes
- Breaking changes
- Migration guides

### Where to Document

- Code comments for complex logic
- README.md for overview
- `docs/` for detailed guides
- CHANGELOG.md for changes

## ✅ PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

## 🚀 Development Setup

### Prerequisites

- Node.js v18.x or v20.x
- npm v9.x or later
- Docker (optional)
- kubectl (optional)

### Setup Steps

```bash
# Clone repository
git clone https://github.com/alscec/Lorcana_Proxy_Print.git
cd Lorcana_Proxy_Print

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### With Docker

```bash
# Build image
docker build -t lorcana-proxy-print .

# Run container
docker run -p 3000:3000 lorcana-proxy-print

# Or use docker-compose
docker-compose up -d
```

## 🔍 Code Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Linting and tests
   - Security scanning
   - Code quality checks

2. **Manual Review**
   - Code quality and style
   - Logic and functionality
   - Tests coverage
   - Documentation

3. **Approval**
   - At least 1 approval required
   - All checks must pass
   - Conversation resolved

4. **Merge**
   - Squash and merge (preferred)
   - Merge commit (for releases)

## 🐛 Debugging

### Local Debugging

```bash
# Run with debug logs
DEBUG=* npm run dev

# Use Node.js inspector
node --inspect server.js
```

### Docker Debugging

```bash
# Build without cache
docker build --no-cache -t lorcana-proxy-print .

# Run with interactive terminal
docker run -it lorcana-proxy-print /bin/sh

# View logs
docker logs <container-id>
```

### Kubernetes Debugging

```bash
# Check pod logs
kubectl logs -f deployment/lorcana-proxy-print -n lorcana-proxy

# Execute commands in pod
kubectl exec -it <pod-name> -n lorcana-proxy -- /bin/sh

# Debug container
kubectl debug <pod-name> -n lorcana-proxy --image=busybox
```

## 📊 Performance

### Profiling

```bash
# CPU profiling
node --prof server.js

# Memory profiling
node --inspect server.js
# Then use Chrome DevTools
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

## 🎯 Best Practices

### General

- Keep changes small and focused
- Write clear, descriptive commit messages
- Test thoroughly before submitting
- Respond to review comments promptly
- Keep dependencies up to date

### Code Quality

- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Single Responsibility Principle
- Proper error handling

### Git

- Commit often, push frequently
- Keep commits atomic
- Rebase before merging
- Resolve conflicts carefully

## 🆘 Getting Help

- **Questions**: Open a [Discussion](https://github.com/alscec/Lorcana_Proxy_Print/discussions)
- **Bugs**: Open an [Issue](https://github.com/alscec/Lorcana_Proxy_Print/issues)
- **Chat**: Join our community (if available)

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉

---

Last Updated: 2026-01-12
