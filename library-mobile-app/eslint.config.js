// Kết hợp cấu hình ESLint phẳng của Expo và bỏ qua đầu ra thư mục dist.
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  }
]);
