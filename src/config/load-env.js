// Import dotenv từ dotenv để dùng trong module.
/**
 * Tệp src/config/load-env.js: cấu hình dịch vụ dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import dotenv from 'dotenv';
// Import { resolve } từ node:path để dùng trong module.
import { resolve } from 'node:path';
// Import { fileURLToPath } từ node:url để dùng trong module.
import { fileURLToPath } from 'node:url';

// Khai báo projectRoot nhận giá trị từ fileURLToPath(new URL('../../', import.meta.url)). const giữ biến không gán lại; let cho phép cập nhật.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
// Gọi/thực thi dotenv.config với các đối số để thực hiện thao tác: dotenv.config({ path: resolve(projectRoot, '.env') })
dotenv.config({ path: resolve(projectRoot, '.env') });
