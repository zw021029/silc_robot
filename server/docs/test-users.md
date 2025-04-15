# 测试账号生成与管理指南

本文档详细说明了如何创建和管理用于测试的账号，包括各种测试场景下的用户类型。

## 测试账号脚本概述

在 `scripts` 目录下提供了多个脚本用于生成不同类型的测试账号：

1. **create-test-users.js**: 创建标准测试用户
2. **create-specific-users.js**: 创建特定场景测试用户
3. **batch-create-users.js**: 批量创建随机测试用户
4. **delete-test-users.js**: 删除所有测试用户

## 标准测试用户 (create-test-users.js)

### 运行方式
```bash
cd /path/to/silc_robot/server
node scripts/create-test-users.js
```

### 创建的用户

| 用户名 | 密码 | 角色 | 机器人 | 积分 | 说明 |
|-------|------|------|-------|-----|------|
| testuser1 | 123456 | user | 悉文 | 0 | 普通用户，已绑定悉文 |
| testuser2 | 123456 | user | 悉荟 | 0 | 普通用户，已绑定悉荟 |
| testuser3 | 123456 | user | 未绑定 | 0 | 新用户，未绑定机器人 |
| testuser4 | 123456 | user | 悉文 | 100 | 有积分的用户 |
| testuser5 | 123456 | user | 悉荟 | 50 | 有积分的用户 |
| admin | admin123 | admin | 悉文 | 0 | 管理员用户 |

## 特定场景测试用户 (create-specific-users.js)

### 运行方式
```bash
cd /path/to/silc_robot/server
node scripts/create-specific-users.js
```

### 创建的用户

| 用户名 | 密码 | 角色 | 机器人 | 积分 | 说明 |
|-------|------|------|-------|-----|------|
| xiwen_user | 123456 | user | 悉文 | 20 | 悉文机器人用户 |
| xihui_user | 123456 | user | 悉荟 | 30 | 悉荟机器人用户 |
| new_user | 123456 | user | 未绑定 | 0 | 未绑定机器人的新用户 |
| rich_user | 123456 | user | 悉文 | 9999 | 拥有大量积分的用户 |
| superadmin | super123 | admin | 悉文 | 1000 | 超级管理员 |

## 批量创建测试用户 (batch-create-users.js)

### 运行方式
```bash
cd /path/to/silc_robot/server
node scripts/batch-create-users.js [数量]
```

可以通过参数指定要创建的用户数量，默认创建10个，最多可创建100个。

### 创建的用户特点

- 用户名格式: `batch_user_[随机数字]`
- 密码: 统一为 `123456`
- 机器人: 随机分配（悉文/悉荟/未绑定）
- 积分: 随机分配（0-199）
- 角色: 统一为普通用户（user）

### 示例
```bash
# 创建20个随机测试用户
node scripts/batch-create-users.js 20
```

## 删除测试用户 (delete-test-users.js)

### 运行方式
```bash
cd /path/to/silc_robot/server
node scripts/delete-test-users.js
```

此脚本会删除以下测试用户：
- 标准测试用户（testuser1~testuser5）
- 特定场景测试用户（xiwen_user, xihui_user, new_user, rich_user）
- 所有以 `batch_user_` 开头的批量创建用户

## 最佳实践

### 测试流程

1. 首先使用 `create-test-users.js` 创建标准测试用户
2. 根据特定测试场景需要，使用 `create-specific-users.js` 创建特定场景用户
3. 需要进行性能测试时，使用 `batch-create-users.js` 批量创建用户
4. 测试完成后，使用 `delete-test-users.js` 清理测试用户

### 注意事项

- 所有测试用户创建前都会检查是否已存在相同用户名的用户，如果已存在则跳过创建
- `selectedRobot` 字段在数据库中为枚举类型，有效值只有 `'悉文'` 和 `'悉荟'`，未绑定机器人时应完全省略此字段
- 批量创建的用户会随机分配是否绑定机器人，约1/3的用户不会绑定机器人
- 脚本运行完成后会自动断开数据库连接

## 扩展与自定义

如需添加其他类型的测试用户，可以编辑相应的脚本文件，添加新的用户数据。例如，要在 `create-specific-users.js` 中添加新的测试用户，只需在 `specificUsers` 数组中添加新的用户对象即可。 