# 贡献指南

感谢你对 Nomio.World 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议，请通过 GitHub Issues 提交。

#### Bug 报告

请包含以下信息：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息

#### 功能建议

请包含以下信息：
- 功能描述
- 使用场景
- 实现建议

### 提交代码

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

#### 分支命名

```
feature/add-new-feature
fix/fix-bug
docs/update-docs
```

#### 提交信息

```
类型: 简短描述

详细描述（可选）

相关 Issue（可选）
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 开发环境

#### 克隆项目

```bash
git clone https://github.com/LemonStudio-hub/nomio-world.git
cd nomio-world
```

#### 安装依赖

```bash
# Workers
cd workers/api && npm install
cd ../gateway && npm install
cd ../email && npm install

# Dashboard
cd ../../dashboard && npm install
```

#### 启动开发

```bash
# Dashboard
cd dashboard
npm run dev
```

### 代码规范

#### TypeScript

- 使用 TypeScript
- 遵循 ESLint 规则
- 添加类型注解

#### Vue

- 使用 Composition API
- 使用 `<script setup>`
- 遵循 Vue 风格指南

#### CSS

- 使用 CSS 变量
- 遵循 BEM 命名
- 支持暗色模式

### 测试

#### 运行测试

```bash
# Workers
cd workers/api && npm test
cd ../gateway && npm test
cd ../email && npm test

# Dashboard
cd ../../dashboard && npm test
```

#### 编写测试

- 为新功能编写测试
- 为 bug 修复编写测试
- 保持测试覆盖率

### 文档

#### 更新文档

- 新功能需要文档
- API 变更需要文档
- 保持中英双语

#### 文档规范

- 使用 Markdown
- 遵循 VitePress 规范
- 包含代码示例

## 行为准则

### 尊重他人

- 尊重不同观点
- 包容不同背景
- 避免人身攻击

### 专业交流

- 清晰表达观点
- 提供建设性反馈
- 保持友好态度

### 遵守规则

- 遵守项目规范
- 遵守开源协议
- 尊重知识产权

## 许可证

项目使用 AGPL-3.0 协议。贡献代码即表示你同意该协议。

## 联系方式

- GitHub Issues
- 邮件联系

## 致谢

感谢所有贡献者的付出！
