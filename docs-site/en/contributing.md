# Contributing Guide

Thank you for your interest in the Nomio.World project! We welcome any form of contribution.

## How to Contribute

### Report Issues

If you find a bug or have a feature suggestion, please submit through GitHub Issues.

#### Bug Report

Please include the following information:
- Problem description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment information

#### Feature Suggestion

Please include the following information:
- Feature description
- Use case
- Implementation suggestion

### Submit Code

1. Fork the project
2. Create feature branch
3. Submit code
4. Create Pull Request

#### Branch Naming

```
feature/add-new-feature
fix/fix-bug
docs/update-docs
```

#### Commit Messages

```
type: short description

Detailed description (optional)

Related Issue (optional)
```

Types include:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code format
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Build/tools

### Development Environment

#### Clone Project

```bash
git clone https://github.com/LemonStudio-hub/nomio-world.git
cd nomio-world
```

#### Install Dependencies

```bash
# Workers
cd workers/api && npm install
cd ../gateway && npm install
cd ../email && npm install

# Dashboard
cd ../../dashboard && npm install
```

#### Start Development

```bash
# Dashboard
cd dashboard
npm run dev
```

### Code Standards

#### TypeScript

- Use TypeScript
- Follow ESLint rules
- Add type annotations

#### Vue

- Use Composition API
- Use `<script setup>`
- Follow Vue style guide

#### CSS

- Use CSS variables
- Follow BEM naming
- Support dark mode

### Testing

#### Run Tests

```bash
# Workers
cd workers/api && npm test
cd ../gateway && npm test
cd ../email && npm test

# Dashboard
cd ../../dashboard && npm test
```

#### Write Tests

- Write tests for new features
- Write tests for bug fixes
- Maintain test coverage

### Documentation

#### Update Documentation

- New features need documentation
- API changes need documentation
- Maintain Chinese and English bilingual

#### Documentation Standards

- Use Markdown
- Follow VitePress standards
- Include code examples

## Code of Conduct

### Respect Others

- Respect different viewpoints
- Be inclusive of different backgrounds
- Avoid personal attacks

### Professional Communication

- Express viewpoints clearly
- Provide constructive feedback
- Maintain friendly attitude

### Follow Rules

- Follow project standards
- Follow open source license
- Respect intellectual property

## License

The project uses the AGPL-3.0 license. Contributing code means you agree to this license.

## Contact

- GitHub Issues
- Email contact

## Acknowledgments

Thanks to all contributors for their efforts!
