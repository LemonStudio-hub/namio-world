# 贡献指南 / Contributing Guide

[English](#english) | [中文](#中文)

---

## 中文

感谢你对 Namio.World 项目的关注！我们欢迎所有形式的贡献。

### 如何贡献

#### 报告 Bug

1. 在 [Issues](https://github.com/your-org/namio-world/issues) 中搜索是否已有相同问题
2. 如果没有，使用 **Bug Report** 模板创建新 Issue
3. 请包含以下信息：
   - 问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（OS、Node.js 版本、浏览器）
   - 相关日志或截图

#### 提交功能建议

1. 使用 **Feature Request** 模板创建新 Issue
2. 描述你想要的功能及其使用场景
3. 说明为什么这个功能对项目有价值

#### 提交 Pull Request

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/my-feature`
3. 提交更改：`git commit -m 'feat: add my feature'`
4. 推送分支：`git push origin feat/my-feature`
5. 创建 Pull Request

### 开发规范

#### 分支命名

- `feat/xxx` -- 新功能
- `fix/xxx` -- Bug 修复
- `docs/xxx` -- 文档更新
- `refactor/xxx` -- 代码重构
- `test/xxx` -- 测试相关

#### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型：**
- `feat` -- 新功能
- `fix` -- Bug 修复
- `docs` -- 文档
- `style` -- 格式（不影响代码运行）
- `refactor` -- 重构
- `test` -- 测试
- `chore` -- 构建/工具

**示例：**
```
feat(api): add email forwarding endpoint
fix(gateway): handle timeout correctly
docs: update deployment guide
test(auth): add login failure tests
```

#### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint + Prettier 配置
- 运行 `npm run lint` 检查代码
- 运行 `npm run format` 格式化代码

#### 测试要求

- 新功能必须包含测试
- Bug 修复必须包含回归测试
- 运行 `npx vitest run` 确保所有测试通过
- 目标覆盖率：80%+

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/your-org/namio-world.git
cd namio-world

# 安装依赖
cd workers/api && npm install && cd ../..
cd workers/gateway && npm install && cd ../..
cd workers/email && npm install && cd ../..
cd dashboard && npm install && cd ..

# 运行测试
cd workers/api && npx vitest run && cd ../..

# 本地开发
cd workers/api && npx wrangler dev
cd dashboard && npm run dev
```

### 项目结构

```
workers/api/       -- API 后端（Hono）
workers/gateway/   -- 反代网关（Hono）
workers/email/     -- 邮件处理 Worker
dashboard/         -- Vue 3 前端
schema.sql         -- 数据库 Schema
```

---

## English

Thank you for your interest in the Namio.World project! We welcome all forms of contribution.

### How to Contribute

#### Reporting Bugs

1. Search [Issues](https://github.com/your-org/namio-world/issues) for existing reports
2. If none exists, create a new Issue using the **Bug Report** template
3. Include:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Node.js version, browser)
   - Relevant logs or screenshots

#### Suggesting Features

1. Create a new Issue using the **Feature Request** template
2. Describe the desired feature and its use cases
3. Explain why this feature would be valuable

#### Submitting Pull Requests

1. Fork this repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push branch: `git push origin feat/my-feature`
5. Create a Pull Request

### Development Standards

#### Branch Naming

- `feat/xxx` -- New features
- `fix/xxx` -- Bug fixes
- `docs/xxx` -- Documentation
- `refactor/xxx` -- Code refactoring
- `test/xxx` -- Testing

#### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Code Standards

- Use TypeScript strict mode
- Follow ESLint + Prettier configuration
- Run `npm run lint` to check code
- Run `npm run format` to format code

#### Testing Requirements

- New features must include tests
- Bug fixes must include regression tests
- Run `npx vitest run` to ensure all tests pass
- Target coverage: 80%+

### Getting Help

- Read the [Technical Documentation](docs.md)
- Open a [Discussion](https://github.com/your-org/namio-world/discussions)
- Report a [Bug](https://github.com/your-org/namio-world/issues/new?template=bug_report.md)
