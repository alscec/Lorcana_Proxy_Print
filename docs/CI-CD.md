# CI/CD Pipeline Guide

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment. The pipeline includes linting, testing, security scanning, building, and deployment.

## Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

Triggered on:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual dispatch

#### Jobs

**Lint and Test**
- Runs on multiple Node.js versions (18.x, 20.x)
- Installs dependencies
- Runs linter (if configured)
- Runs tests (if configured)
- Uploads coverage reports to Codecov

**Security Scan**
- Runs `npm audit` for dependency vulnerabilities
- Runs Snyk security scanning
- Continues on error (non-blocking)

**CodeQL Analysis**
- Performs static code analysis
- Detects security vulnerabilities
- Runs on JavaScript codebase

**Build Docker**
- Triggered only on push to `main` or `develop`
- Builds Docker image
- Pushes to Docker Hub with tags:
  - Branch name
  - Commit SHA
  - `latest` (for main branch only)
- Uses layer caching for faster builds

### 2. Dependency Review (`.github/workflows/dependency-review.yml`)

Triggered on:
- Pull requests to `main` and `develop` branches

Features:
- Reviews new dependencies for security vulnerabilities
- Fails on moderate or higher severity issues
- Posts summary in PR comments

### 3. Dependabot (`.github/dependabot.yml`)

Automatic dependency updates:
- **npm packages**: Weekly on Mondays at 09:00
- **GitHub Actions**: Weekly on Mondays at 09:00
- Groups minor and patch updates
- Auto-labels PRs
- Limits to 10 open PRs

## Setup Requirements

### GitHub Secrets

Configure these secrets in your GitHub repository:

1. **CODECOV_TOKEN** (Optional)
   - For coverage reporting
   - Get from https://codecov.io

2. **SNYK_TOKEN** (Optional)
   - For security scanning
   - Get from https://snyk.io

3. **DOCKER_USERNAME**
   - Docker Hub username
   - Required for Docker image publishing

4. **DOCKER_PASSWORD**
   - Docker Hub password or access token
   - Required for Docker image publishing

### Setting Secrets

```bash
# Via GitHub CLI
gh secret set CODECOV_TOKEN --body "your-token"
gh secret set SNYK_TOKEN --body "your-token"
gh secret set DOCKER_USERNAME --body "your-username"
gh secret set DOCKER_PASSWORD --body "your-password"
```

Or via GitHub UI:
1. Go to repository Settings
2. Navigate to Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret

## Branch Protection Rules

Recommended branch protection for `main`:

```yaml
Require pull request before merging:
  - Require approvals: 1
  - Dismiss stale reviews: true
  - Require review from Code Owners: true

Require status checks to pass:
  - Require branches to be up to date: true
  - Status checks:
    - lint-and-test
    - security-scan
    - codeql-analysis

Require conversation resolution before merging: true
Require signed commits: true (recommended)
Include administrators: true
```

Apply via GitHub UI or API:

```bash
# Via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection -X PUT --input protection.json
```

## Workflow Customization

### Adding Tests

1. Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

2. The CI workflow will automatically run tests

### Adding Linting

1. Add linter script to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

2. Install ESLint:

```bash
npm install --save-dev eslint
npx eslint --init
```

3. The CI workflow will automatically run linting

### Custom Deployment Steps

Add deployment job to `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [lint-and-test, security-scan, build-docker]
  if: github.ref == 'refs/heads/main'
  
  steps:
    - name: Deploy to Cloud
      run: |
        # Your deployment commands
        echo "Deploying to production..."
```

## Environment-Specific Deployments

### Development Environment

Deploys automatically on push to `develop` branch:

```yaml
deploy-dev:
  if: github.ref == 'refs/heads/develop'
  steps:
    - name: Deploy to Dev
      run: echo "Deploy to dev environment"
```

### Production Environment

Deploys automatically on push to `main` branch:

```yaml
deploy-prod:
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to Prod
      run: echo "Deploy to prod environment"
```

## Manual Workflows

Run workflows manually:

```bash
# Via GitHub CLI
gh workflow run ci.yml

# Via GitHub UI
# 1. Go to Actions tab
# 2. Select workflow
# 3. Click "Run workflow"
```

## Monitoring Workflows

### View Workflow Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch <run-id>
```

### Debugging Failed Workflows

1. Check workflow logs in GitHub Actions tab
2. Re-run failed jobs
3. Enable debug logging:

```bash
# Set repository secrets
gh secret set ACTIONS_RUNNER_DEBUG --body "true"
gh secret set ACTIONS_STEP_DEBUG --body "true"
```

## Performance Optimization

### Caching

Dependencies are cached automatically:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

Docker layers are cached:

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Matrix Builds

Test on multiple Node.js versions:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

## Notifications

### Slack Notifications (Optional)

Add to workflow:

```yaml
- name: Slack Notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Build failed on ${{ github.repository }}"
      }
```

### Email Notifications

GitHub sends email notifications automatically for:
- Workflow failures
- PR reviews
- Security alerts

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Limit permissions** - Use minimal permissions for workflows
3. **Pin action versions** - Use specific versions (e.g., `@v4`)
4. **Review dependencies** - Use Dependabot and dependency review
5. **Scan for vulnerabilities** - Use CodeQL, Snyk, npm audit
6. **Sign commits** - Enable commit signing

## Troubleshooting

### Common Issues

**Issue: npm install fails**
```yaml
# Solution: Clear cache
- name: Clear npm cache
  run: npm cache clean --force
```

**Issue: Docker build fails**
```yaml
# Solution: Check Dockerfile and dependencies
- name: Debug Docker
  run: docker build --no-cache .
```

**Issue: Tests timeout**
```yaml
# Solution: Increase timeout
- name: Run tests
  run: npm test
  timeout-minutes: 10
```

## GitFlow Integration

### Branch Strategy

```
main (production)
  └── develop (staging)
       ├── feature/* (features)
       ├── bugfix/* (bug fixes)
       └── hotfix/* (urgent fixes)
```

### Workflow Integration

- **Feature branches**: Create from `develop`, merge back to `develop`
- **Hotfix branches**: Create from `main`, merge to `main` and `develop`
- **Release branches**: Create from `develop`, merge to `main` and `develop`

### Example

```bash
# Start feature
git checkout develop
git checkout -b feature/new-feature

# Push and create PR
git push -u origin feature/new-feature
gh pr create --base develop --head feature/new-feature

# CI runs automatically on PR
# Merge via GitHub UI after approval and checks pass
```

## Cost Optimization

### Free Tier Limits

GitHub Actions free tier:
- Public repositories: Unlimited
- Private repositories: 2,000 minutes/month

### Optimization Tips

1. **Use caching**: Reduces build time and costs
2. **Run on specific events**: Avoid unnecessary runs
3. **Use conditions**: Skip jobs when not needed
4. **Self-hosted runners**: For heavy workloads

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

---

Last Updated: 2026-01-12
